import { FolderKanban } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export default async function ProjectsPage() {
  await requireProfile();
  const supabase = await createClient();
  const t = await getTranslations("projects");

  // Scope strict à l'org active : la RLS legacy ouvre tout aux auditeurs,
  // on filtre côté query pour ne montrer que les projets de l'org courante.
  const { data: currentOrgIdRaw } = await supabase.rpc("current_org");
  const currentOrgId = currentOrgIdRaw as string | null;

  const projectsQuery = supabase
    .from("projects")
    .select("id, name, url, client:clients(name)")
    .order("name");
  if (currentOrgId) {
    projectsQuery.eq("organization_id", currentOrgId);
  }
  const { data: projects } = await projectsQuery;

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("yours")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(projects ?? []).map((p) => {
            const client = Array.isArray(p.client) ? p.client[0] : p.client;
            return (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-md border border-border p-3"
              >
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {client?.name ?? "—"}
                    {p.url && <> · {p.url}</>}
                  </p>
                </div>
              </div>
            );
          })}
          {(projects ?? []).length === 0 && (
            <EmptyState icon={FolderKanban} title={t("empty")} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
