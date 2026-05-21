import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AuditTabsNav } from "@/components/audit/audit-tabs-nav";
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

  const project = Array.isArray(audit.project) ? audit.project[0] : audit.project;
  const client = project?.client
    ? Array.isArray(project.client)
      ? project.client[0]
      : project.client
    : null;

  const { count: totalCriteria } = await supabase
    .from("criteria")
    .select("id, thematic:thematics!inner(reference_id)", {
      count: "exact",
      head: true,
    })
    .eq("thematic.reference_id", audit.reference_id);

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

  const distinctCompliant = new Set<string>();
  const distinctNotApplicable = new Set<string>();
  for (const c of conformities ?? []) {
    if (c.status === "COMPLIANT") distinctCompliant.add(c.criteria_id);
    if (c.status === "NOT_APPLICABLE") distinctNotApplicable.add(c.criteria_id);
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

  const fixableCriteriaPerNC: Record<string, string> = {};
  for (const nc of allNCs) fixableCriteriaPerNC[nc.id] = nc.criterion.id;

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
        totalCriteria={totalCriteria ?? 0}
        initialCompliant={distinctCompliant.size}
        notApplicable={distinctNotApplicable.size}
        fixableCriteriaPerNC={fixableCriteriaPerNC}
      />
    </div>
  );
}
