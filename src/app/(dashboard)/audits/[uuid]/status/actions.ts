"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/server-permissions";
import {
  AUDIT_STATUS_TRANSITIONS,
  evaluateTransition,
  type AuditLifecycleSnapshot,
  type AuditStatusErrorCode,
} from "@/lib/audit-status";
import { sendAuditDeliveredEmail } from "@/lib/workflow-emails";
import type { AuditStatus } from "@/types/domain";

export interface StatusTransitionResult {
  ok: boolean;
  newStatus?: AuditStatus;
  errorCode?: AuditStatusErrorCode;
  message?: string;
  /** Contexte d'interpolation (matrice incomplète, date future, etc.). */
  context?: Record<string, string | number>;
}

// ============================================================================
// transitionAuditStatus(auditId, target)
// ----------------------------------------------------------------------------
// Server action centrale du cycle de vie audit_status. Pipeline :
//   1. Permission `audit.edit` (admin + auditor).
//   2. Charge le statut courant + snapshot des conditions (RPC).
//   3. Vérifie matrice de transitions + rôle.
//   4. Évalue les conditions métier (via evaluateTransition).
//   5. UPDATE audits.status (+ delivered_at si DELIVERED).
//   6. Insert audit_logs (action='status.transition').
//   7. Renvoie un résultat typé avec errorCode + context.
// ============================================================================
export async function transitionAuditStatus(
  auditId: string,
  target: AuditStatus,
): Promise<StatusTransitionResult> {
  const guard = await requirePermission("audit.edit");
  if (!guard.ok) {
    return {
      ok: false,
      errorCode: "STATUS_ROLE_DENIED",
      message: guard.error,
    };
  }

  const supabase = await createClient();
  const t = await getTranslations("audits.statusTransitions.errors");

  // 1) Charge le statut courant
  const { data: audit, error: auditError } = await supabase
    .from("audits")
    .select("id, status")
    .eq("id", auditId)
    .maybeSingle();
  if (auditError) return { ok: false, message: auditError.message };
  if (!audit) {
    return {
      ok: false,
      errorCode: "STATUS_INVALID_SOURCE",
      message: t("STATUS_INVALID_SOURCE"),
    };
  }

  const current = audit.status as AuditStatus;

  // 2) Transition autorisée par la matrice + rôle ?
  const transition = AUDIT_STATUS_TRANSITIONS.find(
    (tr) => tr.from === current && tr.to === target && tr.manual,
  );
  if (!transition) {
    return {
      ok: false,
      errorCode: "STATUS_INVALID_TARGET",
      message: t("STATUS_INVALID_TARGET"),
    };
  }
  if (!transition.roles.includes(guard.role)) {
    return {
      ok: false,
      errorCode: "STATUS_ROLE_DENIED",
      message: t("STATUS_ROLE_DENIED"),
    };
  }

  // 3) Snapshot des conditions via RPC (1 aller-retour)
  const { data: snapshotRows, error: snapError } = await supabase.rpc(
    "audit_status_lifecycle_view",
    { p_audit_id: auditId },
  );
  if (snapError) return { ok: false, message: snapError.message };
  const snapRow = Array.isArray(snapshotRows) ? snapshotRows[0] : snapshotRows;
  const snapshot: AuditLifecycleSnapshot = {
    representativeCount: Number(snapRow?.representative_count ?? 0),
    matrixFilled: Number(snapRow?.matrix_filled ?? 0),
    matrixTotal: Number(snapRow?.matrix_total ?? 0),
    matrixPercent: Number(snapRow?.matrix_percent ?? 0),
    startDateSet: Boolean(snapRow?.start_date_set ?? false),
    startDateReached: Boolean(snapRow?.start_date_reached ?? false),
  };

  // 4) Évaluation des conditions métier
  const readiness = evaluateTransition(current, target, snapshot);
  if (!readiness.ready) {
    return {
      ok: false,
      errorCode: readiness.errorCode,
      message: readiness.errorCode ? t(readiness.errorCode) : undefined,
      context: readiness.context,
    };
  }

  // 5) UPDATE + side effects
  const updates: Record<string, unknown> = { status: target };
  if (target === "DELIVERED") {
    updates.delivered_at = new Date().toISOString();
  }

  const { error: updateError } = await supabase
    .from("audits")
    .update(updates)
    .eq("id", auditId);
  if (updateError) return { ok: false, message: updateError.message };

  // 6) Trace audit_logs
  await supabase.from("audit_logs").insert({
    audit_id: auditId,
    actor_id: guard.userId,
    actor_role: guard.role,
    action: "status.transition",
    payload: { from: current, to: target, manual: true },
  });

  // 7) Side-effects notifs / emails (best-effort, ne bloquent pas la transition)
  if (target === "DELIVERED") {
    try {
      const { data: row } = await supabase
        .from("audits")
        .select(
          `project:projects!inner(name, client:clients!inner(id, name))`,
        )
        .eq("id", auditId)
        .maybeSingle();
      const project = row?.project
        ? Array.isArray(row.project)
          ? row.project[0]
          : row.project
        : null;
      const client = project?.client
        ? Array.isArray(project.client)
          ? project.client[0]
          : project.client
        : null;
      if (client?.id) {
        const { data: clientAdmins } = await supabase
          .from("profiles")
          .select("id, email, first_name, last_name")
          .eq("client_id", client.id)
          .eq("role", "client_admin")
          .eq("is_active", true);
        for (const ca of clientAdmins ?? []) {
          // Notif in-app
          await supabase.from("notifications").insert({
            user_id: ca.id as string,
            sender_id: guard.userId,
            audit_id: auditId,
            type: "audit.delivered",
          });
          // Email Resend (best-effort)
          if (typeof ca.email === "string" && ca.email) {
            const name = [ca.first_name, ca.last_name]
              .filter((v) => typeof v === "string" && (v as string).trim())
              .join(" ")
              .trim();
            await sendAuditDeliveredEmail({
              to: ca.email,
              recipientName: name,
              auditId,
              projectName: (project?.name as string | null) ?? "—",
              clientName: (client.name as string | null) ?? "—",
              // 1 client legacy = 1 organization (id préservé, backfill mig. 43)
              organizationId: (client.id as string | null) ?? null,
            }).catch((err) => {
              console.error("[transitionAuditStatus] delivered email:", err);
            });
          }
        }
      }
    } catch (err) {
      console.error("[transitionAuditStatus] delivered notifs:", err);
    }
  }

  revalidatePath(`/audits/${auditId}`);
  revalidatePath("/audits");
  revalidatePath("/dashboard");

  return { ok: true, newStatus: target };
}

// ============================================================================
// revertAuditStatus(auditId, expectedFrom, target)
// ----------------------------------------------------------------------------
// Annule la dernière transition manuelle. Utilisé par le toast « Annuler »
// qui apparaît 5 secondes après une transition réussie dans
// AuditStatusActions. Contrairement à `transitionAuditStatus`, on bypass
// la matrice de transitions (qui est forward-only) et les conditions
// métier - on veut juste remettre l'audit dans son état précédent.
//
// Garde-fou : on n'autorise l'annulation que si le statut courant est
// bien `expectedFrom` (le statut juste après la transition à annuler).
// Si l'audit a été modifié depuis (un cron a déclenché une auto-transition,
// un autre user a bougé), on refuse - sinon on écraserait son travail.
//
// Side-effects nettoyés selon le statut d'origine :
//   - DELIVERED → IN_PROGRESS : clear delivered_at
//   - ONLINE → COMPLETED : clear online_at
// ============================================================================
export async function revertAuditStatus(
  auditId: string,
  expectedFrom: AuditStatus,
  target: AuditStatus,
): Promise<StatusTransitionResult> {
  const guard = await requirePermission("audit.edit");
  if (!guard.ok) {
    return {
      ok: false,
      errorCode: "STATUS_ROLE_DENIED",
      message: guard.error,
    };
  }

  const supabase = await createClient();
  const t = await getTranslations("audits.statusTransitions.errors");

  const { data: audit } = await supabase
    .from("audits")
    .select("id, status")
    .eq("id", auditId)
    .maybeSingle();

  if (!audit) {
    return {
      ok: false,
      errorCode: "STATUS_INVALID_SOURCE",
      message: t("STATUS_INVALID_SOURCE"),
    };
  }

  // Statut courant a changé depuis la transition → refuser (course
  // probablement avec un cron auto ou un autre acteur).
  if ((audit.status as AuditStatus) !== expectedFrom) {
    return {
      ok: false,
      errorCode: "STATUS_INVALID_SOURCE",
      message: t("STATUS_INVALID_SOURCE"),
    };
  }

  const updates: Record<string, unknown> = { status: target };
  // Nettoyage des timestamps figés à la transition d'origine.
  if (expectedFrom === "DELIVERED") updates.delivered_at = null;
  if (expectedFrom === "ONLINE") updates.online_at = null;

  const { error: updateError } = await supabase
    .from("audits")
    .update(updates)
    .eq("id", auditId);
  if (updateError) return { ok: false, message: updateError.message };

  await supabase.from("audit_logs").insert({
    audit_id: auditId,
    actor_id: guard.userId,
    actor_role: guard.role,
    action: "status.reverted",
    payload: { from: expectedFrom, to: target, manual: true },
  });

  revalidatePath(`/audits/${auditId}`);
  revalidatePath("/audits");
  revalidatePath("/dashboard");

  return { ok: true, newStatus: target };
}
