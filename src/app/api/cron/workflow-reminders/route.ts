import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendReviewReminderEmail } from "@/lib/workflow-emails";

// Route cron : pour les audits qui stagnent en `in_review` depuis > 5 jours,
// envoie une relance email + crée une notification in-app à chaque relecteur
// désigné. Vercel Cron appelle cet endpoint quotidiennement.
//
// Auth :
//   - Vercel Cron injecte `Authorization: Bearer <CRON_SECRET>`.
//   - Toute autre origine est rejetée (403). On ne veut pas que n'importe
//     qui puisse spammer les relecteurs en GET sur cette URL.
//
// Idempotence : aucune trace par défaut. Pour ne pas spammer plusieurs jours
// d'affilée, on insère un audit_log `workflow.review_reminder_sent` que l'on
// utilise comme garde — si une relance < 3 jours, on saute. Si tu veux changer
// la cadence, ajuste REMINDER_DEBOUNCE_DAYS.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Seuil de "stagnation" — un audit reste in_review > N jours avant relance.
const STALE_DAYS_THRESHOLD = 5;
// Anti-spam : on n'envoie pas 2 relances à moins de N jours d'intervalle.
const REMINDER_DEBOUNCE_DAYS = 3;

interface ProofreaderRow {
  profile_id: string;
  profile: {
    email: string | null;
    first_name: string | null;
    last_name: string | null;
  } | null;
}

interface StagnantAuditRow {
  id: string;
  workflow_changed_at: string;
  project: {
    name: string | null;
    client: { name: string | null } | null;
  } | null;
  proofreaders: ProofreaderRow[] | null;
}

function fullName(p: ProofreaderRow["profile"]): string {
  if (!p) return "";
  return [p.first_name, p.last_name]
    .filter((v) => v && v.trim().length > 0)
    .join(" ")
    .trim();
}

function daysSince(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export async function GET(req: Request) {
  // 1) Auth — header Vercel Cron ou X-Cron-Secret en dev/manuel.
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "CRON_SECRET non configuré sur l'environnement." },
      { status: 500 },
    );
  }
  const auth = req.headers.get("authorization") ?? "";
  const provided = auth.startsWith("Bearer ") ? auth.slice(7) : auth;
  if (provided !== expected) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createAdminClient();
  const threshold = new Date(
    Date.now() - STALE_DAYS_THRESHOLD * 24 * 60 * 60 * 1000,
  ).toISOString();
  const debounce = new Date(
    Date.now() - REMINDER_DEBOUNCE_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  // 2) Audits qui ont stagné. On filtre côté SQL ce qui peut l'être : statut
  // + ancienneté. La nested select récupère les relecteurs désignés en une
  // seule requête.
  const { data: auditsRaw, error: queryError } = await supabase
    .from("audits")
    .select(
      `
      id, workflow_changed_at,
      project:projects!inner(name, client:clients!inner(name)),
      proofreaders:audit_assignees!inner(
        profile_id, role,
        profile:profiles(email, first_name, last_name)
      )
    `,
    )
    .eq("workflow_status", "in_review")
    .eq("proofreaders.role", "proofreader")
    .lt("workflow_changed_at", threshold);

  if (queryError) {
    return NextResponse.json({ error: queryError.message }, { status: 500 });
  }

  const audits = (auditsRaw ?? []) as unknown as StagnantAuditRow[];

  // 3) Pour chaque audit, vérifier qu'aucune relance récente n'a été envoyée.
  let pinged = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const audit of audits) {
    // Debounce : si une review_reminder_sent récente existe, on saute.
    const { data: lastReminder } = await supabase
      .from("audit_logs")
      .select("id")
      .eq("audit_id", audit.id)
      .eq("action", "workflow.review_reminder_sent")
      .gte("created_at", debounce)
      .limit(1)
      .maybeSingle();
    if (lastReminder) {
      skipped++;
      continue;
    }

    const project = Array.isArray(audit.project)
      ? audit.project[0]
      : audit.project;
    const client = project?.client
      ? Array.isArray(project.client)
        ? project.client[0]
        : project.client
      : null;

    const days = daysSince(audit.workflow_changed_at);
    const proofreaders = (audit.proofreaders ?? []).filter(
      (p) => p.profile?.email,
    );

    // 4) Pour chaque relecteur : notif in-app + email.
    for (const pr of proofreaders) {
      // Notif in-app (insère avec sender_id null = système).
      await supabase.from("notifications").insert({
        user_id: pr.profile_id,
        sender_id: null,
        audit_id: audit.id,
        type: "workflow.review_reminder",
      });

      // Email (best-effort).
      const err = await sendReviewReminderEmail({
        to: pr.profile?.email ?? "",
        recipientName: fullName(pr.profile),
        auditId: audit.id,
        projectName: project?.name ?? "—",
        clientName: client?.name ?? "—",
        daysWaiting: days,
      });
      if (err) errors.push(`audit ${audit.id} → ${err}`);
    }

    // 5) Trace dans audit_logs pour le debounce et la timeline.
    if (proofreaders.length > 0) {
      await supabase.from("audit_logs").insert({
        audit_id: audit.id,
        actor_id: null,
        actor_role: "system",
        action: "workflow.review_reminder_sent",
        payload: {
          days_waiting: days,
          recipients_count: proofreaders.length,
        },
      });
      pinged++;
    } else {
      skipped++;
    }
  }

  return NextResponse.json({
    scanned: audits.length,
    pinged,
    skipped,
    errors,
  });
}
