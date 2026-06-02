"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { canManageClients, canManageProjects } from "@/lib/permissions";
import type { UserRole } from "@/types/domain";

export interface ClientActionState {
  error: string | null;
  success?: boolean;
  clientId?: string;
  projectId?: string;
}

type PermCheck = (role: UserRole) => boolean;

async function requirePerm(check: PermCheck): Promise<{
  supabase: Awaited<ReturnType<typeof createSupabaseClient>>;
  error: string | null;
}> {
  const supabase = await createSupabaseClient();
  const t = await getTranslations("errors");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, error: t("notAuthenticated") };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role as UserRole | undefined;
  if (!role || !check(role)) {
    return { supabase, error: t("forbidden") };
  }

  return { supabase, error: null };
}

// ============================================================================
// 1. Création d'un client
// ----------------------------------------------------------------------------
// Convention legacy (cf. backfill migration 43) : un client = une
// organisation, partageant le même UUID. Pour qu'un nouveau client soit
// fonctionnel (création de projets/audits derrière), on doit donc :
//   1. générer un UUID partagé,
//   2. créer la ligne `organizations` (FK depuis `projects.organization_id`),
//   3. créer la ligne `clients`,
//   4. inscrire l'utilisateur courant en tant qu'owner de cette org (sauf
//      pour les super-admin, qui ont déjà accès via `is_admin()`).
//
// Les triggers `trg_org_autocreate_subscription` (mig. 51) et
// `trg_org_autocreate_workspace` (mig. 54) se chargent automatiquement de
// créer une subscription `free` et un workspace par défaut.
// ============================================================================

/** Slugifie un nom pour générer un slug d'organisation. Sans accents,
 *  alphanumériques + tirets, lowercase. Suffixe court ajouté pour éviter
 *  les collisions (slug est unique sur `organizations`). */
function slugifyForOrg(name: string, uuid: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const suffix = uuid.replace(/-/g, "").slice(0, 6);
  return base ? `${base}-${suffix}` : `client-${suffix}`;
}

export async function createClient(
  formData: FormData,
): Promise<ClientActionState> {
  const { supabase, error: authError } = await requirePerm(canManageClients);
  if (authError) return { error: authError };
  const t = await getTranslations("errors");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: t("notAuthenticated") };

  const name = formData.get("name")?.toString().trim();
  const website = formData.get("website")?.toString().trim() || null;
  const contactEmail =
    formData.get("contact_email")?.toString().trim() || null;
  const contactName = formData.get("contact_name")?.toString().trim() || null;

  if (!name) return { error: t("clientNameRequired") };

  // UUID partagé entre `organizations` et `clients`. On génère côté Node
  // (Web Crypto) pour pouvoir l'utiliser dans les deux insertions sans
  // round-trip supplémentaire.
  const sharedId = crypto.randomUUID();
  const slug = slugifyForOrg(name, sharedId);
  const billingEmail = contactEmail ?? user.email ?? "billing@axessio.app";

  // 1) Org miroir. Si l'insertion échoue (slug en doublon, perm…), on
  //    n'a rien créé — pas besoin de rollback.
  const { error: orgError } = await supabase.from("organizations").insert({
    id: sharedId,
    slug,
    name,
    type: "company",
    billing_email: billingEmail,
  });
  if (orgError) {
    return { error: orgError.message };
  }

  // 2) Client avec le même id.
  const { error: clientError } = await supabase
    .from("clients")
    .insert({
      id: sharedId,
      name,
      website,
      contact_email: contactEmail,
      contact_name: contactName,
    });
  if (clientError) {
    // Best-effort rollback de l'org pour ne pas laisser un orphelin.
    await supabase.from("organizations").delete().eq("id", sharedId);
    return { error: clientError.message };
  }

  // 3) Auto-membership owner pour l'utilisateur courant. Les super-admin
  //    ont déjà accès via `is_admin()` mais on ajoute la ligne pour
  //    qu'`organization_members` reflète la propriété réelle de l'org.
  await supabase.from("organization_members").insert({
    organization_id: sharedId,
    user_id: user.id,
    role: "owner",
  });

  revalidatePath("/clients");
  return { error: null, success: true, clientId: sharedId };
}

// ============================================================================
// 2. Mise à jour d'un client
// ============================================================================
export async function updateClient(
  clientId: string,
  formData: FormData,
): Promise<ClientActionState> {
  const { supabase, error: authError } = await requirePerm(canManageClients);
  if (authError) return { error: authError };
  const t = await getTranslations("errors");

  const name = formData.get("name")?.toString().trim();
  const website = formData.get("website")?.toString().trim() || null;
  const contactEmail =
    formData.get("contact_email")?.toString().trim() || null;
  const contactName = formData.get("contact_name")?.toString().trim() || null;

  if (!name) return { error: t("clientNameRequired") };

  const { error } = await supabase
    .from("clients")
    .update({
      name,
      website,
      contact_email: contactEmail,
      contact_name: contactName,
    })
    .eq("id", clientId);

  if (error) return { error: error.message };

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  return { error: null, success: true, clientId };
}

// ============================================================================
// 3. Activation / désactivation d'un client
// ============================================================================
export async function toggleClientActive(
  clientId: string,
  isActive: boolean,
): Promise<ClientActionState> {
  const { supabase, error: authError } = await requirePerm(canManageClients);
  if (authError) return { error: authError };

  const { error } = await supabase
    .from("clients")
    .update({ is_active: isActive })
    .eq("id", clientId);

  if (error) return { error: error.message };

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  return { error: null, success: true, clientId };
}

// ============================================================================
// 4. Création d'un projet (rattaché à un client)
// ============================================================================
export async function createProject(
  clientId: string,
  formData: FormData,
): Promise<ClientActionState> {
  const { supabase, error: authError } = await requirePerm(canManageProjects);
  if (authError) return { error: authError };
  const t = await getTranslations("errors");

  const name = formData.get("name")?.toString().trim();
  const url = formData.get("url")?.toString().trim() || null;

  if (!name) return { error: t("projectNameRequired") };

  // Migration 44 : `projects.organization_id NOT NULL` avec FK vers
  // `organizations(id)`. Convention legacy : `clients.id == organizations.id`
  // (cf. createClient ci-dessus) — clientId vaut donc aussi organizationId.
  //
  // Migration 55 : `projects.workspace_id NOT NULL`. On le récupère depuis
  // le workspace `default` de l'org (auto-créé par mig. 54). La migration
  // 65 fournit un trigger backstop, mais on le passe explicitement pour
  // que le code marche même avant que la migration 65 ne soit appliquée.
  const { data: defaultWs } = await supabase
    .from("workspaces")
    .select("id")
    .eq("organization_id", clientId)
    .eq("is_default", true)
    .maybeSingle();

  const { data, error } = await supabase
    .from("projects")
    .insert({
      client_id: clientId,
      organization_id: clientId,
      workspace_id: defaultWs?.id ?? null,
      name,
      url,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? t("createProjectFailed") };
  }

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/projects");
  return { error: null, success: true, projectId: data.id };
}

// ============================================================================
// 5. Mise à jour d'un projet
// ============================================================================
export async function updateProject(
  projectId: string,
  clientId: string,
  formData: FormData,
): Promise<ClientActionState> {
  const { supabase, error: authError } = await requirePerm(canManageProjects);
  if (authError) return { error: authError };
  const t = await getTranslations("errors");

  const name = formData.get("name")?.toString().trim();
  const url = formData.get("url")?.toString().trim() || null;

  if (!name) return { error: t("projectNameRequired") };

  const { error } = await supabase
    .from("projects")
    .update({ name, url })
    .eq("id", projectId);

  if (error) return { error: error.message };

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/projects");
  return { error: null, success: true, projectId };
}

// ============================================================================
// 6. Suppression d'un projet (uniquement si aucun audit lié)
// ============================================================================
export async function deleteProject(
  projectId: string,
  clientId: string,
): Promise<ClientActionState> {
  const { supabase, error: authError } = await requirePerm(canManageProjects);
  if (authError) return { error: authError };
  const t = await getTranslations("errors");

  const { count, error: countError } = await supabase
    .from("audits")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);

  if (countError) return { error: countError.message };

  if ((count ?? 0) > 0) {
    return { error: t("projectHasAudits") };
  }

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId);

  if (error) return { error: error.message };

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/projects");
  return { error: null, success: true, projectId };
}
