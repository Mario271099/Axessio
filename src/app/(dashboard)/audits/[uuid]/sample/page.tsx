import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  COMPLEXITY_LABELS,
  PAGE_TYPE_LABELS,
} from "@/lib/constants";
import type { ComplexityLevel, PageType } from "@/types/domain";

export default async function SamplePage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  await requireProfile();
  const { uuid } = await params;
  const supabase = await createClient();

  const { data: pages } = await supabase
    .from("pages")
    .select("id, name, url, page_type, complexity, sort_order")
    .eq("audit_id", uuid)
    .order("sort_order");

  const list = pages ?? [];

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      <Button asChild variant="ghost" size="sm" className="gap-1 -ml-3">
        <Link href={`/audits/${uuid}`}>
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Retour à l&apos;audit
        </Link>
      </Button>

      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Échantillon</h1>
        <p className="text-sm text-muted-foreground">
          {list.length} page{list.length > 1 ? "s" : ""} testée
          {list.length > 1 ? "s" : ""}.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {list.length === 0 && (
            <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              Aucune page configurée pour cet audit.
            </p>
          )}
          {list.map((p) => (
            <div
              key={p.id}
              className="flex items-start justify-between gap-4 rounded-md border border-border p-3"
            >
              <div className="min-w-0">
                <p className="font-medium">{p.name}</p>
                {p.url && (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-xs text-primary hover:underline"
                  >
                    {p.url}
                  </a>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <Badge variant="outline">
                  {PAGE_TYPE_LABELS[p.page_type as PageType]}
                </Badge>
                {p.complexity && (
                  <Badge variant="muted">
                    {COMPLEXITY_LABELS[p.complexity as ComplexityLevel]}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
