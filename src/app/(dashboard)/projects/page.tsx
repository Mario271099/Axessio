import { FolderKanban } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { monogram, themeColorVar } from "@/lib/utils";

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
    <div className="container mx-auto max-w-7xl space-y-5 p-4 md:p-6 lg:px-9">
      <h1 className="text-2xl font-black tracking-[-0.03em] md:text-[2rem]">
        {t("title")}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-extrabold">
            {t("yours")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5">
          {(projects ?? []).map((p) => {
            const client = Array.isArray(p.client) ? p.client[0] : p.client;
            return (
              <div
                key={p.id}
                className="axs-row flex items-center gap-3.5 rounded-row px-3 py-2.5"
              >
                {/* Monogramme coloré par le client, comme la liste clients. */}
                <span
                  aria-hidden="true"
                  className="axs-mono flex size-10 shrink-0 items-center justify-center rounded-row text-sm font-extrabold text-white"
                  style={{ background: themeColorVar(client?.name ?? p.name) }}
                >
                  {monogram(p.name)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-bold">{p.name}</span>
                  <span className="block truncate text-[0.85rem] text-muted-foreground">
                    {client?.name ?? "—"}
                    {p.url && <> · {p.url}</>}
                  </span>
                </span>
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
