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
  NonConformityEnriched,
} from "@/types/domain";
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

  // 3. Conformités existantes (pour calculer le score initial)
  const { data: conformities } = await supabase
    .from("page_conformities")
    .select("status, criteria_id")
    .eq("audit_id", uuid);

  const distinctCompliant = new Set<string>();
  const distinctNotApplicable = new Set<string>();
  for (const c of conformities ?? []) {
    if (c.status === "COMPLIANT") distinctCompliant.add(c.criteria_id);
    if (c.status === "NOT_APPLICABLE") distinctNotApplicable.add(c.criteria_id);
  }

  // 4. NC ouvertes
  const { data: ncs } = await supabase
    .from("non_conformities")
    .select(
      `
      id, audit_id, page_id, criteria_id, test_id, identifier, title, description,
      recommendation, external_reference, severity, status, created_at, updated_at,
      criterion:criteria!inner(id, identifier, name),
      page:pages(id, name)
    `,
    )
    .eq("audit_id", uuid)
    .not("status", "in", `(${NC_CLOSED_STATUSES.map((s) => `"${s}"`).join(",")})`);

  const openNCs: NonConformityEnriched[] = (ncs ?? []).map((n) => {
    const criterion = Array.isArray(n.criterion) ? n.criterion[0] : n.criterion;
    const page = Array.isArray(n.page) ? n.page[0] : n.page;
    return {
      id: n.id,
      auditId: n.audit_id,
      pageId: n.page_id,
      criteriaId: n.criteria_id,
      testId: n.test_id,
      identifier: n.identifier,
      title: n.title,
      description: n.description,
      recommendation: n.recommendation,
      externalReference: n.external_reference,
      severity: n.severity as NCSeverity,
      status: n.status as NCStatus,
      createdAt: n.created_at,
      updatedAt: n.updated_at,
      criterion: criterion
        ? { id: criterion.id, identifier: criterion.identifier, name: criterion.name }
        : { id: n.criteria_id, identifier: "?", name: "Critère inconnu" },
      page: page ? { id: page.id, name: page.name } : null,
    };
  });

  // Mapping ncId → criteriaId : nécessaire pour calculer "tous les NC d'un critère cochés"
  const fixableCriteriaPerNC: Record<string, string> = {};
  for (const nc of openNCs) {
    fixableCriteriaPerNC[nc.id] = nc.criterion.id;
  }

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
        openNCs={openNCs}
        totalCriteria={totalCriteria ?? 0}
        initialCompliant={distinctCompliant.size}
        notApplicable={distinctNotApplicable.size}
        fixableCriteriaPerNC={fixableCriteriaPerNC}
      />
    </div>
  );
}
