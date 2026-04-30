import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ProjectsPage() {
  await requireProfile();
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, url, client:clients(name)")
    .order("name");

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Projets</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vos projets</CardTitle>
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
            <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              Aucun projet pour l&apos;instant.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
