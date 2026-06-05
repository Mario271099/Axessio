// Helpers serveur pour les server actions. Ne JAMAIS importer côté client
// (l'import de createClient depuis "@/lib/supabase/server" déclencherait un
// crash car cette factory utilise `cookies()`).

import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { can, type Permission } from "@/lib/permissions";
import type { UserRole } from "@/types/domain";

interface PermissionGuardSuccess {
  ok: true;
  userId: string;
  role: UserRole;
}

interface PermissionGuardFailure {
  ok: false;
  error: string;
}

export type PermissionGuard = PermissionGuardSuccess | PermissionGuardFailure;

/**
 * Garde standard pour les server actions : récupère l'utilisateur authentifié,
 * vérifie qu'il possède la permission demandée, renvoie un échec typé sinon.
 *
 * Toujours utiliser CE helper plutôt que d'inliner `profile.role === "auditor"` :
 * il garantit que le nouveau rôle `admin` est traité comme une extension stricte
 * du staff (admin hérite des permissions auditeur via la matrice
 * `PERMISSIONS`), et que tout ajout de rôle futur passe par un seul point.
 */
export async function requirePermission(
  permission: Permission,
): Promise<PermissionGuard> {
  const supabase = await createClient();
  const t = await getTranslations("errors");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: t("notAuthenticated") };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role as UserRole | undefined;
  if (!role || !can(role, permission)) {
    return { ok: false, error: t("forbidden") };
  }
  return { ok: true, userId: user.id, role };
}

/**
 * Garde combinée legacy + org : autorise si l'utilisateur a la permission via
 * son rôle plateforme legacy (`profiles.role`) OU via son rôle d'organisation
 * sur l'org active (`has_org_permission`).
 *
 * C'est le helper à utiliser pour les actions du domaine audit pendant la
 * coexistence des deux modèles (cf. ROLES_ROADMAP.md, bascule 6C.2) : le staff
 * plateforme (auditor/admin legacy) continue de passer, et un owner/auditor
 * d'org self-serve passe désormais aussi — chacun scopé à son périmètre par la
 * RLS (la 2ᵉ ligne de défense reste `has_org_permission_on(..., org_id)`).
 */
export async function requireAnyPermission(
  permission: Permission,
): Promise<PermissionGuard> {
  const supabase = await createClient();
  const t = await getTranslations("errors");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: t("notAuthenticated") };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = (profile?.role as UserRole | undefined) ?? "client";

  // 1. Branch legacy (rôle plateforme).
  if (can(role, permission)) {
    return { ok: true, userId: user.id, role };
  }

  // 2. Branch org : permission atomique sur l'org active.
  const { data, error } = await supabase.rpc("has_org_permission", {
    p_code: permission,
  });
  if (!error && data === true) {
    return { ok: true, userId: user.id, role };
  }

  return { ok: false, error: t("forbidden") };
}

// ============================================================================
// RBAC org-scopé (Phase 3 — alignée sur migrations 47/48)
// ============================================================================

/**
 * Vérifie une permission atomique sur l'organisation active de l'utilisateur
 * (cf. `current_org()` SQL = `profiles.current_org_id`). C'est le helper à
 * privilégier dans les nouvelles server actions : il interroge directement
 * la matrice `role_permissions` persistée, donc reste cohérent avec ce que
 * la RLS verra.
 *
 * Retourne `false` si l'utilisateur n'a pas d'org active OU si le RPC échoue
 * (fail-closed).
 */
export async function hasOrgPermission(code: Permission): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("has_org_permission", {
    p_code: code,
  });
  if (error) return false;
  return data === true;
}

/**
 * Précharge l'ensemble des permissions effectives sur l'org active en un
 * seul round-trip. Utile pour préparer un objet `perms` exposé au layout
 * client (au lieu de N appels `hasOrgPermission`).
 */
export async function loadMyOrgPermissions(): Promise<Set<Permission>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_org_permissions");
  if (error || !Array.isArray(data)) return new Set();
  return new Set(data as Permission[]);
}

interface OrgPermissionGuardSuccess {
  ok: true;
  userId: string;
}

export type OrgPermissionGuard =
  | OrgPermissionGuardSuccess
  | PermissionGuardFailure;

/**
 * Variante org-scopée de `requirePermission`. À utiliser dans les server
 * actions qui ciblent une ressource appartenant à l'org active. La double
 * vérification (code + RLS) reste essentielle : ce guard sert à donner un
 * message d'erreur lisible avant que la RLS coupe la requête.
 */
export async function requireOrgPermission(
  permission: Permission,
): Promise<OrgPermissionGuard> {
  const supabase = await createClient();
  const t = await getTranslations("errors");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: t("notAuthenticated") };

  const { data, error } = await supabase.rpc("has_org_permission", {
    p_code: permission,
  });
  if (error || data !== true) {
    return { ok: false, error: t("forbidden") };
  }
  return { ok: true, userId: user.id };
}
