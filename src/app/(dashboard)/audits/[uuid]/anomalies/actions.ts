"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, retryAfterSeconds } from "@/lib/rate-limit";
import { requireAnyPermission } from "@/lib/server-permissions";
import type { NCSeverity, NCStatus, UserRole } from "@/types/domain";

export interface BulkResult {
  error: string | null;
  count?: number;
}

const ALLOWED_STATUSES: NCStatus[] = ["TO_FIX", "IN_PROGRESS", "FIXED"];

const ALLOWED_SEVERITIES: NCSeverity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

// 60 actions bulk / minute par auditeur. Chaque action ne touche que les NC
// d'un audit (clause WHERE), donc l'impact est borné - on protège surtout
// la base de données contre des boucles côté client.
const BULK_LIMIT = 60;
const BULK_WINDOW_MS = 60 * 1000;

async function requireAuditor(): Promise<
  { ok: true; userId: string; role: UserRole } | { ok: false; error: string }
> {
  // Legacy (auditor/admin) OU permission d'org `nc.edit`. La RLS `nc_admin`
  // (mig. 80) re-vérifie côté DB, scopée à l'org de l'audit.
  const guard = await requireAnyPermission("nc.edit");
  if (!guard.ok) return { ok: false, error: guard.error };
  return { ok: true, userId: guard.userId, role: guard.role };
}

async function checkBulkRateLimit(
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const limit = await rateLimit(`bulkNC:${userId}`, BULK_LIMIT, BULK_WINDOW_MS);
  if (limit.ok) return { ok: true };
  const t = await getTranslations("errors");
  return {
    ok: false,
    error: t("rateLimited", { seconds: retryAfterSeconds(limit.resetMs) }),
  };
}

async function validateBulkInput(
  auditId: string,
  ncIds: string[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const t = await getTranslations("errors");
  if (!auditId) return { ok: false, error: t("auditIdMissing") };
  if (!Array.isArray(ncIds) || ncIds.length === 0) {
    return { ok: false, error: t("bulkNoSelection") };
  }
  return { ok: true };
}

export async function bulkUpdateNCStatus(
  auditId: string,
  ncIds: string[],
  status: NCStatus,
): Promise<BulkResult> {
  const auth = await requireAuditor();
  if (!auth.ok) return { error: auth.error };

  const rl = await checkBulkRateLimit(auth.userId);
  if (!rl.ok) return { error: rl.error };

  const t = await getTranslations("errors");
  if (!ALLOWED_STATUSES.includes(status)) {
    return { error: t("invalidStatus") };
  }

  const guard = await validateBulkInput(auditId, ncIds);
  if (!guard.ok) return { error: guard.error };

  const supabase = await createClient();
  // La clause `eq("audit_id", auditId)` empêche un attaquant d'agir sur des NC
  // appartenant à un autre audit, même s'il forge les IDs dans la requête.
  const { error, count } = await supabase
    .from("non_conformities")
    .update({ status }, { count: "exact" })
    .eq("audit_id", auditId)
    .in("id", ncIds);

  if (error) return { error: error.message };

  revalidatePath(`/audits/${auditId}/anomalies`);
  return { error: null, count: count ?? 0 };
}

export async function bulkUpdateNCSeverity(
  auditId: string,
  ncIds: string[],
  severity: NCSeverity,
): Promise<BulkResult> {
  const auth = await requireAuditor();
  if (!auth.ok) return { error: auth.error };

  const rl = await checkBulkRateLimit(auth.userId);
  if (!rl.ok) return { error: rl.error };

  const t = await getTranslations("errors");
  if (!ALLOWED_SEVERITIES.includes(severity)) {
    return { error: t("invalidSeverity") };
  }

  const guard = await validateBulkInput(auditId, ncIds);
  if (!guard.ok) return { error: guard.error };

  const supabase = await createClient();
  const { error, count } = await supabase
    .from("non_conformities")
    .update({ severity }, { count: "exact" })
    .eq("audit_id", auditId)
    .in("id", ncIds);

  if (error) return { error: error.message };

  revalidatePath(`/audits/${auditId}/anomalies`);
  return { error: null, count: count ?? 0 };
}

export async function bulkDeleteNCs(
  auditId: string,
  ncIds: string[],
): Promise<BulkResult> {
  const auth = await requireAuditor();
  if (!auth.ok) return { error: auth.error };

  const rl = await checkBulkRateLimit(auth.userId);
  if (!rl.ok) return { error: rl.error };

  const guard = await validateBulkInput(auditId, ncIds);
  if (!guard.ok) return { error: guard.error };

  const supabase = await createClient();
  const { error, count } = await supabase
    .from("non_conformities")
    .delete({ count: "exact" })
    .eq("audit_id", auditId)
    .in("id", ncIds);

  if (error) return { error: error.message };

  revalidatePath(`/audits/${auditId}/anomalies`);
  revalidatePath(`/audits/${auditId}`);
  return { error: null, count: count ?? 0 };
}
