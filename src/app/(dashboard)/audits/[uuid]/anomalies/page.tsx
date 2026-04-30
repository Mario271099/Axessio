import Link from "next/link";
import { ChevronLeft, FileText, Layers } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SeverityBadge } from "@/components/audit/severity-badge";
import { Badge } from "@/components/ui/badge";
import { NC_STATUS_LABELS } from "@/lib/constants";
import type { NCSeverity, NCStatus } from "@/types/domain";

export default async function AnomaliesPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  await requireProfile();
  const { uuid } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("non_conformities")
    .select(
      `
      id, identifier, title, description, severity, status,
      criterion:criteria!inner(identifier, name),
      page:pages(name)
    `,
    )
    .eq("audit_id", uuid)
    .order("severity")
    .order("created_at");

  const ncs = data ?? [];

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      <Button asChild variant="ghost" size="sm" className="gap-1 -ml-3">
        <Link href={`/audits/${uuid}`}>
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Retour à l&apos;audit
        </Link>
      </Button>

      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Non-conformités</h1>
        <p className="text-sm text-muted-foreground">
          {ncs.length} non-conformité{ncs.length > 1 ? "s" : ""} référencée
          {ncs.length > 1 ? "s" : ""}.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Détail</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {ncs.length === 0 ? (
            <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              Aucune non-conformité enregistrée.
            </p>
          ) : (
            ncs.map((nc) => {
              const criterion = Array.isArray(nc.criterion)
                ? nc.criterion[0]
                : nc.criterion;
              const page = Array.isArray(nc.page) ? nc.page[0] : nc.page;
              return (
                <article
                  key={nc.id}
                  className="rounded-md border border-border p-4 transition-colors hover:bg-accent/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        {criterion && (
                          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                            {criterion.identifier}
                          </span>
                        )}
                        <SeverityBadge severity={nc.severity as NCSeverity} />
                        <Badge variant="outline" className="text-xs">
                          {NC_STATUS_LABELS[nc.status as NCStatus]}
                        </Badge>
                        {nc.identifier && (
                          <span className="text-xs text-muted-foreground">
                            #{nc.identifier}
                          </span>
                        )}
                      </div>
                      <h2 className="font-medium">{nc.title}</h2>
                      {nc.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {nc.description}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
                      {page ? (
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" aria-hidden="true" />
                          {page.name}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Layers className="h-3 w-3" aria-hidden="true" />
                          Transversale
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
