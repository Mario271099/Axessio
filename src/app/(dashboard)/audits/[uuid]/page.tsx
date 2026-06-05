import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Pencil } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { orgHasFeature } from "@/lib/billing/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { AuditContacts } from "@/components/audit/audit-contacts";
import {
  AuditStatusActions,
  type AvailableStatusTransition,
} from "@/components/audit/audit-status-actions";
import { AuditStatusBadge } from "@/components/audit/audit-status-badge";
import { AuditTabsNav } from "@/components/audit/audit-tabs-nav";
import { AuditNextAction } from "@/components/audit/audit-next-action";
import { AuditTimelineVertical } from "@/components/audit/audit-timeline-vertical";
import { AuditActivityCard } from "@/components/audit/audit-activity-card";
import { AuditKpiBar } from "@/components/audit/audit-kpi-bar";
import {
  InterlocutorsCard,
  type Interlocutor,
} from "@/components/audit/interlocutors-card";
import type { AuditLifecycleSnapshot } from "@/lib/audit-status";
import { availableManualTransitions } from "@/lib/audit-status";
import { MiniDonut } from "@/components/ui/mini-donut";
import { cn } from "@/lib/utils";
import { REFERENCE_TYPE_LABELS } from "@/lib/constants";
import {
  canAssignProofreader,
  canAny,
} from "@/lib/permissions";
import { loadMyOrgPermissions } from "@/lib/server-permissions";
import {
  getConformityLabel,
  getConformityLevel,
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
      project:projects(name, url, client:clients(id, name)),
      organization:organizations(slug)
    `,
    )
    .eq("id", uuid)
    .single();

  if (error || !audit) {
    notFound();
  }

  // L'org est join 1-1 mais Supabase peut renvoyer un tableau selon le
  // résolveur. On aplatit ici pour avoir une shape stable.
  const auditOrg = Array.isArray(audit.organization)
    ? audit.organization[0]
    : audit.organization;
  const auditOrgSlug: string | null = (auditOrg?.slug as string | null) ?? null;

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
  // Le check de feature `export.pdf` est ajouté en AND : sans Starter+,
  // le bouton ne s'affiche pas (l'API renvoie 402 si on bypass).
  const canExportRole =
    profile.isPlatformAdmin ||
    profile.role === "auditor" ||
    (profile.role === "client_admin" &&
      client?.id != null &&
      profile.clientId === client.id);
  const hasExportFeature = await orgHasFeature("export.pdf");
  const canExportReport = canExportRole && hasExportFeature;

  // Édition des métadonnées audit : legacy OU permission d'org `audit.edit`.
  const orgPerms = await loadMyOrgPermissions();
  const canEdit = canAny(profile.role, orgPerms, "audit.edit");

  const [
    { count: pageCount },
    { count: ncCount },
    { count: criticalNcCount },
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
    // NC critiques ouvertes — KPI "risque" du bandeau.
    supabase
      .from("non_conformities")
      .select("id", { count: "exact", head: true })
      .eq("audit_id", uuid)
      .neq("status", "RESOLVED")
      .eq("severity", "CRITICAL"),
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
  const canManageAssignees = canAny(
    profile.role,
    orgPerms,
    "audit.assign_auditor",
  );
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

  // Contacts client (Porte 2 — Phase 5). Visibilité scopée à cet audit
  // uniquement, fil review automatiquement masqué (mig. 70).
  const contacts = rawAssignees
    .filter((row) => row.role === "contact")
    .map((row) => {
      const p = Array.isArray(row.profile) ? row.profile[0] : row.profile;
      return {
        profileId: row.profile_id,
        firstName: p?.first_name ?? null,
        lastName: p?.last_name ?? null,
        email: p?.email ?? null,
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

    // Modèle self-serve : on ajoute les MEMBRES de l'org de l'audit au pool de
    // candidats (un owner désigne un coéquipier de son org). Le staff legacy
    // reste candidat pour la rétro-compatibilité. Dédoublonnage par id.
    const auditOrgId = audit.organization_id as string | null;
    type CandidateRow = {
      id: string;
      first_name: string | null;
      last_name: string | null;
      email: string | null;
      role: string | null;
      is_active: boolean | null;
    };
    let orgMemberRows: CandidateRow[] = [];
    if (auditOrgId) {
      const { data: memberRows } = await supabase
        .from("organization_members")
        .select(
          `profile:profiles!inner(id, first_name, last_name, email, role, is_active)`,
        )
        .eq("organization_id", auditOrgId);
      orgMemberRows = ((memberRows ?? []) as Array<{ profile: unknown }>)
        .map((r) => (Array.isArray(r.profile) ? r.profile[0] : r.profile))
        .filter((p): p is CandidateRow => Boolean(p) && p.is_active !== false);
    }

    const byId = new Map<string, CandidateRow>();
    for (const p of [...(staffRows ?? []), ...orgMemberRows] as CandidateRow[]) {
      if (p?.id) byId.set(p.id, p);
    }
    const staff = Array.from(byId.values());

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

  // ──────────────────────────────────────────────────────────────────────────
  // Liste consolidée d'interlocuteurs (auditeurs + relecteurs + client admins
  // côté client) pour la carte de droite. Le format est uniforme.
  // ──────────────────────────────────────────────────────────────────────────
  let clientContacts: Array<{
    id: string;
    name: string;
    email: string | null;
  }> = [];
  if (client?.id) {
    const { data: contactsRows } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email")
      .eq("client_id", client.id)
      .eq("is_active", true)
      .in("role", ["client_admin", "client"])
      .limit(10);
    clientContacts = (contactsRows ?? []).map((p) => ({
      id: p.id as string,
      name:
        [p.first_name, p.last_name]
          .filter((v) => typeof v === "string" && (v as string).trim())
          .join(" ")
          .trim() ||
        (p.email as string | null) ||
        "—",
      email: (p.email as string | null) ?? null,
    }));
  }

  const interlocutors: Interlocutor[] = [
    ...assignees.map((a) => ({
      id: a.profileId,
      name:
        [a.firstName, a.lastName]
          .filter((v) => v && v.trim().length > 0)
          .join(" ")
          .trim() ||
        a.email ||
        "—",
      email: a.email,
      role: "auditor" as const,
      subtitle: null,
    })),
    ...proofreaders.map((p) => ({
      id: p.profileId,
      name:
        [p.firstName, p.lastName]
          .filter((v) => v && v.trim().length > 0)
          .join(" ")
          .trim() ||
        p.email ||
        "—",
      email: p.email,
      role: "proofreader" as const,
      subtitle: null,
    })),
    ...clientContacts.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      role: "client" as const,
      subtitle: project?.name ?? client?.name ?? null,
    })),
  ];

  // Identité du site/app audité (mig. 74) avec fallback sur les anciennes
  // données projet pour les audits créés avant la refonte.
  const siteName =
    (audit.site_name as string | null)?.trim() ||
    (project?.name as string | null) ||
    null;
  const siteUrl =
    (audit.site_url as string | null)?.trim() ||
    (project?.url as string | null) ||
    null;
  const isMobileAudit = audit.platform === "MOBILE";
  const referenceLabel = ref
    ? `${REFERENCE_TYPE_LABELS[ref.type as ReferenceType]} ${ref.version}`
    : t("unknownReference");

  // Couleur d'accent du hero, dérivée du score (rouge/jaune/vert).
  // Donne un signal visuel immédiat sur la santé de l'audit sans nécessiter
  // de lecture du chiffre.
  const heroAccent =
    level === "non-compliant"
      ? "from-destructive/15 via-destructive/5 to-transparent"
      : level === "partial"
        ? "from-warning/15 via-warning/5 to-transparent"
        : "from-success/15 via-success/5 to-transparent";

  // Un utilisateur "actif" sur l'audit = staff + a accès. Pour les boutons
  // CTA du Next Action ; la RLS + permissions bloqueraient de toute façon.
  const canAct = canEdit;

  return (
    <div className="container mx-auto max-w-7xl space-y-5 p-6 md:p-8">
      {/* Breadcrumb minimaliste */}
      <nav aria-label="Breadcrumb">
        <Button asChild variant="ghost" size="sm" className="gap-1 -ml-3">
          <Link href="/audits">
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            {t("back")}
          </Link>
        </Button>
      </nav>

      {/* Onglets de navigation (Dashboard / Échantillon / NC / ...) */}
      <AuditTabsNav auditId={uuid} active="dashboard" />

      {/* ──────────────────────────────────────────────────────────────────
          HERO ADAPTATIF : gradient dérivé du score + identité + KPIs
          ────────────────────────────────────────────────────────────────
          Le contraste de teinte donne le pouls de l'audit au premier regard.
          À gauche : projet, client, tags. À droite : score donut prominent.
      ────────────────────────────────────────────────────────────────── */}
      <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-border">
        <div
          className={cn(
            "bg-gradient-to-br p-6 md:p-7",
            heroAccent,
          )}
        >
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            {/* Identité projet */}
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="default" className="rounded-full">
                  {client?.name ?? "—"}
                </Badge>
                <Badge variant="outline" className="rounded-full">
                  {tPlatform(audit.platform as PlatformType)}
                </Badge>
                <AuditStatusBadge status={currentStatus} className="rounded-full" />
              </div>
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  {project?.name ?? t("noProjectTitle")}
                </p>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                  {siteName ?? t("noProjectTitle")}
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                {siteUrl &&
                  (isMobileAudit ? (
                    <span className="break-all font-mono text-xs text-foreground/80">
                      {siteUrl}
                    </span>
                  ) : (
                    <a
                      href={siteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-primary underline-offset-2 hover:underline"
                    >
                      {siteUrl}
                    </a>
                  ))}
                {siteUrl && <span aria-hidden="true">·</span>}
                <span>{referenceLabel}</span>
                <span aria-hidden="true">·</span>
                <span>{tServiceType(audit.service_type as ServiceType)}</span>
              </div>

              {/* Actions header — boutons compacts, rangés en pills */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                {canExportReport && (
                  <ExportReportButton
                    auditId={uuid}
                    projectName={project?.name ?? "audit"}
                    variant="outline"
                  />
                )}
                {canEdit && (
                  <Button asChild variant="outline" className="gap-2 rounded-full">
                    <Link href={`/audits/${uuid}/edit`}>
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      {t("edit")}
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            {/* Score donut prominent */}
            <div className="flex shrink-0 items-center gap-4 md:flex-col md:items-end md:text-right">
              <MiniDonut value={score} size={130} tone="score" />
              <div>
                <p
                  className={cn(
                    "text-sm font-semibold",
                    level === "non-compliant" && "text-destructive",
                    level === "partial" && "text-warning",
                    level === "full" && "text-success",
                  )}
                >
                  {getConformityLabel(score)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("conformityRate")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ──────────────────────────────────────────────────────────────────
          NEXT ACTION : le cœur de la philosophie "Mission Control".
          Lit le statut + complétion et propose UNE action claire.
      ────────────────────────────────────────────────────────────────── */}
      <AuditNextAction
        auditId={uuid}
        status={currentStatus}
        snapshot={statusSnapshot}
        canAct={canAct}
      />

      {/* ──────────────────────────────────────────────────────────────────
          KPI BAR : 4 indicateurs opérationnels en bandeau scanable.
      ────────────────────────────────────────────────────────────────── */}
      <AuditKpiBar
        sampleCount={pageCount ?? 0}
        matrixFilled={statusSnapshot.matrixFilled}
        matrixTotal={statusSnapshot.matrixTotal}
        openNcCount={ncCount ?? 0}
        criticalNcCount={criticalNcCount ?? 0}
      />

      {/* ──────────────────────────────────────────────────────────────────
          Grille principale : Cycle de vie (gauche, large) | Timeline +
          Interlocuteurs (droite, sticky-ish)
      ────────────────────────────────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        {/* Colonne gauche : actions de cycle de vie + activité récente */}
        <div className="space-y-5">
          <Card id="lifecycle" className="scroll-mt-24">
            <CardHeader>
              <CardTitle className="text-base">{t("lifecycleTitle")}</CardTitle>
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

          <AuditActivityCard auditId={uuid} orgSlug={auditOrgSlug} />
        </div>

        {/* Colonne droite : timeline + interlocuteurs empilés */}
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("timelineTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <AuditTimelineVertical
                expectedStartAt={audit.expected_start_at}
                expectedEndAt={audit.expected_end_at}
                restitutionAt={audit.restitution_at}
                counterAuditAt={audit.counter_audit_at}
                deliveredAt={audit.delivered_at}
                onlineAt={audit.online_at}
              />
            </CardContent>
          </Card>

          <InterlocutorsCard
            interlocutors={interlocutors}
            canEdit={canManageAssignees || canManageProofreaders}
            manageHref={
              canManageAssignees || canManageProofreaders
                ? `#team-${uuid}`
                : undefined
            }
          />
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────
          ÉQUIPE : édition fine auditeurs / relecteurs (ancre)
      ────────────────────────────────────────────────────────────────── */}
      <div
        id={`team-${uuid}`}
        className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 scroll-mt-24"
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("assigneesTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <AuditAssignees
              auditId={uuid}
              assignees={assignees}
              available={available}
              canManage={canManageAssignees}
              orgSlug={auditOrgSlug}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("proofreadersTitle")}</CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("contactsTitle")}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t("contactsDesc")}
            </p>
          </CardHeader>
          <CardContent>
            <AuditContacts
              auditId={uuid}
              contacts={contacts}
              canManage={canManageAssignees}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

