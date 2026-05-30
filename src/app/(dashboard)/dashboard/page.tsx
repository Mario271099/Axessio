import { ClipboardList, Plus } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AuditStatusBadge } from "@/components/audit/audit-status-badge";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { AuditStatus, NCSeverity } from "@/types/domain";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  StatusPie,
  type StatusBreakdown,
} from "@/components/dashboard/status-pie";
import {
  ActivityTimeline,
  type ActivityEvent,
} from "@/components/dashboard/activity-timeline";
import { intlLocale } from "@/lib/intl";

const STATUS_GROUPS = {
  pending: ["PENDING", "PLANNED"] as AuditStatus[],
  inProgress: [
    "IN_PROGRESS",
    "DELIVERED",
    "REMEDIATION",
    "COUNTER_AUDIT",
  ] as AuditStatus[],
  completed: ["COMPLETED", "ONLINE"] as AuditStatus[],
  archived: ["ARCHIVED"] as AuditStatus[],
};

export default async function DashboardPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const locale = await getLocale();
  const t = await getTranslations("dashboard");
  const tCommon = await getTranslations("common");
  const intl = intlLocale(locale);

  // Tout est calculé côté Postgres (agrégats + RPCs) pour rester rapide
  // au-delà de plusieurs dizaines de milliers d'audits. Aucun SELECT non borné.
  const [
    auditsRes,
    breakdownRes,
    totalAuditsRes,
    avgScoreRes,
    recentNcRes,
    profileExtraRes,
  ] = await Promise.all([
    // Liste des 5 audits les plus récents — couverte par idx_audits_updated_at_desc.
    supabase
      .from("audits")
      .select(
        `id, status, initial_score, final_score, updated_at,
         project:projects(name, client:clients(name))`,
      )
      .order("updated_at", { ascending: false })
      .limit(5),
    // Répartition par statut via RPC — un aller-retour Postgres (filtered count).
    supabase.rpc("audits_status_breakdown"),
    // Total audits accessibles à l'utilisateur (RLS appliquée).
    supabase.from("audits").select("id", { count: "exact", head: true }),
    // Score moyen calculé en SQL (AVG), pas en JS.
    supabase.rpc("audits_avg_score"),
    supabase
      .from("non_conformities")
      .select(
        `id, title, severity, created_at, audit_id,
         author:profiles!non_conformities_created_by_fkey(first_name, last_name)`,
      )
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("profiles")
      .select("last_login_at")
      .eq("id", profile.id)
      .maybeSingle(),
  ]);

  const auditList = auditsRes.data ?? [];
  const totalAudits = totalAuditsRes.count ?? 0;
  const lastLoginAt = profileExtraRes.data?.last_login_at ?? null;

  // ---- Répartition pour le pie + KPIs (depuis le RPC) --------------------
  // Le RPC renvoie une seule ligne avec 4 colonnes (filtered counts).
  const breakdownRow = Array.isArray(breakdownRes.data)
    ? breakdownRes.data[0]
    : breakdownRes.data;
  const breakdown: StatusBreakdown = {
    pending: Number(breakdownRow?.pending_count ?? 0),
    inProgress: Number(breakdownRow?.in_progress_count ?? 0),
    completed: Number(breakdownRow?.completed_count ?? 0),
    archived: Number(breakdownRow?.archived_count ?? 0),
  };

  const inProgress = breakdown.inProgress;
  const completed = breakdown.completed;
  const evaluatedTotal =
    breakdown.pending +
    breakdown.inProgress +
    breakdown.completed +
    breakdown.archived;

  // Score moyen via RPC (numérique nullable si aucun audit scoré).
  const avgScoreRaw =
    typeof avgScoreRes.data === "number"
      ? avgScoreRes.data
      : typeof avgScoreRes.data === "string"
        ? Number.parseFloat(avgScoreRes.data)
        : null;
  const avgScore =
    avgScoreRaw !== null && !Number.isNaN(avgScoreRaw)
      ? Math.round(avgScoreRaw)
      : 0;

  // ---- Activité récente : on dérive des NC fraîches ----------------------
  const tActivity = await getTranslations("dashboard.activity");
  const activityEvents: ActivityEvent[] = (recentNcRes.data ?? []).map(
    (nc) => {
      const author = Array.isArray(nc.author) ? nc.author[0] : nc.author;
      const fallbackAuthor =
        locale === "en" ? "Someone" : "Quelqu'un";
      const authorName = author
        ? `${author.first_name ?? ""} ${author.last_name ?? ""}`.trim() ||
          fallbackAuthor
        : fallbackAuthor;
      const severity = nc.severity as NCSeverity;
      const isCritical = severity === "CRITICAL" || severity === "HIGH";
      const action =
        locale === "en"
          ? isCritical
            ? "created a critical NC"
            : "created an NC"
          : isCritical
            ? "a créé une NC critique"
            : "a créé une NC";
      return {
        id: nc.id,
        kind: isCritical ? "nc-critical" : "nc-created",
        author: authorName,
        action,
        target: nc.title,
        href: `/audits/${nc.audit_id}/anomalies/${nc.id}`,
        at: nc.created_at,
      } satisfies ActivityEvent;
    },
  );
  void tActivity;

  // ---- Hero : date du jour + dernière connexion --------------------------
  const today = new Intl.DateTimeFormat(intl, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
  const capitalizedToday = today.charAt(0).toUpperCase() + today.slice(1);

  const lastLoginLabel = lastLoginAt
    ? t("hero.lastLogin", {
        date: new Intl.DateTimeFormat(intl, {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(lastLoginAt)),
      })
    : null;

  const formatShortDate = (iso: string | null | undefined): string => {
    if (!iso) return "—";
    return new Intl.DateTimeFormat(intl, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  };

  const recentAudits = auditList;

  return (
    <div className="container mx-auto max-w-7xl space-y-8 p-6 md:p-8">
      {/* ============================================================== */}
      {/* Hero                                                            */}
      {/* ============================================================== */}
      <Card className="relative overflow-hidden border-primary/10 bg-gradient-to-br from-primary/8 via-background to-background dark:from-primary/15">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.15),transparent_50%)]"
        />
        <div className="relative flex flex-col gap-6 p-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              {t("hero.kicker")}
            </p>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              {t("hero.greeting", {
                name: profile.firstName || t("hero.greetingFallback"),
              })}
            </h1>
            <p className="text-sm text-muted-foreground">
              <span>{capitalizedToday}</span>
              {lastLoginLabel && (
                <>
                  <span aria-hidden="true"> · </span>
                  <span>{lastLoginLabel}</span>
                </>
              )}
            </p>
          </div>
          <Button asChild size="lg" className="shrink-0">
            <Link href="/audits/new">
              <Plus aria-hidden="true" className="h-4 w-4" />
              {t("hero.newAudit")}
            </Link>
          </Button>
        </div>
      </Card>

      {/* ============================================================== */}
      {/* KPIs                                                            */}
      {/* ============================================================== */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="fade-in-up" style={{ animationDelay: "0ms" }}>
          <KpiCard
            iconKey="clipboard-list"
            label={t("kpi.recentAudits")}
            value={totalAudits}
            tone="primary"
            delta={null}
            note={t("kpi.totalSuffix", { total: totalAudits })}
          />
        </div>
        <div className="fade-in-up" style={{ animationDelay: "75ms" }}>
          <KpiCard
            iconKey="clock"
            label={t("kpi.inProgress")}
            value={inProgress}
            tone="warning"
            delta={null}
          />
        </div>
        <div className="fade-in-up" style={{ animationDelay: "150ms" }}>
          <KpiCard
            iconKey="check-circle"
            label={t("kpi.completed")}
            value={completed}
            tone="success"
            delta={null}
          />
        </div>
        <div className="fade-in-up" style={{ animationDelay: "225ms" }}>
          <KpiCard
            iconKey="trending-up"
            label={t("kpi.averageScore")}
            value={avgScore}
            tone="violet"
            delta={null}
            suffix="%"
            note={t("kpi.scoreNote", { count: evaluatedTotal })}
          />
        </div>
      </div>

      {/* ============================================================== */}
      {/* Activité + Pie                                                  */}
      {/* ============================================================== */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActivityTimeline events={activityEvents} />
        </div>
        <StatusPie breakdown={breakdown} />
      </div>

      {/* ============================================================== */}
      {/* Audits récents                                                  */}
      {/* ============================================================== */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>{t("recent.title")}</CardTitle>
          {auditList.length > 0 && (
            <Button asChild variant="link" size="sm" className="h-auto p-0">
              <Link href="/audits">{tCommon("viewAll")}</Link>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {recentAudits.length === 0 ? (
            <DashboardEmpty
              title={t("recent.emptyTitle")}
              description={t("recent.emptyDesc")}
              cta={t("recent.createCta")}
            />
          ) : (
            <ul className="-mx-2 divide-y divide-border">
              {recentAudits.map((audit) => {
                const project = Array.isArray(audit.project)
                  ? audit.project[0]
                  : audit.project;
                const client = project?.client
                  ? Array.isArray(project.client)
                    ? project.client[0]
                    : project.client
                  : null;
                const score = audit.final_score ?? audit.initial_score;
                const clientName = client?.name ?? t("recent.noClient");
                const projectName = project?.name ?? t("recent.unknownProject");

                return (
                  <li key={audit.id}>
                    <Link
                      href={`/audits/${audit.id}`}
                      className="flex items-center gap-4 rounded-md px-2 py-3 transition-colors hover:bg-accent/50"
                    >
                      <Avatar name={clientName} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {projectName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          <span>{clientName}</span>
                          <span aria-hidden="true"> · </span>
                          <span>
                            {t("recent.updatedOn", {
                              date: formatShortDate(audit.updated_at),
                            })}
                          </span>
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <ScoreText score={score} />
                        <AuditStatusBadge status={audit.status as AuditStatus} />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Avatar({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters =
    parts.length >= 2
      ? `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`
      : (parts[0]?.slice(0, 2) ?? "?");
  return (
    <div
      aria-hidden="true"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
    >
      {letters.toUpperCase()}
    </div>
  );
}

function ScoreText({ score }: { score: number | null | undefined }) {
  if (score === null || score === undefined) {
    return (
      <span className="text-lg font-bold tabular-nums text-muted-foreground">
        —
      </span>
    );
  }
  const tone =
    score >= 100
      ? "text-success"
      : score >= 50
        ? "text-warning"
        : "text-destructive";
  return (
    <span className={cn("text-lg font-bold tabular-nums", tone)}>
      {Math.round(score)}%
    </span>
  );
}

function DashboardEmpty({
  title,
  description,
  cta,
}: {
  title: string;
  description: string;
  cta: string;
}) {
  return (
    <EmptyState icon={ClipboardList} title={title} description={description}>
      <Button asChild size="sm">
        <Link href="/audits/new">
          <Plus aria-hidden="true" className="h-4 w-4" />
          {cta}
        </Link>
      </Button>
    </EmptyState>
  );
}
