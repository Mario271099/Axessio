import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuditStatusBadge } from "@/components/audit/audit-status-badge";
import { formatDate, formatScore } from "@/lib/utils";
import { PLATFORM_LABELS, REFERENCE_TYPE_LABELS } from "@/lib/constants";
import type { Metadata } from "next";
import type { AuditStatus, PlatformType, ReferenceType } from "@/types/domain";

export const metadata: Metadata = { title: "Audits" };

export default async function AuditsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data } = await supabase
    .from("audits")
    .select(
      `
      id, status, platform, initial_score, final_score, updated_at,
      reference:references(type, version),
      project:projects(name, client:clients(name))
    `,
    )
    .order("updated_at", { ascending: false });

  const audits = data ?? [];
  const isAuditor = profile.role === "auditor";

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Audits</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {audits.length} audit{audits.length > 1 ? "s" : ""} accessible{audits.length > 1 ? "s" : ""}.
          </p>
        </div>

        {isAuditor && (
          <Button asChild>
            <Link href="/audits/new">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nouvel audit
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tous les audits</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {audits.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Aucun audit pour l&apos;instant.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <caption className="sr-only">Liste des audits</caption>
                <thead className="border-b border-border bg-muted/40">
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th scope="col" className="px-4 py-2 font-medium">Projet</th>
                    <th scope="col" className="px-4 py-2 font-medium">Client</th>
                    <th scope="col" className="px-4 py-2 font-medium">Référentiel</th>
                    <th scope="col" className="px-4 py-2 font-medium">Plateforme</th>
                    <th scope="col" className="px-4 py-2 font-medium">Statut</th>
                    <th scope="col" className="px-4 py-2 font-medium tabular-nums">Score</th>
                    <th scope="col" className="px-4 py-2 font-medium">Mis à jour</th>
                    <th scope="col" className="px-4 py-2"><span className="sr-only">Action</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {audits.map((a) => {
                    const project = Array.isArray(a.project) ? a.project[0] : a.project;
                    const client = project?.client
                      ? Array.isArray(project.client)
                        ? project.client[0]
                        : project.client
                      : null;
                    const ref = Array.isArray(a.reference) ? a.reference[0] : a.reference;
                    const score = a.final_score ?? a.initial_score;

                    return (
                      <tr key={a.id} className="text-sm hover:bg-accent/30">
                        <td className="px-4 py-3">
                          <Link
                            href={`/audits/${a.id}`}
                            className="font-medium hover:underline focus-visible:outline-none focus-visible:underline"
                          >
                            {project?.name ?? "—"}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {client?.name ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          {ref ? (
                            <span>
                              {REFERENCE_TYPE_LABELS[ref.type as ReferenceType]}{" "}
                              <span className="text-muted-foreground">{ref.version}</span>
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {PLATFORM_LABELS[a.platform as PlatformType]}
                        </td>
                        <td className="px-4 py-3">
                          <AuditStatusBadge status={a.status as AuditStatus} />
                        </td>
                        <td className="px-4 py-3 tabular-nums">{formatScore(score)}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(a.updated_at)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/audits/${a.id}`}
                            aria-label={`Voir l'audit du projet ${project?.name ?? ""}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                          >
                            <ChevronRight className="h-4 w-4" aria-hidden="true" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
