import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { orgHasFeature } from "@/lib/billing/server";
import { AuditTabsNav } from "@/components/audit/audit-tabs-nav";
import { AnomaliesList, type AnomalyListItem } from "./anomalies-list";
import { ExportNcButton } from "./export-nc-button";

export default async function AnomaliesPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const profile = await requireProfile();
  const { uuid } = await params;
  const supabase = await createClient();

  // NC + comptages messages/attachements en une seule requête grâce à
  // l'agrégation PostgREST (count sur une jointure renvoyée comme tableau).
  const { data } = await supabase
    .from("non_conformities")
    .select(
      `id, title, status, severity, created_at, display_number,
       criterion:criteria!inner(identifier, name),
       page:pages(name),
       messages:nc_messages(id),
       attachments:nc_attachments(id)`,
    )
    .eq("audit_id", uuid)
    .order("display_number", { ascending: true });

  const ncs: AnomalyListItem[] = (data ?? []).map((nc) => {
    const criterion = Array.isArray(nc.criterion)
      ? nc.criterion[0]
      : nc.criterion;
    const page = Array.isArray(nc.page) ? nc.page[0] : nc.page;
    const messages = Array.isArray(nc.messages) ? nc.messages : [];
    const attachments = Array.isArray(nc.attachments) ? nc.attachments : [];
    return {
      id: nc.id as string,
      title: nc.title as string,
      status: nc.status as string,
      severity: nc.severity as AnomalyListItem["severity"],
      createdAt: nc.created_at as string,
      criterion: criterion
        ? {
            identifier: criterion.identifier as string,
            name: criterion.name as string,
          }
        : null,
      page: page ? { name: page.name as string } : null,
      messageCount: messages.length,
      attachmentCount: attachments.length,
      displayNumber: Number(nc.display_number ?? 0),
    };
  });

  // Bouton export CSV gated par la feature `export.pdf` (capacité d'export) ;
  // masqué s'il n'y a pas de NC. L'action re-vérifie l'autorisation + la feature.
  const canExportCsv = ncs.length > 0 && (await orgHasFeature("export.pdf"));

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      <AuditTabsNav auditId={uuid} active="anomalies" />
      {canExportCsv && (
        <div className="flex justify-end">
          <ExportNcButton auditId={uuid} />
        </div>
      )}
      <AnomaliesList ncs={ncs} auditId={uuid} role={profile.role} />
    </div>
  );
}
