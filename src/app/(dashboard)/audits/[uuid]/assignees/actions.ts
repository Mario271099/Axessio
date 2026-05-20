"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/server-permissions";

export interface AssigneeActionResult {
  error: string | null;
  success?: boolean;
}

// ============================================================================
// Assignation d'un auditeur à un audit (admin uniquement)
// ----------------------------------------------------------------------------
// Le profil cible doit avoir le rôle 'auditor' OU 'admin' (un admin peut être
// désigné lecteur d'un audit même s'il y a déjà accès via is_admin()).
// La policy `assignees_admin` (migration 25) autorise l'INSERT pour is_admin().
// ============================================================================
export async function assignAuditor(
  auditId: string,
  profileId: string,
): Promise<AssigneeActionResult> {
  const guard = await requirePermission("audit.assign_auditor");
  if (!guard.ok) return { error: guard.error };

  const supabase = await createClient();
  const t = await getTranslations("errors");

  // Vérification douce que le profil ciblé est bien staff plateforme.
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

  // ON CONFLICT DO NOTHING équivalent via try/insert + onConflict ne sont
  // pas exposés en JS — on tente l'INSERT et on tolère l'erreur de duplicate.
  const { error } = await supabase.from("audit_assignees").insert({
    audit_id: auditId,
    profile_id: profileId,
    role: "auditor",
  });

  if (error) {
    // 23505 = unique_violation : déjà assigné, on considère succès idempotent.
    if (error.code !== "23505") return { error: error.message };
  }

  // Trace dans audit_logs — la policy `audit_logs_insert` autorise admin/
  // accessible. L'INSERT côté server action force `actor_id = auth.uid()`.
  await supabase.from("audit_logs").insert({
    audit_id: auditId,
    actor_id: guard.userId,
    actor_role: guard.role,
    action: "assignee.added",
    payload: { profile_id: profileId, target_role: target.role },
  });

  revalidatePath(`/audits/${auditId}`);
  return { error: null, success: true };
}

// ============================================================================
// Retrait d'un assignee (admin uniquement)
// ============================================================================
export async function unassignAuditor(
  auditId: string,
  profileId: string,
): Promise<AssigneeActionResult> {
  const guard = await requirePermission("audit.assign_auditor");
  if (!guard.ok) return { error: guard.error };

  const supabase = await createClient();

  const { error } = await supabase
    .from("audit_assignees")
    .delete()
    .eq("audit_id", auditId)
    .eq("profile_id", profileId)
    .eq("role", "auditor");

  if (error) return { error: error.message };

  await supabase.from("audit_logs").insert({
    audit_id: auditId,
    actor_id: guard.userId,
    actor_role: guard.role,
    action: "assignee.removed",
    payload: { profile_id: profileId },
  });

  revalidatePath(`/audits/${auditId}`);
  return { error: null, success: true };
}
