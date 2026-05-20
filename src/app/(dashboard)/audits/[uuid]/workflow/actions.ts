"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/server-permissions";
import { AUDIT_WORKFLOW_TRANSITIONS } from "@/lib/constants";
import { sendAuditDeliveredEmail } from "@/lib/workflow-emails";
import type { AuditWorkflowStatus } from "@/types/domain";

export interface WorkflowActionResult {
  error: string | null;
  success?: boolean;
  to?: AuditWorkflowStatus;
}

// ============================================================================
// Transition d'un audit dans son workflow éditorial
// ----------------------------------------------------------------------------
// La validation se fait en 4 étapes :
//   1. permission `audit.transition_workflow` (centralisée)
//   2. transition AUTORISÉE depuis l'état courant (matrice JS)
//   3. rôle AUTORISÉ pour cette transition (matrice JS)
//   4. motif obligatoire si `requireReason` (matrice JS)
//
// Le trigger SQL `log_audit_workflow_change` (migration 24) dépose
// automatiquement une ligne dans `audit_logs`. On enrichit ici la même
// transaction logique avec :
//   - une seconde ligne `workflow.note` ou `workflow.request_changes` (selon
//     la transition) portant la raison ;
//   - des notifications in-app aux relecteurs / auditeurs concernés.
// ============================================================================
export async function transitionWorkflow(
  auditId: string,
  target: AuditWorkflowStatus,
  reason?: string | null,
): Promise<WorkflowActionResult> {
  const guard = await requirePermission("audit.transition_workflow");
  if (!guard.ok) return { error: guard.error };

  const supabase = await createClient();
  const t = await getTranslations("errors");

  // État courant de l'audit
  const { data: audit, error: auditError } = await supabase
    .from("audits")
    .select("id, workflow_status")
    .eq("id", auditId)
    .maybeSingle();

  if (auditError) return { error: auditError.message };
  if (!audit) return { error: t("auditNotFound") };

  const current = audit.workflow_status as AuditWorkflowStatus;

  // Transition autorisée depuis l'état courant ?
  const allowed = AUDIT_WORKFLOW_TRANSITIONS[current] ?? [];
  const match = allowed.find((tr) => tr.to === target);

  if (!match) {
    return { error: t("workflowTransitionDenied") };
  }
  if (!match.roles.includes(guard.role)) {
    return { error: t("workflowTransitionRoleDenied") };
  }

  const trimmedReason = reason?.trim();
  if (match.requireReason && !trimmedReason) {
    return { error: t("workflowReasonRequired") };
  }

  // Mise à jour : le trigger SQL ajoute automatiquement un audit_logs minimal.
  const { error: updateError } = await supabase
    .from("audits")
    .update({ workflow_status: target })
    .eq("id", auditId);

  if (updateError) return { error: updateError.message };

  // Ligne audit_logs additionnelle pour la timeline. Le `action` distingue
  // "demande de corrections" d'une note de transition standard.
  if (trimmedReason || match.requireReason) {
    const action =
      current === "in_review" && target === "draft"
        ? "workflow.request_changes"
        : "workflow.note";
    await supabase.from("audit_logs").insert({
      audit_id: auditId,
      actor_id: guard.userId,
      actor_role: guard.role,
      action,
      payload: {
        from: current,
        to: target,
        reason: trimmedReason,
      },
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Notifications in-app (best-effort : on log l'erreur mais on ne casse pas).
  // ──────────────────────────────────────────────────────────────────────────
  try {
    // Lecture en bulk des assignees auditeur + relecteur de l'audit.
    const { data: assigneeRows } = await supabase
      .from("audit_assignees")
      .select("profile_id, role")
      .eq("audit_id", auditId);
    const assignees = assigneeRows ?? [];
    const auditorIds = assignees
      .filter((r) => r.role === "auditor")
      .map((r) => r.profile_id as string);
    const proofreaderIds = assignees
      .filter((r) => r.role === "proofreader")
      .map((r) => r.profile_id as string);

    // Helper pour identifier les profils admin (notifs de validation/livraison
    // remontent à tous les admins de la plateforme).
    const allAdminsLazy = async (): Promise<string[]> => {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "admin")
        .eq("is_active", true);
      return (data ?? []).map((p) => p.id as string);
    };

    // 1) draft → in_review : ping les relecteurs (sinon les auditeurs s'il
    //    n'y en a pas, pour qu'au moins quelqu'un sache que c'est à relire).
    if (current === "draft" && target === "in_review") {
      const targets = proofreaderIds.length > 0 ? proofreaderIds : auditorIds;
      await notifyMany(supabase, {
        userIds: targets,
        senderId: guard.userId,
        auditId,
        type: "workflow.in_review_requested",
      });
    }

    // 2) in_review → draft (request_changes) : ping tous les auditeurs sauf
    //    l'acteur (qui sait déjà ce qu'il vient de faire).
    if (current === "in_review" && target === "draft") {
      await notifyMany(supabase, {
        userIds: auditorIds.filter((id) => id !== guard.userId),
        senderId: guard.userId,
        auditId,
        type: "workflow.request_changes",
      });
    }

    // 3) in_review → validated : ping auditeurs + tous les admins (l'admin
    //    a besoin de savoir qu'un audit est prêt à livrer).
    if (current === "in_review" && target === "validated") {
      const admins = await allAdminsLazy();
      await notifyMany(supabase, {
        userIds: [...auditorIds, ...admins].filter(
          (id) => id !== guard.userId,
        ),
        senderId: guard.userId,
        auditId,
        type: "workflow.validated",
      });
    }

    // 4) → delivered : ping client_admin du client propriétaire +
    //    email automatique au(x) client_admin(s) avec un lien vers l'audit.
    if (target === "delivered" && current !== "delivered") {
      // Récup du client + project pour identifier les client_admin.
      const { data: auditClient } = await supabase
        .from("audits")
        .select(
          `project:projects!inner(name, client:clients!inner(id, name))`,
        )
        .eq("id", auditId)
        .maybeSingle();

      const project = auditClient?.project
        ? Array.isArray(auditClient.project)
          ? auditClient.project[0]
          : auditClient.project
        : null;
      const client = project?.client
        ? Array.isArray(project.client)
          ? project.client[0]
          : project.client
        : null;

      if (client?.id) {
        const { data: clientAdminRows } = await supabase
          .from("profiles")
          .select("id, email, first_name, last_name")
          .eq("client_id", client.id)
          .eq("role", "client_admin")
          .eq("is_active", true);

        const clientAdmins = clientAdminRows ?? [];
        await notifyMany(supabase, {
          userIds: clientAdmins.map((p) => p.id as string),
          senderId: guard.userId,
          auditId,
          type: "workflow.delivered",
        });

        // Email automatique — best-effort, on swallow toute erreur Resend
        // pour ne pas faire échouer la transition workflow.
        for (const ca of clientAdmins) {
          const name = [ca.first_name, ca.last_name]
            .filter((v) => typeof v === "string" && (v as string).trim())
            .join(" ")
            .trim();
          if (typeof ca.email === "string" && ca.email) {
            await sendAuditDeliveredEmail({
              to: ca.email,
              recipientName: name,
              auditId,
              projectName: (project?.name as string | null) ?? "—",
              clientName: (client.name as string | null) ?? "—",
            }).catch((err) => {
              console.error("[transitionWorkflow] delivered email:", err);
            });
          }
        }
      }
    }
  } catch (err) {
    console.error("[transitionWorkflow] notifs failed:", err);
  }

  revalidatePath(`/audits/${auditId}`);
  revalidatePath(`/audits/${auditId}/edit`);
  revalidatePath("/audits");

  return { error: null, success: true, to: target };
}

// ============================================================================
// Helper interne : insère N notifications. Idempotent côté server action,
// le code appelant accepte qu'aucune erreur ne soit remontée à l'utilisateur.
// ============================================================================
type SupabaseLike = Awaited<ReturnType<typeof createClient>>;
async function notifyMany(
  supabase: SupabaseLike,
  payload: {
    userIds: string[];
    senderId: string;
    auditId: string;
    type: string;
  },
): Promise<void> {
  const unique = Array.from(new Set(payload.userIds));
  if (unique.length === 0) return;
  await supabase.from("notifications").insert(
    unique.map((userId) => ({
      user_id: userId,
      sender_id: payload.senderId,
      audit_id: payload.auditId,
      type: payload.type,
    })),
  );
}
