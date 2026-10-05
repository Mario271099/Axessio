import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { checkAuditExportAccess } from "@/lib/audit-export-access";
import { loadMyOrgPermissions } from "@/lib/server-permissions";
import { AuditPageHeader } from "@/components/audit/audit-page-header";
import { AuditStatusBadge } from "@/components/audit/audit-status-badge";
import { loadAuditHeader } from "../audit-header-data";
import { AnomaliesList, type AnomalyListItem } from "./anomalies-list";
import { ExportNcButton } from "./export-nc-button";

export default async function AnomaliesPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const profile = await requireProfile();
  const orgPerms = await loadMyOrgPermissions();
  const { uuid } = await params;
  const supabase = await createClient();

  // NC + comptages messages/attachements en une seule requête grâce à
  // l'agrégation PostgREST (count sur une jointure renvoyée comme tableau).
  const { data } = await supabase
    .from("non_conformities")
    .select(
      `id, title, status, severity, created_at, display_number, review_status,
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
      reviewStatus:
        (nc.review_status as AnomalyListItem["reviewStatus"]) ??
        "not_requested",
    };
  });

  // Bouton export CSV : même garde que l'action (staff, client_admin, contact
  // de l'audit + feature `export.pdf` du visiteur OU de l'org de l'audit) ;
  // masqué s'il n'y a pas de NC. L'action re-vérifie côté serveur.
  let canExportCsv = false;
  if (ncs.length > 0) {
    const { data: auditRow } = await supabase
      .from("audits")
      .select("organization_id, project:projects(client_id)")
      .eq("id", uuid)
      .maybeSingle();
    const project = Array.isArray(auditRow?.project)
      ? auditRow.project[0]
      : auditRow?.project;
    canExportCsv =
      auditRow !== null &&
      (await checkAuditExportAccess(supabase, {
        auditId: uuid,
        auditOrganizationId: auditRow.organization_id as string | null,
        clientId: (project?.client_id as string | undefined) ?? null,
        profile: {
          role: profile.role,
          client_id: profile.clientId ?? null,
          is_platform_admin: profile.isPlatformAdmin,
        },
      })) === "ok";
  }
  const header = await loadAuditHeader(uuid);

  return (
    <>
      {header && (
        <AuditPageHeader
          auditId={uuid}
          active="anomalies"
          data={header}
          titleAs="p"
          status={<AuditStatusBadge status={header.status} />}
          actions={canExportCsv ? <ExportNcButton auditId={uuid} /> : undefined}
        />
      )}

      <div className="container mx-auto max-w-7xl space-y-6 p-6 md:p-8">
        <AnomaliesList
          ncs={ncs}
          auditId={uuid}
          role={profile.role}
          orgPermissions={Array.from(orgPerms)}
        />
      </div>
    </>
  );
}
