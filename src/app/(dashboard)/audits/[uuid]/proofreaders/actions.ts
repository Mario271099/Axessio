"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/server-permissions";

export interface ProofreaderActionResult {
  error: string | null;
  success?: boolean;
}

// ============================================================================
// Désigner un relecteur (proofreader) sur un audit
// ----------------------------------------------------------------------------
// Permission requise : `audit.assign_auditor` (admin + client_admin depuis
// la spec rôles). La RLS (migration 35) restreint en plus le client_admin
// aux audits de son propre client.
//
// Le profil cible doit être staff (admin ou auditor) ET ne pas être déjà
// auditeur sur cet audit (on évite "se relire soi-même").
// ============================================================================
export async function assignProofreader(
  auditId: string,
  profileId: string,
): Promise<ProofreaderActionResult> {
  const guard = await requirePermission("audit.assign_auditor");
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
  const guard = await requirePermission("audit.assign_auditor");
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
