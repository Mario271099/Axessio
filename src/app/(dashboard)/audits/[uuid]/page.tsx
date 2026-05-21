import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronLeft,
  ClipboardList,
  Sparkles,
  FileSearch,
  ListChecks,
  Pencil,
  Users as UsersIcon,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AuditStatusBadge } from "@/components/audit/audit-status-badge";
import {
  AuditAssignees,
  type AssigneeEntry,
  type AssignableAuditor,
} from "@/components/audit/audit-assignees";
import {
  AuditProofreaders,
  type ProofreaderEntry,
  type ProofreaderCandidate,
} from "@/components/audit/audit-proofreaders";
import {
  AuditStatusActions,
  type AvailableStatusTransition,
} from "@/components/audit/audit-status-actions";
import { SectionHeader } from "@/components/audit/section-header";
import type { AuditLifecycleSnapshot } from "@/lib/audit-status";
import { availableManualTransitions } from "@/lib/audit-status";
import { Progress } from "@/components/ui/progress";
import { formatDate, formatScore, cn } from "@/lib/utils";
import { REFERENCE_TYPE_LABELS } from "@/lib/constants";
import {
  canAssignAuditor,
  canAssignProofreader,
  canEditAudit,
} from "@/lib/permissions";
import {
  getConformityLabel,
  getConformityLevel,
  getScoreColorVar,
} from "@/lib/score";
import type {
  AuditStatus,
  PlatformType,
  ReferenceType,
  ServiceType,
} from "@/types/domain";
import { ExportReportButton } from "./export-report-button";

interface PageProps {
  params: Promise<{ uuid: string }>;
}

export default async function AuditDetailPage({ params }: PageProps) {
  const profile = await requireProfile();
  const { uuid } = await params;
  const supabase = await createClient();
  const t = await getTranslations("audits.detail");
  const tPlatform = await getTranslations("constants.platform");
  const tServiceType = await getTranslations("constants.serviceType");

  const { data: audit, error } = await supabase
    .from("audits")
    .select(
      `
      *,
      reference:references(type, version),
      project:projects(name, url, client:clients(id, name))
    `,
    )
    .eq("id", uuid)
    .single();

  if (error || !audit) {
    notFound();
  }

  const project = Array.isArray(audit.project)
    ? audit.project[0]
    : audit.project;
  const client = project?.client
    ? Array.isArray(project.client)
      ? project.client[0]
      : project.client
    : null;
  const ref = Array.isArray(audit.reference)
    ? audit.reference[0]
    : audit.reference;

  // Export PDF : staff plateforme (admin/auditor) OU client_admin du client
  // propriétaire de l'audit. Les clients simples passent par leur admin.
  const canExportReport =
    profile.role === "admin" ||
    profile.role === "auditor" ||
    (profile.role === "client_admin" &&
      client?.id != null &&
      profile.clientId === client.id);

  // Édition des métadonnées audit : permission rôle uniquement.
  const canEdit = canEditAudit(profile.role);

  const [
    { count: pageCount },
    { count: ncCount },
    lifecycleRpc,
    currentScoreRpc,
  ] = await Promise.all([
    supabase
      .from("pages")
      .select("id", { count: "exact", head: true })
      .eq("audit_id", uuid),
    supabase
      .from("non_conformities")
      .select("id", { count: "exact", head: true })
      .eq("audit_id", uuid)
      .neq("status", "RESOLVED"),
    // Snapshot des conditions de transition de statut (RPC migration 32).
    supabase.rpc("audit_status_lifecycle_view", { p_audit_id: uuid }),
    // Score temps réel calculé depuis la matrice (RPC migration 38).
    supabase.rpc("audit_current_score", { p_audit_id: uuid }),
  ]);

  // Score affiché = score figé (final_score) si l'audit est livré ; sinon
  // valeur temps réel calculée depuis la matrice via RPC. Tombe sur
  // initial_score puis 0 si rien de calculable (audit vierge).
  const liveScore =
    typeof currentScoreRpc.data === "number"
      ? currentScoreRpc.data
      : typeof currentScoreRpc.data === "string"
        ? Number.parseFloat(currentScoreRpc.data)
        : null;
  const score =
    (audit.final_score as number | null) ??
    liveScore ??
    (audit.initial_score as number | null) ??
    0;
  const level = getConformityLevel(score);

  const lifecycleRow = Array.isArray(lifecycleRpc.data)
    ? lifecycleRpc.data[0]
    : lifecycleRpc.data;
  const statusSnapshot: AuditLifecycleSnapshot = {
    representativeCount: Number(lifecycleRow?.representative_count ?? 0),
    matrixFilled: Number(lifecycleRow?.matrix_filled ?? 0),
    matrixTotal: Number(lifecycleRow?.matrix_total ?? 0),
    matrixPercent: Number(lifecycleRow?.matrix_percent ?? 0),
    startDateSet: Boolean(lifecycleRow?.start_date_set ?? false),
    startDateReached: Boolean(lifecycleRow?.start_date_reached ?? false),
  };

  // Transitions manuelles disponibles depuis le statut courant pour ce rôle.
  const currentStatus = audit.status as AuditStatus;
  const availableStatusTransitions: AvailableStatusTransition[] =
    availableManualTransitions(currentStatus, profile.role).map((tr) => ({
      to: tr.to,
      ctaKey: tr.ctaKey,
    }));

  // ──────────────────────────────────────────────────────────────────────────
  // Auditeurs assignés. La gestion est réservée à l'admin (la RLS de la
  // migration 25 restreint l'INSERT/DELETE sur `audit_assignees` à is_admin()).
  // Pour la liste des candidats disponibles, on charge tous les auditeurs +
  // admins actifs, on filtre côté JS les déjà-assignés.
  // ──────────────────────────────────────────────────────────────────────────
  // Gestion des assignees : admin ET client_admin (élargi par migration 35).
  // Pour client_admin, la RLS filtre déjà sur son client — pas besoin de
  // double check côté UI.
  const canManageAssignees = canAssignAuditor(profile.role);
  const canManageProofreaders = canAssignProofreader(profile.role);

  // Une requête couvre les deux rôles ; on partage ensuite côté JS.
  const { data: allAssigneesRows } = await supabase
    .from("audit_assignees")
    .select(
      `profile_id, role,
       profile:profiles!inner(first_name, last_name, email, role)`,
    )
    .eq("audit_id", uuid)
    .in("role", ["auditor", "proofreader"]);

  type RawAssigneeRow = {
    profile_id: string;
    role: string;
    profile:
      | {
          first_name: string | null;
          last_name: string | null;
          email: string | null;
          role: string | null;
        }
      | Array<{
          first_name: string | null;
          last_name: string | null;
          email: string | null;
          role: string | null;
        }>
      | null;
  };

  const rawAssignees = (allAssigneesRows ?? []) as RawAssigneeRow[];
  const assignees: AssigneeEntry[] = rawAssignees
    .filter((row) => row.role === "auditor")
    .map((row) => {
      const p = Array.isArray(row.profile) ? row.profile[0] : row.profile;
      return {
        profileId: row.profile_id,
        firstName: p?.first_name ?? null,
        lastName: p?.last_name ?? null,
        email: p?.email ?? null,
        role: (p?.role ?? "auditor") as AssigneeEntry["role"],
      };
    });

  const proofreaders: ProofreaderEntry[] = rawAssignees
    .filter((row) => row.role === "proofreader")
    .map((row) => {
      const p = Array.isArray(row.profile) ? row.profile[0] : row.profile;
      return {
        profileId: row.profile_id,
        firstName: p?.first_name ?? null,
        lastName: p?.last_name ?? null,
        email: p?.email ?? null,
        role: (p?.role ?? "auditor") as ProofreaderEntry["role"],
      };
    });

  // Candidats : on charge si admin gère les assignees OU si on gère les
  // relecteurs (les deux puisent dans le même pool staff). On filtre ensuite
  // côté JS pour chaque liste : auditeur déjà assigné ne peut pas être
  // candidat relecteur (et inversement).
  const auditorIdsSet = new Set(assignees.map((a) => a.profileId));
  const proofreaderIdsSet = new Set(proofreaders.map((p) => p.profileId));

  let available: AssignableAuditor[] = [];
  let availableProofreaders: ProofreaderCandidate[] = [];
  if (canManageAssignees || canManageProofreaders) {
    const { data: staffRows } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email, role, is_active")
      .in("role", ["auditor", "admin"])
      .eq("is_active", true);
    const staff = staffRows ?? [];

    if (canManageAssignees) {
      available = staff
        .filter((p) => !auditorIdsSet.has(p.id))
        .map((p) => ({
          id: p.id as string,
          firstName: (p.first_name as string | null) ?? null,
          lastName: (p.last_name as string | null) ?? null,
          email: (p.email as string | null) ?? null,
          role: ((p.role as string) ?? "auditor") as AssignableAuditor["role"],
        }));
    }
    if (canManageProofreaders) {
      availableProofreaders = staff
        .filter(
          (p) =>
            !proofreaderIdsSet.has(p.id) &&
            !auditorIdsSet.has(p.id), // un auditeur de l'audit ne peut pas se relire
        )
        .map((p) => ({
          id: p.id as string,
          firstName: (p.first_name as string | null) ?? null,
          lastName: (p.last_name as string | null) ?? null,
          email: (p.email as string | null) ?? null,
          role: ((p.role as string) ?? "auditor") as ProofreaderCandidate["role"],
        }));
    }
  }

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      <nav aria-label="Breadcrumb">
        <Button asChild variant="ghost" size="sm" className="gap-1 -ml-3">
          <Link href="/audits">
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            {t("back")}
          </Link>
        </Button>
      </nav>

      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{client?.name ?? "—"}</Badge>
            <span aria-hidden="true" className="text-muted-foreground">
              /
            </span>
            <Badge variant="muted">
              {tPlatform(audit.platform as PlatformType)}
            </Badge>
            <AuditStatusBadge status={audit.status as AuditStatus} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {project?.name ?? t("noProjectTitle")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {ref
              ? `${REFERENCE_TYPE_LABELS[ref.type as ReferenceType]} ${ref.version}`
              : t("unknownReference")}{" "}
            · {tServiceType(audit.service_type as ServiceType)}
          </p>
        </div>

        <div className="flex flex-wrap items-start gap-2">
          {canExportReport && (
            <ExportReportButton
              auditId={uuid}
              projectName={project?.name ?? "audit"}
              variant="outline"
            />
          )}
          {canEdit && (
            <Button asChild variant="outline" className="gap-2">
              <Link href={`/audits/${uuid}/edit`}>
                <Pencil className="h-4 w-4" aria-hidden="true" />
                {t("edit")}
              </Link>
            </Button>
          )}
          <Button asChild className="gap-2">
            <Link href={`/audits/${uuid}/simulator`}>
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {t("openSimulator")}
            </Link>
          </Button>
        </div>
      </header>

      {/* ──────────────────────────────────────────────────────────────────
          Actions rapides — 4 cartes prominentes, accès direct aux sections
      ────────────────────────────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <QuickLink
          href={`/audits/${uuid}/matrix`}
          icon={ClipboardList}
          title={t("quickLinks.matrixTitle")}
          description={t("quickLinks.matrixDesc")}
          tone="primary"
        />
        <QuickLink
          href={`/audits/${uuid}/sample`}
          icon={FileSearch}
          title={t("quickLinks.sampleTitle")}
          description={t("quickLinks.sampleDesc")}
          tone="success"
        />
        <QuickLink
          href={`/audits/${uuid}/anomalies`}
          icon={ListChecks}
          title={t("quickLinks.anomaliesTitle")}
          description={t("quickLinks.anomaliesDesc")}
          tone="warning"
        />
        <QuickLink
          href={`/audits/${uuid}/simulator`}
          icon={Sparkles}
          title={t("quickLinks.simulatorTitle")}
          description={t("quickLinks.simulatorDesc")}
          tone="violet"
        />
      </div>

      {/* ──────────────────────────────────────────────────────────────────
          Section 1 · Vue d'ensemble : score hero + planning
      ────────────────────────────────────────────────────────────────── */}
      <SectionHeader
        icon={Sparkles}
        tone="primary"
        title={t("sections.overview")}
        description={t("sections.overviewDesc")}
      />

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardDescription>{t("conformityRate")}</CardDescription>
            <CardTitle className="flex items-baseline gap-3">
              <span
                className="text-5xl font-bold tabular-nums"
                style={{ color: `hsl(${getScoreColorVar(score)})` }}
              >
                {formatScore(score)}
              </span>
              <span
                className={cn(
                  "text-sm font-medium",
                  level === "non-compliant" && "text-destructive",
                  level === "partial" && "text-warning",
                  level === "full" && "text-success",
                )}
              >
                {getConformityLabel(score)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress
              value={score}
              fillColor={getScoreColorVar(score)}
              aria-label={t("conformityAria", { score })}
            />
            <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
              <Stat
                label={t("scoreInitial")}
                value={formatScore(audit.initial_score)}
              />
              <Stat
                label={t("scoreFinal")}
                value={formatScore(audit.final_score)}
              />
              <Stat
                label={t("samplePages")}
                value={(pageCount ?? 0).toString()}
              />
              <Stat
                label={t("openNCs")}
                value={(ncCount ?? 0).toString()}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("planning")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row
              label={t("startDate")}
              value={formatDate(audit.expected_start_at)}
            />
            <Row
              label={t("endDate")}
              value={formatDate(audit.expected_end_at)}
            />
            <Row
              label={t("restitutionDate")}
              value={formatDate(audit.restitution_at)}
            />
            <Row
              label={t("counterAuditDate")}
              value={formatDate(audit.counter_audit_at)}
            />
            <Row
              label={t("deliveredAt")}
              value={formatDate(audit.delivered_at)}
            />
            <Row label={t("onlineAt")} value={formatDate(audit.online_at)} />
          </CardContent>
        </Card>
      </div>

      {/* ──────────────────────────────────────────────────────────────────
          Section 2 · Avancement : cycle de vie de l'audit
      ────────────────────────────────────────────────────────────────── */}
      <SectionHeader
        icon={ListChecks}
        tone="warning"
        title={t("sections.progress")}
        description={t("sections.progressDesc")}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("lifecycleTitle")}</CardTitle>
          <CardDescription>{t("lifecycleSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <AuditStatusActions
            auditId={uuid}
            currentStatus={currentStatus}
            snapshot={statusSnapshot}
            available={availableStatusTransitions}
          />
        </CardContent>
      </Card>

      {/* ──────────────────────────────────────────────────────────────────
          Section 3 · Équipe : auditeurs + relecteurs
      ────────────────────────────────────────────────────────────────── */}
      <SectionHeader
        icon={UsersIcon}
        tone="success"
        title={t("sections.team")}
        description={t("sections.teamDesc")}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("assigneesTitle")}</CardTitle>
            <CardDescription>{t("assigneesSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <AuditAssignees
              auditId={uuid}
              assignees={assignees}
              available={available}
              canManage={canManageAssignees}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("proofreadersTitle")}</CardTitle>
            <CardDescription>{t("proofreadersSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <AuditProofreaders
              auditId={uuid}
              proofreaders={proofreaders}
              available={availableProofreaders}
              canManage={canManageProofreaders}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium tabular-nums">{value}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  title,
  description,
  tone,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
  tone?: "primary" | "warning" | "success" | "violet";
}) {
  const toneClasses = {
    primary: "bg-primary/10 text-primary group-hover:bg-primary/15",
    warning: "bg-warning/10 text-warning group-hover:bg-warning/15",
    success: "bg-success/10 text-success group-hover:bg-success/15",
    violet:
      "bg-violet-500/10 text-violet-500 group-hover:bg-violet-500/15",
  } as const;
  const t = tone ?? "primary";
  return (
    <Link
      href={href}
      className="group flex flex-col gap-2 rounded-lg border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-md"
    >
      <div
        aria-hidden="true"
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
          toneClasses[t],
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 space-y-0.5">
        <div className="font-semibold leading-tight">{title}</div>
        <div className="text-xs text-muted-foreground leading-snug">
          {description}
        </div>
      </div>
    </Link>
  );
}
