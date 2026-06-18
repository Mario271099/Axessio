import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AuditTabsNav } from "@/components/audit/audit-tabs-nav";
import { RemediationSimulator } from "@/components/audit/remediation-simulator";
import { FeatureUpsell } from "@/components/billing/feature-upsell";
import { orgHasFeature } from "@/lib/billing/server";
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

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("audits.simulator");
  return { title: t("metaTitle") };
}

interface PageProps {
  params: Promise<{ uuid: string }>;
}

export default async function SimulatorPage({ params }: PageProps) {
  await requireProfile();
  const { uuid } = await params;
  const supabase = await createClient();
  const t = await getTranslations("audits.simulator");

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

  // Gate "Simulateur de remédiation" : feature `remediation.simulator`
  // (incluse à partir du plan Starter). Si l'org est en Free, on affiche
  // un upsell complet à la place du composant - la navigation par tab
  // reste accessible pour montrer le contexte.
  const hasSimulator = await orgHasFeature("remediation.simulator");
  if (!hasSimulator) {
    const project = Array.isArray(audit.project) ? audit.project[0] : audit.project;
    const client = project?.client
      ? Array.isArray(project.client)
        ? project.client[0]
        : project.client
      : null;
    return (
      <div className="container mx-auto max-w-4xl space-y-6 p-6 md:p-8">
        <AuditTabsNav auditId={uuid} active="remediation" />
        <header className="space-y-1">
          <p className="text-xs text-muted-foreground">
            {client?.name ?? "—"} · {project?.name ?? "—"}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </header>
        <FeatureUpsell feature="remediation.simulator" />
      </div>
    );
  }

  const project = Array.isArray(audit.project) ? audit.project[0] : audit.project;
  const client = project?.client
    ? Array.isArray(project.client)
      ? project.client[0]
      : project.client
    : null;

  const [
    { data: conformities },
    { data: ncs },
    { data: pageRows },
    { data: thematicRows },
  ] = await Promise.all([
    supabase
      .from("page_conformities")
      .select("status, criteria_id, page_id")
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

  // Score canonique = celui de la matrice (RPC audit_current_score) : on
  // compte des CELLULES (page × critère) de page_conformities, pas des
  // critères distincts. denominator = COMPLIANT + NON_COMPLIANT (les
  // NOT_APPLICABLE et cellules vierges sont exclues). Chaque cellule
  // NON_COMPLIANT correspond à une (ou plusieurs) non-conformité(s) : c'est
  // la maille sur laquelle le simulateur fait basculer le score.
  let compliantCount = 0;
  let nonCompliantCount = 0;
  const nonCompliantCells = new Set<string>();
  for (const c of conformities ?? []) {
    if (c.status === "COMPLIANT") {
      compliantCount += 1;
    } else if (c.status === "NON_COMPLIANT") {
      nonCompliantCount += 1;
      nonCompliantCells.add(`${c.page_id}::${c.criteria_id}`);
    }
  }

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
        : { id: n.criteria_id as string, identifier: "?", name: "?" },
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
    (tm) => ({
      id: tm.id as string,
      identifier: tm.identifier as string,
      name: tm.name as string,
      sortOrder: tm.sort_order as number,
    }),
  );

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      <AuditTabsNav auditId={uuid} active="remediation" />

      <header className="space-y-1">
        <p className="text-xs text-muted-foreground">
          {client?.name ?? "—"} · {project?.name ?? "—"}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <RemediationSimulator
        allNCs={allNCs}
        auditPages={auditPages}
        referenceThematics={referenceThematics}
        compliantCount={compliantCount}
        nonCompliantCount={nonCompliantCount}
        nonCompliantCells={[...nonCompliantCells]}
      />
    </div>
  );
}
