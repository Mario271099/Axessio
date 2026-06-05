// Inscription self-serve : crée un compte + une organisation dont le nouvel
// utilisateur devient owner, avec le plan Free (posé par le trigger
// `handle_new_organization`). Tout le provisioning passe par la service-role
// (createAdminClient) car :
//   - la création de l'utilisateur Auth est une opération admin ;
//   - l'insertion du membership `owner` ne peut PAS passer par la RLS
//     (`org_members_manage` exige déjà un admin d'org, or l'org vient de
//     naître sans aucun membre — cf. commentaire migration 42).
//
// Le login lui-même reste côté client (signInWithPassword) après le 200 : on
// suit la convention d'auth du projet (cookie posé par le navigateur).
//
// Choix du rôle legacy `client_admin` : un inscrit self-serve administre SA
// propre org. `client_admin` est tenant-scopé (`accessible_project_ids` le
// borne à son `client_id`) — contrairement à `auditor`, qui via `is_auditor()`
// verrait TOUS les tenants. On ne donne donc jamais `auditor` à un signup
// public (fuite cross-tenant). cf. CLAUDE.md (précédence des autorisations).

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit, retryAfterSeconds } from "@/lib/rate-limit";
import { clientIp, sanitizeLoginEmail } from "@/lib/login-audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 5 inscriptions / heure / IP : large pour un humain, serré contre un script
// qui créerait des comptes en boucle.
const REGISTER_LIMIT = 5;
const REGISTER_WINDOW_MS = 60 * 60_000;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface RegisterBody {
  firstName?: unknown;
  lastName?: unknown;
  organization?: unknown;
  email?: unknown;
  password?: unknown;
}

function passwordMeetsCriteria(password: string): boolean {
  return (
    password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)
  );
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}

export async function POST(req: Request) {
  const ip = clientIp(req);

  const limit = await rateLimit(
    `register:${ip}`,
    REGISTER_LIMIT,
    REGISTER_WINDOW_MS,
  );
  if (!limit.ok) {
    const retryAfter = retryAfterSeconds(limit.resetMs);
    return NextResponse.json(
      { error: "rateLimited", retryAfter },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  let body: RegisterBody;
  try {
    body = (await req.json()) as RegisterBody;
  } catch {
    return NextResponse.json({ error: "missing" }, { status: 400 });
  }

  const firstName =
    typeof body.firstName === "string" ? body.firstName.trim().slice(0, 100) : "";
  const lastName =
    typeof body.lastName === "string" ? body.lastName.trim().slice(0, 100) : "";
  const organization =
    typeof body.organization === "string"
      ? body.organization.trim().slice(0, 120)
      : "";
  const email = sanitizeLoginEmail(body.email);
  const password = typeof body.password === "string" ? body.password : "";

  if (!firstName || !lastName || !organization || !email || !password) {
    return NextResponse.json({ error: "missing" }, { status: 400 });
  }
  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "invalidEmail" }, { status: 400 });
  }
  if (!passwordMeetsCriteria(password)) {
    return NextResponse.json({ error: "weakPassword" }, { status: 400 });
  }

  const admin = createAdminClient();

  // 1. Création de l'utilisateur Auth. `email_confirm: true` : on confirme
  //    d'emblée (Resend est en sandbox — pas d'email de confirmation fiable).
  //    Les métadonnées alimentent le trigger `handle_new_user` qui crée le
  //    profil (prénom/nom/role).
  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        role: "client_admin",
      },
    });

  if (createError || !created?.user) {
    // Supabase renvoie une 422 / message explicite quand l'email existe déjà.
    const message = createError?.message?.toLowerCase() ?? "";
    if (
      message.includes("already") ||
      message.includes("registered") ||
      message.includes("exists")
    ) {
      return NextResponse.json({ error: "emailTaken" }, { status: 409 });
    }
    return NextResponse.json({ error: "server" }, { status: 500 });
  }

  const userId = created.user.id;

  // 2. Création de l'organisation. Le trigger `handle_new_organization` pose
  //    une subscription Free, et `handle_new_organization_workspace` un
  //    workspace `default`. Slug unique : on suffixe en cas de collision.
  let slug = slugify(organization) || "org";
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data: existing } = await admin
      .from("organizations")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) break;
    slug = `${slugify(organization) || "org"}-${randomSuffix()}`;
  }

  const { data: org, error: orgError } = await admin
    .from("organizations")
    .insert({
      slug,
      name: organization,
      type: "company",
      billing_email: email,
    })
    .select("id")
    .single();

  if (orgError || !org) {
    // Rollback best-effort de l'utilisateur Auth pour ne pas laisser un compte
    // orphelin sans org (l'utilisateur pourra ré-essayer proprement).
    await admin.auth.admin.deleteUser(userId).catch(() => {});
    return NextResponse.json({ error: "server" }, { status: 500 });
  }

  // Helper de rollback : la suppression de l'org cascade sur ses dépendances
  // (subscription, workspace, membership) ; on retire ensuite l'utilisateur.
  async function rollback() {
    try {
      await admin.from("organizations").delete().eq("id", org!.id);
    } catch {
      // best-effort
    }
    await admin.auth.admin.deleteUser(userId).catch(() => {});
  }

  // 3. Membership owner. DOIT précéder l'écriture de current_org_id : le
  //    trigger anti-forge `validate_profile_current_org` (migration 46) refuse
  //    de pointer vers une org dont on n'est pas membre.
  const { error: memberError } = await admin
    .from("organization_members")
    .insert({
      organization_id: org.id,
      user_id: userId,
      role: "owner",
    });

  if (memberError) {
    await rollback();
    return NextResponse.json({ error: "server" }, { status: 500 });
  }

  // 4. Org active = la nouvelle org (source de vérité de `current_org()`).
  await admin
    .from("profiles")
    .update({ current_org_id: org.id })
    .eq("id", userId);

  // 5. Trace best-effort.
  try {
    await admin.from("audit_logs").insert({
      actor_id: userId,
      actor_role: "client_admin",
      organization_id: org.id,
      action: "auth.self_register",
      payload: { email, organization, slug, ip },
    });
  } catch {
    // best-effort : un échec de log ne casse pas l'inscription.
  }

  return NextResponse.json({ ok: true });
}
