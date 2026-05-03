import { notFound, redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ConformityMatrixLayout } from "./conformity-matrix-layout";
import type {
  AuditPage,
  ConformityStatus,
  Criterion,
  DisabilityType,
  PageType,
  Thematic,
} from "@/types/domain";

interface PageProps {
  params: Promise<{ uuid: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function MatrixPage({ params, searchParams }: PageProps) {
  const profile = await requireProfile();
  const { uuid } = await params;
  const sp = await searchParams;
  const supabase = await createClient();

  // 1) Audit + référentiel
  const { data: audit, error: auditError } = await supabase
    .from("audits")
    .select(
      `id, project_id, reference_id, language,
       project:projects(name, client:clients(name))`,
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

  // 2) Thématiques + critères du référentiel
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
    .select("id, thematic_id, identifier, name, url, disabilities, sort_order")
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
  }));

  // 3) Pages de l'audit
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
        <h1 className="text-xl font-semibold">Matrice de conformité</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Aucune page n&apos;a encore été configurée pour cet audit.
          Ajoutez d&apos;abord des pages dans l&apos;échantillon.
        </p>
      </div>
    );
  }

  // 4) Toutes les conformités saisies sur l'audit
  const { data: conformityRows } = await supabase
    .from("page_conformities")
    .select("id, audit_id, page_id, criteria_id, status")
    .eq("audit_id", uuid);

  const conformities = (conformityRows ?? []).map((row) => ({
    id: row.id as string,
    auditId: row.audit_id as string,
    pageId: row.page_id as string,
    criteriaId: row.criteria_id as string,
    status: row.status as ConformityStatus,
  }));

  // 5) Redirection si pas de page sélectionnée ou page inconnue
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
      auditTitle={project?.name ?? "Audit"}
      clientName={client?.name ?? null}
      canEdit={profile.role === "auditor"}
      thematics={thematics}
      criteria={criteria}
      pages={pages}
      initialConformities={conformities}
      currentPageId={validPage}
    />
  );
}
