"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/server-permissions";
import type { UserRole } from "@/types/domain";

export interface ProofreaderActionResult {
  error: string | null;
  success?: boolean;
}

// ============================================================================
// Désigner un relecteur (proofreader) sur un audit
// ----------------------------------------------------------------------------
// Permission requise : `audit.assign_auditor` (admin + client_admin). Le
// verrou granulaire — auditor doit être assigné à l'audit — est appliqué
// côté RLS par la policy `assignees_proofreader_manage` (migration 27).
// On laisse aussi passer l'auditor en s'appuyant sur cette policy.
//
// Le profil cible doit être staff (admin ou auditor) ET ne pas être déjà
// auditeur sur cet audit (on évite "se relire soi-même").
// ============================================================================
export async function assignProofreader(
  auditId: string,
  profileId: string,
): Promise<ProofreaderActionResult> {
  const guard = await requirePermissionStaff();
  if (!guard.ok) return { error: guard.error };

  const supabase = await createClient();
  const t = await getTranslations("errors");

  const { data: target } = await supabase
    .from("profiles")
    .select("id, role, is_active")
    .eq("id", profileId)
    .maybeSingle();

  if (!target) return { error: t("userNotFound") };
  if (target.is_active === false) return { error: t("userInactive") };
  if (target.role !== "auditor" && target.role !== "admin") {
    return { error: t("assigneeMustBeStaff") };
  }

  // Détection auto-relecture : la même personne ne peut pas être auteur ET
  // relecteur. C'est un garde-fou métier, pas une contrainte technique stricte.
  const { data: alreadyAuditor } = await supabase
    .from("audit_assignees")
    .select("profile_id")
    .eq("audit_id", auditId)
    .eq("profile_id", profileId)
    .eq("role", "auditor")
    .maybeSingle();
  if (alreadyAuditor) {
    return { error: t("proofreaderCannotBeAuditor") };
  }

  const { error } = await supabase.from("audit_assignees").insert({
    audit_id: auditId,
    profile_id: profileId,
    role: "proofreader",
  });

  if (error && error.code !== "23505") {
    return { error: error.message };
  }

  // Trace + notification
  await supabase.from("audit_logs").insert({
    audit_id: auditId,
    actor_id: guard.userId,
    actor_role: guard.role,
    action: "proofreader.assigned",
    payload: { profile_id: profileId },
  });

  // Le nouveau relecteur reçoit une notif pour découvrir l'audit qui
  // l'attend, même si l'audit n'est pas encore in_review.
  await supabase.from("notifications").insert({
    user_id: profileId,
    sender_id: guard.userId,
    audit_id: auditId,
    type: "proofreader.assigned",
  });

  revalidatePath(`/audits/${auditId}`);
  return { error: null, success: true };
}

export async function unassignProofreader(
  auditId: string,
  profileId: string,
): Promise<ProofreaderActionResult> {
  const guard = await requirePermissionStaff();
  if (!guard.ok) return { error: guard.error };

  const supabase = await createClient();

  const { error } = await supabase
    .from("audit_assignees")
    .delete()
    .eq("audit_id", auditId)
    .eq("profile_id", profileId)
    .eq("role", "proofreader");

  if (error) return { error: error.message };

  await supabase.from("audit_logs").insert({
    audit_id: auditId,
    actor_id: guard.userId,
    actor_role: guard.role,
    action: "proofreader.removed",
    payload: { profile_id: profileId },
  });

  revalidatePath(`/audits/${auditId}`);
  return { error: null, success: true };
}

// ----------------------------------------------------------------------------
// Garde dédiée : `canAssignProofreader` = admin + auditor. On ne passe pas
// par `requirePermission("audit.assign_auditor")` car cette permission est
// aussi accordée au client_admin, qui n'a pas vocation à désigner un
// relecteur interne (RLS bloquerait de toute façon).
// ----------------------------------------------------------------------------
async function requirePermissionStaff(): Promise<
  { ok: true; userId: string; role: UserRole } | { ok: false; error: string }
> {
  const guardAdmin = await requirePermission("audit.transition_workflow");
  if (!guardAdmin.ok) return guardAdmin;
  return guardAdmin;
}
