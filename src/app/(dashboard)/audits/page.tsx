import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuditStatusBadge } from "@/components/audit/audit-status-badge";
import { formatDate, formatScore } from "@/lib/utils";
import { REFERENCE_TYPE_LABELS } from "@/lib/constants";
import { canEditAudit } from "@/lib/permissions";
import type { Metadata } from "next";
import type { AuditStatus, PlatformType, ReferenceType } from "@/types/domain";
import { AuditsFilters } from "./audits-filters";
import { AuditsPagination } from "./audits-pagination";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("audits.list");
  return { title: t("title") };
}

// Pagination — 50 lignes par page. À 150k audits ça fait 3000 pages, ce qui
// n'est pas un usage attendu : la combinaison filtre + recherche doit
// permettre de descendre à des sous-ensembles raisonnables avant de paginer.
const PAGE_SIZE = 50;

const ALLOWED_STATUSES: ReadonlySet<AuditStatus> = new Set([
  "PENDING",
  "PLANNED",
  "IN_PROGRESS",
  "DELIVERED",
  "REMEDIATION",
  "COUNTER_AUDIT",
  "ONLINE",
  "COMPLETED",
  "ARCHIVED",
]);

const ALLOWED_PLATFORMS: ReadonlySet<PlatformType> = new Set(["WEB", "MOBILE"]);

interface PageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    platform?: string;
    page?: string;
  }>;
}

export default async function AuditsPage({ searchParams }: PageProps) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const t = await getTranslations("audits.list");
  const tPlatform = await getTranslations("constants.platform");

  const sp = await searchParams;

  // ---------------------------------------------------------------------
  // Parsing + sanitization des paramètres d'URL (jamais de confiance brute).
  // ---------------------------------------------------------------------
  const rawQuery = (sp.q ?? "").trim();
  // Limite la longueur pour éviter une recherche pathologique sur 4 KB.
  const query = rawQuery.slice(0, 80);

  const statusFilter =
    sp.status && ALLOWED_STATUSES.has(sp.status as AuditStatus)
      ? (sp.status as AuditStatus)
      : null;
  const platformFilter =
    sp.platform && ALLOWED_PLATFORMS.has(sp.platform as PlatformType)
      ? (sp.platform as PlatformType)
      : null;

  const rawPage = Number.parseInt(sp.page ?? "1", 10);
  const currentPage =
    Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;
  const offset = (currentPage - 1) * PAGE_SIZE;

  const canCreateAudit = canEditAudit(profile.role);

  // ---------------------------------------------------------------------
  // Requête paginée — un seul aller-retour qui renvoie aussi le `count`
  // exact (utilisé par la pagination). Tout le filtrage est fait en SQL.
  // `projects!inner` rend la jointure obligatoire et permet de filtrer
  // par nom de projet.
  // ---------------------------------------------------------------------
  let request = supabase
    .from("audits")
    .select(
      `
      id, status, platform, initial_score, final_score, updated_at,
      reference:references(type, version),
      project:projects!inner(name, client:clients(name))
    `,
      { count: "exact" },
    )
    .order("updated_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (statusFilter) request = request.eq("status", statusFilter);
  if (platformFilter) request = request.eq("platform", platformFilter);
  if (query) {
    // Recherche par nom de projet via index gin_trgm (migration 20).
    // On échappe `\`, `%` et `_` car ce sont les méta-caractères de ILIKE :
    // sans ça, une recherche "Foo%Bar" matcherait tout ce qui commence par "Foo"
    // et "_oo" matcherait n'importe quel mot de 3 lettres finissant par "oo".
    const escaped = query.replace(/[\\%_]/g, (c) => `\\${c}`);
    request = request.ilike("projects.name", `%${escaped}%`);
  }

  const { data, error, count } = await request;

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const audits = data ?? [];
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + audits.length, total);

  // ---------------------------------------------------------------------
  // baseParams : on rejoue tous les params SAUF `page` dans les liens de
  // pagination, pour préserver les filtres entre les pages.
  // ---------------------------------------------------------------------
  const baseParams = new URLSearchParams();
  if (query) baseParams.set("q", query);
  if (statusFilter) baseParams.set("status", statusFilter);
  if (platformFilter) baseParams.set("platform", platformFilter);

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("subtitle", { count: total })}
          </p>
        </div>

        {canCreateAudit && (
          <Button asChild>
            <Link href="/audits/new">
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t("newAudit")}
            </Link>
          </Button>
        )}
      </div>

      <AuditsFilters
        initialQuery={query}
        initialStatus={statusFilter ?? ""}
        initialPlatform={platformFilter ?? ""}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("cardTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <div
              role="alert"
              className="m-4 rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive"
            >
              {error.message}
            </div>
          ) : audits.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {total === 0 && !query && !statusFilter && !platformFilter
                ? t("empty")
                : t("noResults")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <caption className="sr-only">{t("caption")}</caption>
                <thead className="border-b border-border bg-muted/40">
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th scope="col" className="px-4 py-2 font-medium">
                      {t("columns.project")}
                    </th>
                    <th scope="col" className="px-4 py-2 font-medium">
                      {t("columns.client")}
                    </th>
                    <th scope="col" className="px-4 py-2 font-medium">
                      {t("columns.reference")}
                    </th>
                    <th scope="col" className="px-4 py-2 font-medium">
                      {t("columns.platform")}
                    </th>
                    <th scope="col" className="px-4 py-2 font-medium">
                      {t("columns.status")}
                    </th>
                    <th scope="col" className="px-4 py-2 font-medium tabular-nums">
                      {t("columns.score")}
                    </th>
                    <th scope="col" className="px-4 py-2 font-medium">
                      {t("columns.updated")}
                    </th>
                    <th scope="col" className="px-4 py-2">
                      <span className="sr-only">{t("columns.action")}</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {audits.map((a) => {
                    const project = Array.isArray(a.project)
                      ? a.project[0]
                      : a.project;
                    const client = project?.client
                      ? Array.isArray(project.client)
                        ? project.client[0]
                        : project.client
                      : null;
                    const ref = Array.isArray(a.reference)
                      ? a.reference[0]
                      : a.reference;
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
                              <span className="text-muted-foreground">
                                {ref.version}
                              </span>
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {tPlatform(a.platform as PlatformType)}
                        </td>
                        <td className="px-4 py-3">
                          <AuditStatusBadge status={a.status as AuditStatus} />
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {formatScore(score)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(a.updated_at)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/audits/${a.id}`}
                            aria-label={t("viewAudit", {
                              name: project?.name ?? "",
                            })}
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

          {total > 0 && (
            <AuditsPagination
              currentPage={currentPage}
              totalPages={totalPages}
              total={total}
              from={from}
              to={to}
              baseParams={baseParams}
              pathname="/audits"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
