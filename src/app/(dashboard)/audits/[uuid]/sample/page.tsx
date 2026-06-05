import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { canAny } from "@/lib/permissions";
import { loadMyOrgPermissions } from "@/lib/server-permissions";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuditTabsNav } from "@/components/audit/audit-tabs-nav";
import { InfoTip } from "@/components/ui/info-tip";
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

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      <AuditTabsNav auditId={uuid} active="sample" />

      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <InfoTip label={t("pageTypesHelpAria")}>
            <div className="space-y-1.5">
              <p className="font-semibold">{t("pageTypesHelp.title")}</p>
              <p>
                <strong>{t("pageTypesHelp.mandatory.label")}</strong>{" "}
                {t("pageTypesHelp.mandatory.text")}
              </p>
              <p>
                <strong>{t("pageTypesHelp.representative.label")}</strong>{" "}
                {t("pageTypesHelp.representative.text")}
              </p>
              <p>
                <strong>{t("pageTypesHelp.transversal.label")}</strong>{" "}
                {t("pageTypesHelp.transversal.text")}
              </p>
            </div>
          </InfoTip>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("subtitle", { count: list.length })}
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("cardTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <SampleActionsBar auditId={uuid} pages={list} canEdit={canEdit} />
        </CardContent>
      </Card>
    </div>
  );
}
