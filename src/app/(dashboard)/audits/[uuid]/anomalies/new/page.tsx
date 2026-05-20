import { notFound, redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { canCreateNCNow } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { NewNCForm, type NCThematic, type NCCriterion, type NCPage } from "./new-nc-form";
import type { AuditWorkflowStatus } from "@/types/domain";

interface PageProps {
  params: Promise<{ uuid: string }>;
}

export default async function NewNCPage({ params }: PageProps) {
  const profile = await requireProfile();
  const { uuid } = await params;

  const supabase = await createClient();

  const { data: audit, error: auditError } = await supabase
    .from("audits")
    .select("id, reference_id, workflow_status")
    .eq("id", uuid)
    .maybeSingle();

  if (auditError || !audit) {
    notFound();
  }

  if (
    !canCreateNCNow(
      profile.role,
      (audit.workflow_status ?? "draft") as AuditWorkflowStatus,
    )
  ) {
    redirect(`/audits/${uuid}/anomalies`);
  }

  const [{ data: pageRows }, { data: thematicRows }] = await Promise.all([
    supabase
      .from("pages")
      .select("id, name, sort_order")
      .eq("audit_id", uuid)
      .order("sort_order", { ascending: true }),
    supabase
      .from("thematics")
      .select("id, identifier, name, sort_order")
      .eq("reference_id", audit.reference_id)
      .order("sort_order", { ascending: true }),
  ]);

  const pages: NCPage[] = (pageRows ?? []).map((p) => ({
    id: p.id as string,
    name: p.name as string,
  }));

  const thematics: NCThematic[] = (thematicRows ?? []).map((t) => ({
    id: t.id as string,
    identifier: t.identifier as string,
    name: t.name as string,
  }));

  const { data: criteriaRows } = thematics.length
    ? await supabase
        .from("criteria")
        .select("id, thematic_id, identifier, name, sort_order, methodology")
        .in(
          "thematic_id",
          thematics.map((t) => t.id),
        )
        .order("sort_order", { ascending: true })
    : { data: [] as Array<Record<string, unknown>> };

  const criteria: NCCriterion[] = (criteriaRows ?? []).map((c) => ({
    id: c.id as string,
    thematicId: c.thematic_id as string,
    identifier: c.identifier as string,
    name: c.name as string,
    methodology: (c.methodology as string | null) ?? null,
  }));

  return (
    <NewNCForm
      auditId={uuid}
      pages={pages}
      thematics={thematics}
      criteria={criteria}
    />
  );
}
