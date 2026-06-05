import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { canAny } from "@/lib/permissions";
import { loadMyOrgPermissions } from "@/lib/server-permissions";
import { createClient } from "@/lib/supabase/server";
import { REFERENCE_TYPE_LABELS } from "@/lib/constants";
import { ConformityMatrixLayout } from "./conformity-matrix-layout";
import type {
  AuditPage,
  ConformityStatus,
  Criterion,
  DisabilityType,
  PageType,
  ReferenceType,
  Thematic,
} from "@/types/domain";

interface PageProps {
  params: Promise<{ uuid: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function MatrixPage({ params, searchParams }: PageProps) {
  const profile = await requireProfile();
  const orgPerms = await loadMyOrgPermissions();
  const { uuid } = await params;
  const sp = await searchParams;
  const supabase = await createClient();
  const t = await getTranslations("audits.matrix");
  const tDetail = await getTranslations("audits.detail");

  const { data: audit, error: auditError } = await supabase
    .from("audits")
    .select(
      `id, project_id, reference_id, language,
       project:projects(name, client:clients(name)),
       reference:references(type, version)`,
    )
    .eq("id", uuid)
    .single();

  if (auditError || !audit) notFound();

  const project = Array.isArray(audit.project)
    ? audit.project[0]
    : audit.project;
  const client = project?.client
    ? Array.isArray(project.client)
      ? project.client[0]
      : project.client
    : null;
  const reference = Array.isArray(audit.reference)
    ? audit.reference[0]
    : audit.reference;
  const referenceName = reference
    ? `${REFERENCE_TYPE_LABELS[reference.type as ReferenceType]} ${reference.version}`.trim()
    : tDetail("unknownReference");

  const { data: thematicRows } = await supabase
    .from("thematics")
    .select("id, reference_id, identifier, name, sort_order")
    .eq("reference_id", audit.reference_id)
    .order("sort_order");

  const thematics: Thematic[] = (thematicRows ?? []).map((t) => ({
    id: t.id,
    referenceId: t.reference_id,
    identifier: t.identifier,
    name: t.name,
    sortOrder: t.sort_order,
  }));

  const { data: criteriaRows } = await supabase
    .from("criteria")
    .select(
      "id, thematic_id, identifier, name, url, disabilities, sort_order, name_en, level, principle, guideline, methodology",
    )
    .in(
      "thematic_id",
      thematics.map((t) => t.id),
    )
    .order("sort_order");

  const criteria: Criterion[] = (criteriaRows ?? []).map((c) => ({
    id: c.id,
    thematicId: c.thematic_id,
    identifier: c.identifier,
    name: c.name,
    url: c.url,
    disabilities: (c.disabilities ?? []) as DisabilityType[],
    nameEn: c.name_en ?? null,
    level: (c.level ?? null) as Criterion["level"],
    principle: c.principle ?? null,
    guideline: c.guideline ?? null,
    methodology: (c.methodology as string | null) ?? null,
  }));

  const { data: pageRows } = await supabase
    .from("pages")
    .select("id, audit_id, name, url, page_type, complexity, sort_order")
    .eq("audit_id", uuid)
    .order("sort_order");

  const pages: AuditPage[] = (pageRows ?? []).map((p) => ({
    id: p.id,
    auditId: p.audit_id,
    name: p.name,
    url: p.url,
    pageType: p.page_type as PageType,
    complexity: p.complexity,
    sortOrder: p.sort_order,
  }));

  if (pages.length === 0) {
    return (
      <div className="container mx-auto max-w-3xl p-6 md:p-8">
        <h1 className="text-xl font-semibold">{t("noPagesTitle")}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{t("noPagesDesc")}</p>
      </div>
    );
  }

  // On ne sélectionne que les colonnes réellement lues côté client (la map
  // est keyée par pageId:criteriaId, le status est la valeur). `id`/`audit_id`
  // ne sont jamais lus — les omettre allège le payload RSC d'environ 40 %.
  const { data: conformityRows } = await supabase
    .from("page_conformities")
    .select("page_id, criteria_id, status")
    .eq("audit_id", uuid);

  const conformities = (conformityRows ?? []).map((row) => ({
    pageId: row.page_id as string,
    criteriaId: row.criteria_id as string,
    status: row.status as ConformityStatus,
  }));

  const requested = sp.page;
  const validPage =
    requested && pages.find((p) => p.id === requested) ? requested : null;
  if (!validPage) {
    const firstPage = pages[0];
    if (!firstPage) notFound();
    redirect(`/audits/${uuid}/matrix?page=${firstPage.id}`);
  }

  return (
    <ConformityMatrixLayout
      auditId={uuid}
      clientName={client?.name ?? null}
      referenceName={referenceName}
      canEdit={canAny(profile.role, orgPerms, "matrix.edit")}
      thematics={thematics}
      criteria={criteria}
      pages={pages}
      initialConformities={conformities}
      currentPageId={validPage}
    />
  );
}
