import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { RemediationSimulator } from "@/components/audit/remediation-simulator";
import { NC_CLOSED_STATUSES } from "@/lib/constants";
import type {
  NCSeverity,
  NCStatus,
} from "@/types/domain";
import type {
  SimulatorNC,
  SimulatorPage,
  SimulatorThematic,
} from "@/components/audit/remediation-simulator";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Simulateur de remédiation" };

interface PageProps {
  params: Promise<{ uuid: string }>;
}

export default async function SimulatorPage({ params }: PageProps) {
  await requireProfile();
  const { uuid } = await params;
  const supabase = await createClient();

  // 1. L'audit lui-même (pour le titre et le référentiel)
  const { data: audit, error } = await supabase
    .from("audits")
    .select(
      `
      id, reference_id,
      project:projects(name, client:clients(name))
    `,
    )
    .eq("id", uuid)
    .single();

  if (error || !audit) {
    notFound();
  }

  const project = Array.isArray(audit.project) ? audit.project[0] : audit.project;
  const client = project?.client
    ? Array.isArray(project.client)
      ? project.client[0]
      : project.client
    : null;

  // 2. Total de critères du référentiel
  const { count: totalCriteria } = await supabase
    .from("criteria")
    .select("id, thematic:thematics!inner(reference_id)", {
      count: "exact",
      head: true,
    })
    .eq("thematic.reference_id", audit.reference_id);

  // 3. Chargement parallèle : conformités, NC (toutes), pages, thématiques
  const [
    { data: conformities },
    { data: ncs },
    { data: pageRows },
    { data: thematicRows },
  ] = await Promise.all([
    supabase
      .from("page_conformities")
      .select("status, criteria_id")
      .eq("audit_id", uuid),
    supabase
      .from("non_conformities")
      .select(
        `
        id, page_id, criteria_id, title, description,
        severity, status,
        criterion:criteria!inner(
          id, identifier, name,
          thematic:thematics!inner(id, identifier, name, sort_order)
        ),
        page:pages(id, name, sort_order)
      `,
      )
      .eq("audit_id", uuid),
    supabase
      .from("pages")
      .select("id, name, sort_order")
      .eq("audit_id", uuid)
      .order("sort_order"),
    supabase
      .from("thematics")
      .select("id, identifier, name, sort_order")
      .eq("reference_id", audit.reference_id)
      .order("sort_order"),
  ]);

  // 4. Score initial (depuis page_conformities)
  const distinctCompliant = new Set<string>();
  const distinctNotApplicable = new Set<string>();
  for (const c of conformities ?? []) {
    if (c.status === "COMPLIANT") distinctCompliant.add(c.criteria_id);
    if (c.status === "NOT_APPLICABLE") distinctNotApplicable.add(c.criteria_id);
  }

  // 5. Normalisation des NC
  type RawCriterionThematic = {
    id: string;
    identifier: string;
    name: string;
    sort_order: number;
  };
  type RawCriterion = {
    id: string;
    identifier: string;
    name: string;
    thematic: RawCriterionThematic | RawCriterionThematic[] | null;
  };
  type RawPage = { id: string; name: string; sort_order: number };

  const allNCs: SimulatorNC[] = (ncs ?? []).map((n) => {
    const criterion = (
      Array.isArray(n.criterion) ? n.criterion[0] : n.criterion
    ) as RawCriterion;
    const page = (
      Array.isArray(n.page) ? n.page[0] : n.page
    ) as RawPage | null;
    const thematic = criterion?.thematic
      ? Array.isArray(criterion.thematic)
        ? criterion.thematic[0]
        : criterion.thematic
      : null;

    return {
      id: n.id as string,
      criteriaId: n.criteria_id as string,
      title: n.title as string,
      description: (n.description as string | null) ?? null,
      severity: n.severity as NCSeverity,
      status: n.status as NCStatus,
      isFixed: NC_CLOSED_STATUSES.includes(n.status as NCStatus),
      criterion: criterion
        ? {
            id: criterion.id,
            identifier: criterion.identifier,
            name: criterion.name,
          }
        : { id: n.criteria_id as string, identifier: "?", name: "Critère inconnu" },
      thematic: thematic
        ? {
            id: thematic.id,
            identifier: thematic.identifier,
            name: thematic.name,
            sortOrder: thematic.sort_order,
          }
        : null,
      page: page ? { id: page.id, name: page.name, sortOrder: page.sort_order } : null,
    };
  });

  const auditPages: SimulatorPage[] = (pageRows ?? []).map((p) => ({
    id: p.id as string,
    name: p.name as string,
    sortOrder: p.sort_order as number,
  }));

  const referenceThematics: SimulatorThematic[] = (thematicRows ?? []).map(
    (t) => ({
      id: t.id as string,
      identifier: t.identifier as string,
      name: t.name as string,
      sortOrder: t.sort_order as number,
    }),
  );

  // ncId → criteriaId pour le calcul de "tous les NC d'un critère cochés"
  const fixableCriteriaPerNC: Record<string, string> = {};
  for (const nc of allNCs) fixableCriteriaPerNC[nc.id] = nc.criterion.id;

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      <nav aria-label="Fil d'Ariane">
        <Button asChild variant="ghost" size="sm" className="gap-1 -ml-3">
          <Link href={`/audits/${uuid}`}>
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Retour à l&apos;audit
          </Link>
        </Button>
      </nav>

      <header className="space-y-1">
        <p className="text-xs text-muted-foreground">
          {client?.name ?? "—"} · {project?.name ?? "—"}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Simulateur de remédiation
        </h1>
        <p className="text-sm text-muted-foreground">
          Cochez des non-conformités pour visualiser l&apos;impact sur le score, sans
          rien modifier dans l&apos;audit officiel.
        </p>
      </header>

      <RemediationSimulator
        allNCs={allNCs}
        auditPages={auditPages}
        referenceThematics={referenceThematics}
        totalCriteria={totalCriteria ?? 0}
        initialCompliant={distinctCompliant.size}
        notApplicable={distinctNotApplicable.size}
        fixableCriteriaPerNC={fixableCriteriaPerNC}
      />
    </div>
  );
}
