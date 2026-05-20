"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/server-permissions";
import { rateLimit, retryAfterSeconds } from "@/lib/rate-limit";

export interface ReviewCommentResult {
  error: string | null;
  success?: boolean;
}

// 20 commentaires / minute par utilisateur. Suffisant pour une relecture
// active, freine un script abusif.
const COMMENT_LIMIT = 20;
const COMMENT_WINDOW_MS = 60 * 1000;
const MAX_BODY_LENGTH = 4000;

// ============================================================================
// Poster un commentaire de relecture sur l'audit
// ----------------------------------------------------------------------------
// Stocké dans `audit_logs` avec action='workflow.comment'. La policy
// `audit_logs_insert` (migration 24) restreint à l'actor courant et à un
// audit accessible — couvre déjà la sécurité.
//
// Permission : audit.transition_workflow (admin + auditor). Les relecteurs
// désignés sont nécessairement staff, donc couverts.
//
// Note : on n'envoie PAS de notification ici par défaut — ce sont des notes
// internes pour la relecture, à voir dans la timeline. Si on voulait pinger
// un destinataire, ce serait une seconde itération.
// ============================================================================
export async function postReviewComment(
  auditId: string,
  body: string,
): Promise<ReviewCommentResult> {
  const guard = await requirePermission("audit.transition_workflow");
  if (!guard.ok) return { error: guard.error };

  const t = await getTranslations("errors");
  const trimmed = body.trim();
  if (!trimmed) return { error: t("emptyMessage") };
  if (trimmed.length > MAX_BODY_LENGTH) {
    return { error: t("commentTooLong", { max: MAX_BODY_LENGTH }) };
  }

  const limit = rateLimit(
    `reviewComment:${guard.userId}`,
    COMMENT_LIMIT,
    COMMENT_WINDOW_MS,
  );
  if (!limit.ok) {
    return {
      error: t("rateLimited", { seconds: retryAfterSeconds(limit.resetMs) }),
    };
  }

  const supabase = await createClient();

  // Vérification douce que l'audit existe et est accessible (RLS le fera
  // aussi mais on veut un message d'erreur explicite).
  const { data: audit } = await supabase
    .from("audits")
    .select("id, workflow_status")
    .eq("id", auditId)
    .maybeSingle();
  if (!audit) return { error: t("auditNotFound") };

  const { error } = await supabase.from("audit_logs").insert({
    audit_id: auditId,
    actor_id: guard.userId,
    actor_role: guard.role,
    action: "workflow.comment",
    payload: {
      body: trimmed,
      workflow_status: audit.workflow_status,
    },
  });

  if (error) return { error: error.message };

  revalidatePath(`/audits/${auditId}`);
  return { error: null, success: true };
}
