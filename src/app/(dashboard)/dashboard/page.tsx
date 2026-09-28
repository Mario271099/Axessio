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
import { monogram, themeColorVar } from "@/lib/utils";
import Link from "next/link";
import { ScoreRing } from "@/components/ui/score-ring";
import { LifecycleSteps } from "@/components/ui/lifecycle-steps";
import { AverageScoreCard } from "@/components/dashboard/average-score-card";
import { computeAuditLifecycle } from "@/lib/audit-lifecycle";
import { getConformityLevel } from "@/lib/score";
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
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import { resolveCurrentOrg } from "@/lib/current-org";
import { WelcomeModal } from "./welcome-modal";
import { intlLocale } from "@/lib/intl";

export default async function DashboardPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const locale = await getLocale();
  const t = await getTranslations("dashboard");
  const tCommon = await getTranslations("common");
  const tAvg = await getTranslations("dashboard.averageScore");
  const tConformity = await getTranslations("constants.conformityLevel");
  const tLifecycle = await getTranslations("audits.lifecycle");
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
    // Liste des 5 audits les plus récents - couverte par idx_audits_updated_at_desc.
    supabase
      .from("audits")
      .select(
        `id, status, initial_score, final_score, updated_at,
         project:projects(name, client:clients(name))`,
      )
      .order("updated_at", { ascending: false })
      .limit(5),
    // Répartition par statut via RPC - un aller-retour Postgres (filtered count).
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
      .select("last_login_at, welcome_dismissed_at")
      .eq("id", profile.id)
      .maybeSingle(),
  ]);

  const auditList = auditsRes.data ?? [];
  const totalAudits = totalAuditsRes.count ?? 0;
  const lastLoginAt = profileExtraRes.data?.last_login_at ?? null;
  const welcomeDismissedAt =
    profileExtraRes.data?.welcome_dismissed_at ?? null;

  // Modale d'accueil first-run : visible si la colonne welcome_dismissed_at
  // est NULL ET que l'utilisateur n'a pas encore d'audit. Pour récupérer le
  // type d'org (qui contextualise les étapes), on appelle resolveCurrentOrg
  // ici plutôt que de le faire côté composant - un seul round-trip côté
  // serveur.
  const showWelcome = welcomeDismissedAt === null && totalAudits === 0;
  const { current: currentOrgForWelcome } = showWelcome
    ? await resolveCurrentOrg()
    : { current: null };

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
    <div className="space-y-5 px-4 pb-8 md:px-9">
      {/* ============================================================== */}
      {/* Modale d'accueil première connexion                              */}
      {/* ============================================================== */}
      {showWelcome && (
        <WelcomeModal
          firstName={profile.firstName}
          defaultOpen={true}
          orgType={currentOrgForWelcome?.organizationType ?? "individual"}
        />
      )}

      {/* ============================================================== */}
      {/* Check-list onboarding (apparait jusqu'à 100% complete)          */}
      {/* ============================================================== */}
      <OnboardingChecklist />

      {/* ============================================================== */}
      {/* En-tête : salutation + action principale                        */}
      {/* ============================================================== */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[2.125rem] font-black leading-tight tracking-tight">
            {t("hero.greeting", {
              name: profile.firstName || t("hero.greetingFallback"),
            })}
          </h1>
          <p className="mt-1 text-base text-muted-foreground">
            <span>{capitalizedToday}</span>
            {lastLoginLabel && (
              <>
                <span aria-hidden="true"> · </span>
                <span>{lastLoginLabel}</span>
              </>
            )}
          </p>
        </div>
        <Button asChild>
          <Link href="/audits/new">
            <Plus data-anim="spin" aria-hidden="true" />
            {t("hero.newAudit")}
          </Link>
        </Button>
      </div>

      {/* ============================================================== */}
      {/* Synthèse : conformité moyenne (carte encre) + 3 tuiles          */}
      {/* ============================================================== */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.35fr_1fr_1fr_1fr]">
        <AverageScoreCard
          score={evaluatedTotal === 0 ? null : avgScore}
          title={tAvg("title")}
          verdict={
            evaluatedTotal === 0
              ? tAvg("verdict.none")
              : tConformity(VERDICT_KEY[getConformityLevel(avgScore)])
          }
          note={t("kpi.scoreNote", { count: evaluatedTotal })}
          ringLabel={tAvg("ringLabel", { score: avgScore })}
        />
        <div className="fade-in-up" style={{ animationDelay: "75ms" }}>
          <KpiCard
            iconKey="clipboard-list"
            label={t("kpi.recentAudits")}
            value={totalAudits}
            tone="primary"
            delta={null}
            note={t("kpi.totalSuffix", { total: totalAudits })}
            href="/audits"
          />
        </div>
        <div className="fade-in-up" style={{ animationDelay: "150ms" }}>
          <KpiCard
            iconKey="clock"
            label={t("kpi.inProgress")}
            value={inProgress}
            tone="warning"
            delta={null}
            href="/audits?status=IN_PROGRESS"
          />
        </div>
        <div className="fade-in-up" style={{ animationDelay: "225ms" }}>
          <KpiCard
            iconKey="check-circle"
            label={t("kpi.completed")}
            value={completed}
            tone="success"
            delta={null}
            href="/audits?status=COMPLETED"
          />
        </div>
      </div>

      {/* ============================================================== */}
      {/* Audits récents + répartition et activité                        */}
      {/* ============================================================== */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4">
            <CardTitle>{t("recent.title")}</CardTitle>
            {recentAudits.length > 0 && (
              <Link
                href="/audits"
                className="text-sm font-bold text-primary underline decoration-1 underline-offset-4 hover:decoration-2"
              >
                {tCommon("viewAll")}
              </Link>
            )}
          </CardHeader>
          <CardContent className="px-2 pb-2">
            {recentAudits.length === 0 ? (
              <DashboardEmpty
                title={t("recent.emptyTitle")}
                description={t("recent.emptyDesc")}
                cta={t("recent.createCta")}
              />
            ) : (
              <ul className="flex flex-col gap-0.5">
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
                  const projectName =
                    project?.name ?? t("recent.unknownProject");
                  // Parcours dérivé du seul statut : les dates ne sont pas
                  // chargées ici, elles ne servent qu'à marquer des jalons
                  // déjà franchis en plus de celui du statut.
                  const lifecycle = computeAuditLifecycle({
                    status: audit.status as AuditStatus,
                    createdAt: null,
                    expectedStartAt: null,
                    expectedEndAt: null,
                    restitutionAt: null,
                    counterAuditAt: null,
                    deliveredAt: null,
                    onlineAt: null,
                  });

                  return (
                    <li key={audit.id}>
                      <Link
                        href={`/audits/${audit.id}`}
                        className="axs-row grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-row px-3 py-2.5 lg:grid-cols-[minmax(0,1.6fr)_150px_110px_130px]"
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <span
                            aria-hidden="true"
                            className="axs-mono flex size-10 shrink-0 items-center justify-center rounded-row text-sm font-extrabold text-white"
                            style={{ background: themeColorVar(clientName) }}
                          >
                            {monogram(clientName)}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-bold">
                              {projectName}
                            </span>
                            <span className="block truncate text-sm text-muted-foreground">
                              {clientName}
                            </span>
                          </span>
                        </span>

                        <span className="hidden min-w-0 lg:block">
                          <span className="block truncate text-sm font-bold">
                            {tLifecycle(`stages.${lifecycle.currentKey}`)}
                          </span>
                          <LifecycleSteps
                            currentStep={lifecycle.currentStep}
                            totalSteps={lifecycle.totalSteps}
                            label={tLifecycle("stepIndicator", {
                              step: lifecycle.currentStep,
                              total: lifecycle.totalSteps,
                            })}
                            className="mt-1.5"
                          />
                        </span>

                        <span className="flex items-center gap-2">
                          <ScoreRing
                            value={score ?? null}
                            size={34}
                            hideValue
                            ariaLabel=""
                          />
                          <span className="font-bold tabular">
                            {score === null || score === undefined
                              ? "—"
                              : `${Math.round(score)}%`}
                          </span>
                        </span>

                        <span className="hidden text-sm text-muted-foreground lg:block">
                          {t("recent.updatedOn", {
                            date: formatShortDate(audit.updated_at),
                          })}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <StatusPie breakdown={breakdown} />
          <ActivityTimeline events={activityEvents} />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/** Niveau de conformité → clé i18n du verdict affiché sur la carte encre. */
const VERDICT_KEY = {
  "non-compliant": "nonCompliant",
  partial: "partial",
  full: "full",
} as const;

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
          <Plus aria-hidden="true" />
          {cta}
        </Link>
      </Button>
    </EmptyState>
  );
}
