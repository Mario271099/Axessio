import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { canAny } from "@/lib/permissions";
import { loadMyOrgPermissions } from "@/lib/server-permissions";
import { createClient } from "@/lib/supabase/server";
import { AuditPageHeader } from "@/components/audit/audit-page-header";
import { AuditStatusBadge } from "@/components/audit/audit-status-badge";
import { loadAuditHeader } from "../audit-header-data";
import { SampleActionsBar } from "./sample-actions-bar";
import type { ComplexityLevel, PageType } from "@/types/domain";

export default async function SamplePage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const profile = await requireProfile();
  const { uuid } = await params;
  const supabase = await createClient();
  const t = await getTranslations("audits.sample");

  const { data: pages } = await supabase
    .from("pages")
    .select("id, name, url, page_type, complexity, sort_order")
    .eq("audit_id", uuid)
    .order("sort_order");

  const list = (pages ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    url: p.url,
    page_type: p.page_type as PageType,
    complexity: p.complexity as ComplexityLevel | null,
  }));

  const orgPerms = await loadMyOrgPermissions();
  const canEdit = canAny(profile.role, orgPerms, "audit.edit");
  const header = await loadAuditHeader(uuid);

  return (
    <>
      {header && (
        <AuditPageHeader
          auditId={uuid}
          active="sample"
          data={header}
          titleAs="p"
          status={<AuditStatusBadge status={header.status} />}
        />
      )}

      <div className="container mx-auto max-w-7xl space-y-4 p-4 md:p-6 lg:px-9">
        <header>
          <h1 className="text-[1.75rem] font-black leading-tight tracking-tight">
            {t("title")}
          </h1>
          <p className="mt-1 text-base text-muted-foreground">
            {t("subtitle", { count: list.length })}
          </p>
        </header>

        <SampleActionsBar auditId={uuid} pages={list} canEdit={canEdit} />
      </div>
    </>
  );
}
