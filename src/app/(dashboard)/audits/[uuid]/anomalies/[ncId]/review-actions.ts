"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { requireFeature } from "@/lib/billing/server";
import { canCreateNC, canEditNC } from "@/lib/permissions";
import type { NCReviewStatus, UserRole } from "@/types/domain";

export interface NCReviewActionResult {
  ok: boolean;
  newStatus?: NCReviewStatus;
  errorCode?:
    | "NC_REVIEW_DENIED"
    | "NC_REVIEW_INVALID_STATE"
    | "NC_REVIEW_REASON_REQUIRED"
    | "NC_REVIEW_NO_PROOFREADER"
    | "NC_NOT_FOUND";
  message?: string;
}

// ============================================================================
// Helper : récupère NC + audit_id + role d'assignement de l'utilisateur courant
// ----------------------------------------------------------------------------
// Renvoie le rôle d'assignment ('auditor' | 'proofreader' | null), ou
// 'admin' si l'utilisateur est admin (court-circuit). Permet aux server
// actions de valider qui peut faire quoi.
// ============================================================================
interface NCContext {
  ncId: string;
  auditId: string;
  reviewStatus: NCReviewStatus;
  assignmentRole: "auditor" | "proofreader" | "admin" | null;
  userId: string;
  userRole: UserRole;
}

async function loadNCContext(
  ncId: string,
): Promise<NCContext | { error: string }> {
  const supabase = await createClient();
  const t = await getTranslations("errors");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: t("notAuthenticated") };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const userRole = (profile?.role ?? null) as UserRole | null;
  if (!userRole) return { error: t("forbidden") };

  const { data: nc } = await supabase
    .from("non_conformities")
    .select("id, audit_id, review_status")
    .eq("id", ncId)
    .maybeSingle();
  if (!nc) return { error: t("auditNotFound") };

  // Détermine le rôle d'assignment de l'utilisateur sur l'audit.
  let assignmentRole: NCContext["assignmentRole"] = null;
  if (userRole === "admin") {
    assignmentRole = "admin";
  } else {
    const { data: assignment } = await supabase
      .from("audit_assignees")
      .select("role")
      .eq("audit_id", nc.audit_id as string)
      .eq("profile_id", user.id);
    const roles = (assignment ?? []).map((r) => r.role as string);
    if (roles.includes("auditor")) assignmentRole = "auditor";
    else if (roles.includes("proofreader")) assignmentRole = "proofreader";
  }

  return {
    ncId,
    auditId: nc.audit_id as string,
    reviewStatus: nc.review_status as NCReviewStatus,
    assignmentRole,
    userId: user.id,
    userRole,
  };
}

// ============================================================================
// 1) requestNCReview — auditeur demande une relecture
// ----------------------------------------------------------------------------
// Source : not_requested | changes_requested | approved
// Cible  : pending
// ============================================================================
export async function requestNCReview(
  ncId: string,
): Promise<NCReviewActionResult> {
  const ctx = await loadNCContext(ncId);
  if ("error" in ctx) return { ok: false, message: ctx.error };
  const t = await getTranslations("audits.ncReview.errors");

  // Feature gate : cycle de relecture inclus à partir de Pro. On n'ouvre
  // PAS de nouveau cycle si le plan ne le permet pas. Les transitions
  // (approve/changes/cancel) d'un cycle déjà ouvert restent accessibles.
  const feature = await requireFeature("audit.proofreading");
  if (!feature.ok) {
    return {
      ok: false,
      errorCode: "NC_REVIEW_DENIED",
      message: feature.error,
    };
  }

  // Permission : tout utilisateur qui peut créer/éditer une NC peut aussi
  // demander une relecture, qu'il soit assigné nominativement à l'audit ou
  // non. Auparavant on exigeait `audit_assignees.role = 'auditor'`, ce qui
  // bloquait notamment les auditeurs qui venaient juste de créer la NC
  // (post-create flow du formulaire) sans être listés dans assignees.
  const allowedByRole =
    ctx.assignmentRole === "admin" ||
    ctx.assignmentRole === "auditor" ||
    canCreateNC(ctx.userRole) ||
    canEditNC(ctx.userRole);
  if (!allowedByRole) {
    return { ok: false, errorCode: "NC_REVIEW_DENIED", message: t("NC_REVIEW_DENIED") };
  }

  // Transition valide ?
  const allowed: NCReviewStatus[] = [
    "not_requested",
    "changes_requested",
    "approved",
  ];
  if (!allowed.includes(ctx.reviewStatus)) {
    return {
      ok: false,
      errorCode: "NC_REVIEW_INVALID_STATE",
      message: t("NC_REVIEW_INVALID_STATE"),
    };
  }

  const supabase = await createClient();

  // L'absence de relecteur n'est plus bloquante — on ouvre quand même le
  // cycle pour que l'auditeur puisse poser le drapeau « relecture demandée »
  // côté NC. La notification est juste skippée (filter renverra vide), et un
  // relecteur assigné plus tard verra la NC en `pending` dès son arrivée.
  const { data: proofreaders } = await supabase
    .from("audit_assignees")
    .select("profile_id")
    .eq("audit_id", ctx.auditId)
    .eq("role", "proofreader");

  const { error } = await supabase
    .from("non_conformities")
    .update({
      review_status: "pending",
      review_requested_at: new Date().toISOString(),
      review_requested_by: ctx.userId,
      review_resolved_at: null,
      review_resolved_by: null,
    })
    .eq("id", ncId);
  if (error) return { ok: false, message: error.message };

  // Audit log
  await supabase.from("audit_logs").insert({
    audit_id: ctx.auditId,
    actor_id: ctx.userId,
    actor_role: ctx.userRole,
    action: "nc.review_requested",
    payload: { nc_id: ncId, from: ctx.reviewStatus, to: "pending" },
  });

  // Notif aux relecteurs (sauf si c'est l'auteur — peu probable). Si
  // aucun relecteur n'est assigné on saute l'insert : pas d'erreur, le
  // cycle reste ouvert et la NC apparaît en `pending` pour le prochain
  // relecteur ajouté.
  const notifRows = (proofreaders ?? [])
    .filter((p) => (p.profile_id as string) !== ctx.userId)
    .map((p) => ({
      user_id: p.profile_id as string,
      sender_id: ctx.userId,
      audit_id: ctx.auditId,
      nc_id: ncId,
      type: "nc.review_requested",
    }));
  if (notifRows.length > 0) {
    await supabase.from("notifications").insert(notifRows);
  }

  revalidatePath(`/audits/${ctx.auditId}/anomalies/${ncId}`);
  revalidatePath(`/audits/${ctx.auditId}/anomalies`);
  return { ok: true, newStatus: "pending" };
}

// ============================================================================
// 2) openNCReview — relecteur ouvre la NC, auto pending → under_review
// ----------------------------------------------------------------------------
// Idempotent : si déjà under_review/changes_requested/approved, no-op.
// Appelée silencieusement par la page de détail NC quand un relecteur l'ouvre.
// ============================================================================
export async function openNCReview(
  ncId: string,
): Promise<NCReviewActionResult> {
  const ctx = await loadNCContext(ncId);
  if ("error" in ctx) return { ok: false, message: ctx.error };

  if (ctx.assignmentRole !== "admin" && ctx.assignmentRole !== "proofreader") {
    // Pas une erreur "dure" : un auditeur qui consulte n'ouvre pas la relecture.
    return { ok: true, newStatus: ctx.reviewStatus };
  }
  if (ctx.reviewStatus !== "pending") {
    return { ok: true, newStatus: ctx.reviewStatus };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("non_conformities")
    .update({ review_status: "under_review" })
    .eq("id", ncId)
    .eq("review_status", "pending"); // garde-fou concurrent
  if (error) return { ok: false, message: error.message };

  // Audit log discret
  await supabase.from("audit_logs").insert({
    audit_id: ctx.auditId,
    actor_id: ctx.userId,
    actor_role: ctx.userRole,
    action: "nc.review_opened",
    payload: { nc_id: ncId, from: "pending", to: "under_review" },
  });

  revalidatePath(`/audits/${ctx.auditId}/anomalies/${ncId}`);
  return { ok: true, newStatus: "under_review" };
}

// ============================================================================
// 3) requestNCChanges — relecteur demande des corrections (motif obligatoire)
// ============================================================================
export async function requestNCChanges(
  ncId: string,
  reason: string,
): Promise<NCReviewActionResult> {
  const ctx = await loadNCContext(ncId);
  if ("error" in ctx) return { ok: false, message: ctx.error };
  const t = await getTranslations("audits.ncReview.errors");

  if (ctx.assignmentRole !== "admin" && ctx.assignmentRole !== "proofreader") {
    return { ok: false, errorCode: "NC_REVIEW_DENIED", message: t("NC_REVIEW_DENIED") };
  }
  if (ctx.reviewStatus !== "under_review" && ctx.reviewStatus !== "pending") {
    return {
      ok: false,
      errorCode: "NC_REVIEW_INVALID_STATE",
      message: t("NC_REVIEW_INVALID_STATE"),
    };
  }
  const trimmed = reason?.trim();
  if (!trimmed) {
    return {
      ok: false,
      errorCode: "NC_REVIEW_REASON_REQUIRED",
      message: t("NC_REVIEW_REASON_REQUIRED"),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("non_conformities")
    .update({
      review_status: "changes_requested",
      review_resolved_at: new Date().toISOString(),
      review_resolved_by: ctx.userId,
    })
    .eq("id", ncId);
  if (error) return { ok: false, message: error.message };

  // Audit log + message en fil review (la "raison" devient un message
  // visible dans l'historique de discussion).
  await supabase.from("audit_logs").insert({
    audit_id: ctx.auditId,
    actor_id: ctx.userId,
    actor_role: ctx.userRole,
    action: "nc.review_changes_requested",
    payload: { nc_id: ncId, reason: trimmed },
  });

  await supabase.from("nc_messages").insert({
    non_conformity_id: ncId,
    author_id: ctx.userId,
    body: trimmed,
    thread: "review",
  });

  // Notif aux auditeurs assignés (sauf l'acteur, qui n'est jamais auditeur ici)
  const { data: auditors } = await supabase
    .from("audit_assignees")
    .select("profile_id")
    .eq("audit_id", ctx.auditId)
    .eq("role", "auditor");
  if ((auditors ?? []).length > 0) {
    await supabase.from("notifications").insert(
      (auditors ?? [])
        .filter((a) => (a.profile_id as string) !== ctx.userId)
        .map((a) => ({
          user_id: a.profile_id as string,
          sender_id: ctx.userId,
          audit_id: ctx.auditId,
          nc_id: ncId,
          type: "nc.review_changes_requested",
        })),
    );
  }

  revalidatePath(`/audits/${ctx.auditId}/anomalies/${ncId}`);
  revalidatePath(`/audits/${ctx.auditId}/anomalies`);
  return { ok: true, newStatus: "changes_requested" };
}

// ============================================================================
// 4) approveNCReview — relecteur valide la relecture
// ============================================================================
export async function approveNCReview(
  ncId: string,
): Promise<NCReviewActionResult> {
  const ctx = await loadNCContext(ncId);
  if ("error" in ctx) return { ok: false, message: ctx.error };
  const t = await getTranslations("audits.ncReview.errors");

  if (ctx.assignmentRole !== "admin" && ctx.assignmentRole !== "proofreader") {
    return { ok: false, errorCode: "NC_REVIEW_DENIED", message: t("NC_REVIEW_DENIED") };
  }
  if (ctx.reviewStatus !== "under_review" && ctx.reviewStatus !== "pending") {
    return {
      ok: false,
      errorCode: "NC_REVIEW_INVALID_STATE",
      message: t("NC_REVIEW_INVALID_STATE"),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("non_conformities")
    .update({
      review_status: "approved",
      review_resolved_at: new Date().toISOString(),
      review_resolved_by: ctx.userId,
    })
    .eq("id", ncId);
  if (error) return { ok: false, message: error.message };

  await supabase.from("audit_logs").insert({
    audit_id: ctx.auditId,
    actor_id: ctx.userId,
    actor_role: ctx.userRole,
    action: "nc.review_approved",
    payload: { nc_id: ncId },
  });

  // Notif aux auditeurs
  const { data: auditors } = await supabase
    .from("audit_assignees")
    .select("profile_id")
    .eq("audit_id", ctx.auditId)
    .eq("role", "auditor");
  if ((auditors ?? []).length > 0) {
    await supabase.from("notifications").insert(
      (auditors ?? [])
        .filter((a) => (a.profile_id as string) !== ctx.userId)
        .map((a) => ({
          user_id: a.profile_id as string,
          sender_id: ctx.userId,
          audit_id: ctx.auditId,
          nc_id: ncId,
          type: "nc.review_approved",
        })),
    );
  }

  revalidatePath(`/audits/${ctx.auditId}/anomalies/${ncId}`);
  revalidatePath(`/audits/${ctx.auditId}/anomalies`);
  return { ok: true, newStatus: "approved" };
}

// ============================================================================
// 5) cancelNCReview — auditeur annule sa demande de relecture
// ----------------------------------------------------------------------------
// Permet de retirer une demande avant qu'elle ne soit traitée. Utile si
// l'auditeur réalise qu'il a fait l'action par erreur.
// ============================================================================
export async function cancelNCReview(
  ncId: string,
): Promise<NCReviewActionResult> {
  const ctx = await loadNCContext(ncId);
  if ("error" in ctx) return { ok: false, message: ctx.error };
  const t = await getTranslations("audits.ncReview.errors");

  if (ctx.assignmentRole !== "admin" && ctx.assignmentRole !== "auditor") {
    return { ok: false, errorCode: "NC_REVIEW_DENIED", message: t("NC_REVIEW_DENIED") };
  }
  if (ctx.reviewStatus === "not_requested") {
    return { ok: true, newStatus: "not_requested" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("non_conformities")
    .update({
      review_status: "not_requested",
      review_requested_at: null,
      review_requested_by: null,
      review_resolved_at: null,
      review_resolved_by: null,
    })
    .eq("id", ncId);
  if (error) return { ok: false, message: error.message };

  await supabase.from("audit_logs").insert({
    audit_id: ctx.auditId,
    actor_id: ctx.userId,
    actor_role: ctx.userRole,
    action: "nc.review_cancelled",
    payload: { nc_id: ncId, from: ctx.reviewStatus },
  });

  revalidatePath(`/audits/${ctx.auditId}/anomalies/${ncId}`);
  return { ok: true, newStatus: "not_requested" };
}
