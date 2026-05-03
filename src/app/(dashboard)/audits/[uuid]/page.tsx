import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronLeft,
  ClipboardList,
  Sparkles,
  FileSearch,
  ListChecks,
  Pencil,
} from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import { formatDate, formatScore, cn } from "@/lib/utils";
import {
  PLATFORM_LABELS,
  REFERENCE_TYPE_LABELS,
  SERVICE_TYPE_LABELS,
} from "@/lib/constants";
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

interface PageProps {
  params: Promise<{ uuid: string }>;
}

export default async function AuditDetailPage({ params }: PageProps) {
  await requireProfile();
  const { uuid } = await params;
  const supabase = await createClient();

  const { data: audit, error } = await supabase
    .from("audits")
    .select(
      `
      *,
      reference:references(type, version),
      project:projects(name, url, client:clients(name))
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

  const score = audit.final_score ?? audit.initial_score ?? 0;
  const level = getConformityLevel(score);

  // Counts annexes (best-effort)
  const [{ count: pageCount }, { count: ncCount }] = await Promise.all([
    supabase
      .from("pages")
      .select("id", { count: "exact", head: true })
      .eq("audit_id", uuid),
    supabase
      .from("non_conformities")
      .select("id", { count: "exact", head: true })
      .eq("audit_id", uuid)
      .neq("status", "RESOLVED"),
  ]);

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      {/* Breadcrumb -------------------------------------------------------- */}
      <nav aria-label="Fil d'Ariane">
        <Button asChild variant="ghost" size="sm" className="gap-1 -ml-3">
          <Link href="/audits">
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Retour aux audits
          </Link>
        </Button>
      </nav>

      {/* En-tête ---------------------------------------------------------- */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{client?.name ?? "—"}</Badge>
            <span aria-hidden="true" className="text-muted-foreground">
              /
            </span>
            <Badge variant="muted">
              {PLATFORM_LABELS[audit.platform as PlatformType]}
            </Badge>
            <AuditStatusBadge status={audit.status as AuditStatus} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {project?.name ?? "Audit sans projet"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {ref
              ? `${REFERENCE_TYPE_LABELS[ref.type as ReferenceType]} ${ref.version}`
              : "Référentiel inconnu"}{" "}
            · {SERVICE_TYPE_LABELS[audit.service_type as ServiceType]}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="gap-2">
            <Link href={`/audits/${uuid}/edit`}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Modifier
            </Link>
          </Button>
          <Button asChild className="gap-2">
            <Link href={`/audits/${uuid}/simulator`}>
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Ouvrir le simulateur
            </Link>
          </Button>
        </div>
      </header>

      {/* Cartes principales ---------------------------------------------- */}
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardDescription>Taux de conformité</CardDescription>
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
              aria-label={`Conformité : ${score}%`}
            />
            <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
              <Stat
                label="Score initial"
                value={formatScore(audit.initial_score)}
              />
              <Stat
                label="Score final"
                value={formatScore(audit.final_score)}
              />
              <Stat
                label="Pages échantillon"
                value={(pageCount ?? 0).toString()}
              />
              <Stat label="NC ouvertes" value={(ncCount ?? 0).toString()} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Planning</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row
              label="Démarrage prévu"
              value={formatDate(audit.expected_start_at)}
            />
            <Row label="Fin prévue" value={formatDate(audit.expected_end_at)} />
            <Row label="Livré le" value={formatDate(audit.delivered_at)} />
            <Row label="Mis en ligne" value={formatDate(audit.online_at)} />
          </CardContent>
        </Card>
      </div>

      {/* Liens rapides --------------------------------------------------- */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <QuickLink
          href={`/audits/${uuid}/matrix`}
          icon={ClipboardList}
          title="Matrice de conformité"
          description="Saisir le statut de conformité pour chaque critère et chaque page."
        />
        <QuickLink
          href={`/audits/${uuid}/sample`}
          icon={FileSearch}
          title="Échantillon"
          description="Pages testées et leur complexité."
        />
        <QuickLink
          href={`/audits/${uuid}/anomalies`}
          icon={ListChecks}
          title="Non-conformités"
          description="Toutes les NC, par sévérité et par page."
        />
        <QuickLink
          href={`/audits/${uuid}/simulator`}
          icon={Sparkles}
          title="Simulateur de remédiation"
          description="Voir l'impact de corrections virtuelles sur le score."
          highlight
        />
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
  highlight,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/40",
        highlight && "border-primary/40 ring-1 ring-primary/20",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "grid h-9 w-9 place-items-center rounded-md",
            highlight
              ? "bg-primary/10 text-primary"
              : "bg-muted text-foreground",
          )}
          aria-hidden="true"
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="font-medium">{title}</div>
          <div className="text-sm text-muted-foreground">{description}</div>
        </div>
      </div>
    </Link>
  );
}
