import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Cron quotidien des transitions automatiques d'audit_status :
//
//   T2 PLANNED → IN_PROGRESS - si expected_start_at ≤ today
//   T4 DELIVERED → REMEDIATION - si delivered_at ≤ now() - 7 jours
//
// Idempotent : déjà transitionné ⇒ skip (WHERE status = source).
// Auth : Authorization: Bearer <CRON_SECRET> (injecté par Vercel Cron).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const REMEDIATION_DELAY_DAYS = 7;

interface AuditRow {
  id: string;
  status: string;
  delivered_at: string | null;
  expected_start_at: string | null;
}

export async function GET(req: Request) {
  // 1) Auth
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "CRON_SECRET non configuré." },
      { status: 500 },
    );
  }
  const auth = req.headers.get("authorization") ?? "";
  const provided = auth.startsWith("Bearer ") ? auth.slice(7) : auth;
  if (provided !== expected) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createAdminClient();
  const now = new Date();
  const todayIso = now.toISOString();
  const remediationThreshold = new Date(
    now.getTime() - REMEDIATION_DELAY_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  // ──────────────────────────────────────────────────────────────────────────
  // T2 : PLANNED → IN_PROGRESS (start date arrivée)
  // ──────────────────────────────────────────────────────────────────────────
  const { data: t2Rows, error: t2Error } = await supabase
    .from("audits")
    .select("id, status, delivered_at, expected_start_at")
    .eq("status", "PLANNED")
    .not("expected_start_at", "is", null)
    .lte("expected_start_at", todayIso);

  const t2 = (t2Rows ?? []) as AuditRow[];
  const t2Done: string[] = [];
  const errors: Array<{ auditId: string; step: string; error: string }> = [];

  for (const row of t2) {
    const { error } = await supabase
      .from("audits")
      .update({ status: "IN_PROGRESS" })
      .eq("id", row.id)
      .eq("status", "PLANNED"); // garde-fou concurrent
    if (error) {
      errors.push({ auditId: row.id, step: "T2", error: error.message });
      continue;
    }
    await supabase.from("audit_logs").insert({
      audit_id: row.id,
      actor_id: null,
      actor_role: "system",
      action: "status.auto_transition",
      payload: {
        from: "PLANNED",
        to: "IN_PROGRESS",
        reason: "auto_start_date_reached",
      },
    });
    t2Done.push(row.id);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // T4 : DELIVERED → REMEDIATION (J+7 livraison)
  // ──────────────────────────────────────────────────────────────────────────
  const { data: t4Rows, error: t4Error } = await supabase
    .from("audits")
    .select("id, status, delivered_at, expected_start_at")
    .eq("status", "DELIVERED")
    .not("delivered_at", "is", null)
    .lte("delivered_at", remediationThreshold);

  const t4 = (t4Rows ?? []) as AuditRow[];
  const t4Done: string[] = [];

  for (const row of t4) {
    const { error } = await supabase
      .from("audits")
      .update({ status: "REMEDIATION" })
      .eq("id", row.id)
      .eq("status", "DELIVERED");
    if (error) {
      errors.push({ auditId: row.id, step: "T4", error: error.message });
      continue;
    }
    await supabase.from("audit_logs").insert({
      audit_id: row.id,
      actor_id: null,
      actor_role: "system",
      action: "status.auto_transition",
      payload: {
        from: "DELIVERED",
        to: "REMEDIATION",
        reason: "auto_after_7_days",
      },
    });
    t4Done.push(row.id);
  }

  return NextResponse.json({
    t2: { scanned: t2.length, transitioned: t2Done.length, ids: t2Done },
    t4: { scanned: t4.length, transitioned: t4Done.length, ids: t4Done },
    errors,
    queryErrors: {
      t2: t2Error?.message ?? null,
      t4: t4Error?.message ?? null,
    },
  });
}
