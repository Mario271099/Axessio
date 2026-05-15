import { ClipboardList, Plus } from "lucide-react";
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
import { formatDate, cn } from "@/lib/utils";
import Link from "next/link";
import type { AuditStatus, NCSeverity } from "@/types/domain";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { EvolutionChart } from "@/components/dashboard/evolution-chart";
import {
  StatusPie,
  type StatusBreakdown,
} from "@/components/dashboard/status-pie";
import {
  ActivityTimeline,
  type ActivityEvent,
} from "@/components/dashboard/activity-timeline";

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

  // Toutes les requêtes en parallèle.
  const [
    auditsRes,
    statusBreakdownRes,
    totalAuditsRes,
    recentNcRes,
    profileExtraRes,
  ] = await Promise.all([
    supabase
      .from("audits")
      .select(
        `id, status, initial_score, final_score, updated_at,
         project:projects(name, client:clients(name))`,
      )
      .order("updated_at", { ascending: false })
      .limit(10),
    supabase.from("audits").select("status"),
    supabase
      .from("audits")
      .select("id", { count: "exact", head: true }),
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

  // ---- KPIs (depuis la liste récente, RLS filtre selon le rôle) -----------
  const total = auditList.length;
  const inProgress = auditList.filter((a) =>
    STATUS_GROUPS.inProgress.includes(a.status as AuditStatus),
  ).length;
  const completed = auditList.filter((a) =>
    STATUS_GROUPS.completed.includes(a.status as AuditStatus),
  ).length;
  const evaluatedScores = auditList
    .map((a) => a.final_score ?? a.initial_score)
    .filter((s): s is number => s !== null && s !== undefined);
  const avgScore =
    evaluatedScores.length > 0
      ? Math.round(
          evaluatedScores.reduce((sum, s) => sum + s, 0) /
            evaluatedScores.length,
        )
      : 0;

  // ---- Répartition pour le pie ------------------------------------------
  const breakdown: StatusBreakdown = (statusBreakdownRes.data ?? []).reduce(
    (acc, row) => {
      const status = row.status as AuditStatus;
      if (STATUS_GROUPS.pending.includes(status)) acc.pending += 1;
      else if (STATUS_GROUPS.inProgress.includes(status)) acc.inProgress += 1;
      else if (STATUS_GROUPS.completed.includes(status)) acc.completed += 1;
      else if (STATUS_GROUPS.archived.includes(status)) acc.archived += 1;
      return acc;
    },
    { pending: 0, inProgress: 0, completed: 0, archived: 0 } as StatusBreakdown,
  );

  // ---- Activité récente : on dérive des NC fraîches ----------------------
  const activityEvents: ActivityEvent[] = (recentNcRes.data ?? []).map(
    (nc) => {
      const author = Array.isArray(nc.author) ? nc.author[0] : nc.author;
      const authorName = author
        ? `${author.first_name ?? ""} ${author.last_name ?? ""}`.trim() ||
          "Quelqu'un"
        : "Quelqu'un";
      const severity = nc.severity as NCSeverity;
      const isCritical = severity === "CRITICAL" || severity === "HIGH";
      return {
        id: nc.id,
        kind: isCritical ? "nc-critical" : "nc-created",
        author: authorName,
        action: isCritical ? "a créé une NC critique" : "a créé une NC",
        target: nc.title,
        href: `/audits/${nc.audit_id}/anomalies/${nc.id}`,
        at: nc.created_at,
      } satisfies ActivityEvent;
    },
  );

  // ---- Hero : date du jour + dernière connexion --------------------------
  const today = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
  const capitalizedToday = today.charAt(0).toUpperCase() + today.slice(1);

  const lastLoginLabel = lastLoginAt
    ? `Dernière connexion : ${new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(lastLoginAt))}`
    : null;

  const recentAudits = auditList.slice(0, 5);

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
              Tableau de bord
            </p>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Bonjour, {profile.firstName || "bienvenue"}
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
              Nouvel audit
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
            label="Audits récents"
            value={total}
            tone="primary"
            delta={null}
            note={`sur ${totalAudits} au total`}
          />
        </div>
        <div className="fade-in-up" style={{ animationDelay: "75ms" }}>
          <KpiCard
            iconKey="clock"
            label="En cours"
            value={inProgress}
            tone="warning"
            delta={null}
          />
        </div>
        <div className="fade-in-up" style={{ animationDelay: "150ms" }}>
          <KpiCard
            iconKey="check-circle"
            label="Terminés"
            value={completed}
            tone="success"
            delta={null}
          />
        </div>
        <div className="fade-in-up" style={{ animationDelay: "225ms" }}>
          <KpiCard
            iconKey="trending-up"
            label="Score moyen"
            value={avgScore}
            tone="violet"
            delta={null}
            suffix="%"
            note={
              evaluatedScores.length > 0
                ? `sur ${evaluatedScores.length} audit${evaluatedScores.length > 1 ? "s" : ""} évalué${evaluatedScores.length > 1 ? "s" : ""}`
                : "Aucun score disponible"
            }
          />
        </div>
      </div>

      {/* ============================================================== */}
      {/* Évolution                                                       */}
      {/* ============================================================== */}
      <EvolutionChart />

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
          <CardTitle>Audits récents</CardTitle>
          {auditList.length > 0 && (
            <Button asChild variant="link" size="sm" className="h-auto p-0">
              <Link href="/audits">Voir tout</Link>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {recentAudits.length === 0 ? (
            <EmptyState />
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
                const clientName = client?.name ?? "Sans client";
                const projectName = project?.name ?? "Projet inconnu";

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
                            Mis à jour le {formatDate(audit.updated_at)}
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

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border py-12 text-center">
      <div
        aria-hidden="true"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
      >
        <ClipboardList className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">Aucun audit pour le moment</p>
        <p className="text-xs text-muted-foreground">
          Créez votre premier audit pour commencer.
        </p>
      </div>
      <Button asChild size="sm" className="mt-2">
        <Link href="/audits/new">
          <Plus aria-hidden="true" className="h-4 w-4" />
          Créer un audit
        </Link>
      </Button>
    </div>
  );
}
