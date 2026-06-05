import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  readImpersonationCookie,
  resolveEffectiveRole,
} from "@/lib/impersonation";
import type { Profile, UserRole } from "@/types/domain";

interface ProfileRow {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  client_id: string | null;
  language: string;
  avatar_url?: string | null;
  is_active?: boolean | null;
  is_platform_admin?: boolean | null;
}

async function mapProfile(row: ProfileRow): Promise<Profile> {
  const realRole = row.role as UserRole;
  const cookieRole = await readImpersonationCookie();
  const { effective, impersonating } = resolveEffectiveRole(
    realRole,
    cookieRole,
  );
  // Fallback : si la colonne n'est pas encore peuplée (compte pré-mig. 69),
  // on retombe sur le legacy `role === 'admin'` pour garantir l'accès du
  // super-admin Axessyo dans tous les cas.
  const isPlatformAdmin =
    row.is_platform_admin === true || realRole === "admin";
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    role: effective,
    realRole,
    impersonating,
    clientId: row.client_id,
    language: (row.language === "en" ? "en" : "fr") as Profile["language"],
    avatarUrl: row.avatar_url ?? null,
    isPlatformAdmin,
  };
}

export async function requireProfile(): Promise<Profile> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, email, first_name, last_name, role, client_id, language, avatar_url, is_active, is_platform_admin",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(`Erreur de récupération du profil : ${error.message}`);
  }

  // Compte désactivé : on coupe la session et on redirige vers /login.
  // `is_active` peut être absent (anciens profils, bases pre-migration 15) ;
  // dans ce cas on traite comme actif pour ne pas verrouiller l'historique.
  if (data && data.is_active === false) {
    await supabase.auth.signOut();
    redirect("/login?reason=disabled");
  }

  // Profil manquant : on le crée à la volée
  if (!data) {
    const { data: created, error: insertError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email ?? "",
        first_name: "",
        last_name: "",
        role: "client" as UserRole,
        client_id: null,
        language: "fr",
      })
      .select(
        "id, email, first_name, last_name, role, client_id, language, avatar_url, is_platform_admin",
      )
      .single();

    if (insertError || !created) {
      throw new Error("Profil utilisateur introuvable et impossible à créer.");
    }

    // Observabilité : un profil créé à la volée = un user qui a obtenu une
    // session Supabase Auth sans passer par le flow d'invitation (signup
    // public, magic link). On le trace pour détecter les états incohérents
    // (role=client sans client_id). Le console.warn sera capté par Sentry une
    // fois branché (cf. roadmap S1.5).
    console.warn(
      `[requireProfile] profil auto-créé id=${user.id} email=${user.email ?? "?"} (role=client, client_id=null)`,
    );
    try {
      // audit_logs a RLS (SELECT only) : l'insert doit passer par la
      // service-role pour ne pas être refusé. Best-effort — on ne bloque
      // jamais l'authentification sur un échec de log.
      const admin = createAdminClient();
      await admin.from("audit_logs").insert({
        actor_id: user.id,
        actor_role: "client",
        action: "profile.auto_created",
        payload: { email: user.email ?? null, source: "requireProfile" },
      });
    } catch {
      // swallow : la trace est best-effort.
    }

    return await mapProfile(created);
  }

  return await mapProfile(data);
}
