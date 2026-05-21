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
