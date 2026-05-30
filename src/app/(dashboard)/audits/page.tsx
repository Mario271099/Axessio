import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronRight,
  ClipboardCheck,
  Plus,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { AuditStatusBadge } from "@/components/audit/audit-status-badge";
import { cn, formatDate, formatScore } from "@/lib/utils";
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

type SortColumn = "updated_at" | "status" | "final_score";
const ALLOWED_SORT_COLUMNS: ReadonlySet<SortColumn> = new Set([
  "updated_at",
  "status",
  "final_score",
]);

interface PageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    platform?: string;
    mine?: string;
    sort?: string;
    dir?: string;
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

  // « Mes audits » : ne s'applique qu'aux users qui peuvent éditer un audit
  // (staff). Pour les autres, ce filtre n'a pas de sens — leur scope d'accès
  // (RLS) est déjà étroit. On l'ignore silencieusement.
  const canEditAudits = canEditAudit(profile.role);
  const mineFilter = canEditAudits && sp.mine === "1";

  const sortColumn: SortColumn =
    sp.sort && ALLOWED_SORT_COLUMNS.has(sp.sort as SortColumn)
      ? (sp.sort as SortColumn)
      : "updated_at";
  const sortDir: "asc" | "desc" = sp.dir === "asc" ? "asc" : "desc";

  const rawPage = Number.parseInt(sp.page ?? "1", 10);
  const currentPage =
    Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;
  const offset = (currentPage - 1) * PAGE_SIZE;

  const canCreateAudit = canEditAudit(profile.role);

  // ---------------------------------------------------------------------
  // Pré-fetch des audits assignés au user courant pour le filtre « Mes audits ».
  // On le fait avant la requête principale parce que le filtre se traduit en
  // `.in("id", [...])`.
  // ---------------------------------------------------------------------
  let mineAuditIds: string[] | null = null;
  if (mineFilter) {
    const { data: assignments } = await supabase
      .from("audit_assignees")
      .select("audit_id")
      .eq("profile_id", profile.id);
    mineAuditIds = (assignments ?? []).map((r) => r.audit_id as string);
  }

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
      id, status, platform,
      initial_score, final_score, updated_at,
      reference:references(type, version),
      project:projects!inner(name, client:clients(name))
    `,
      { count: "exact" },
    )
    .order(sortColumn, { ascending: sortDir === "asc", nullsFirst: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (statusFilter) request = request.eq("status", statusFilter);
  if (platformFilter) request = request.eq("platform", platformFilter);
  if (mineFilter) {
    // Si aucune assignation, la liste sera vide — comportement attendu.
    request = request.in("id", mineAuditIds ?? []);
  }
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
  if (mineFilter) baseParams.set("mine", "1");
  if (sortColumn !== "updated_at") baseParams.set("sort", sortColumn);
  if (sortDir !== "desc") baseParams.set("dir", sortDir);

  // Helper pour les liens d'en-tête sortable. Toggle la direction si on
  // re-clique sur la même colonne, sinon défaut desc.
  function buildSortHref(col: SortColumn): string {
    const params = new URLSearchParams(baseParams);
    const isActive = col === sortColumn;
    const nextDir: "asc" | "desc" = isActive
      ? sortDir === "asc"
        ? "desc"
        : "asc"
      : "desc";
    if (col === "updated_at") params.delete("sort");
    else params.set("sort", col);
    if (nextDir === "desc") params.delete("dir");
    else params.set("dir", "asc");
    params.delete("page");
    const qs = params.toString();
    return qs ? `/audits?${qs}` : "/audits";
  }

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
        initialMine={mineFilter}
        canSeeMine={canEditAudits}
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
            <div className="p-6">
              <EmptyState
                icon={ClipboardCheck}
                title={
                  total === 0 && !query && !statusFilter && !platformFilter
                    ? t("empty")
                    : t("noResults")
                }
                className="border-0"
              >
                {canCreateAudit &&
                  total === 0 &&
                  !query &&
                  !statusFilter &&
                  !platformFilter && (
                    <Button asChild size="sm">
                      <Link href="/audits/new">
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        {t("newAudit")}
                      </Link>
                    </Button>
                  )}
              </EmptyState>
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
                      <SortHeader
                        href={buildSortHref("status")}
                        label={t("columns.status")}
                        active={sortColumn === "status"}
                        dir={sortDir}
                        sortLabel={t("sortBy", { column: t("columns.status") })}
                      />
                    </th>
                    <th scope="col" className="px-4 py-2 font-medium tabular-nums">
                      <SortHeader
                        href={buildSortHref("final_score")}
                        label={t("columns.score")}
                        active={sortColumn === "final_score"}
                        dir={sortDir}
                        sortLabel={t("sortBy", { column: t("columns.score") })}
                      />
                    </th>
                    <th scope="col" className="px-4 py-2 font-medium">
                      <SortHeader
                        href={buildSortHref("updated_at")}
                        label={t("columns.updated")}
                        active={sortColumn === "updated_at"}
                        dir={sortDir}
                        sortLabel={t("sortBy", { column: t("columns.updated") })}
                      />
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

// ---------------------------------------------------------------------------
// SortHeader — un <th> cliquable qui toggle la direction de tri. Rendu côté
// serveur (pas de JS).
// ---------------------------------------------------------------------------
function SortHeader({
  href,
  label,
  active,
  dir,
  sortLabel,
}: {
  href: string;
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  sortLabel: string;
}) {
  const Arrow = active ? (dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <Link
      href={href}
      aria-label={sortLabel}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        active ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {label}
      <Arrow
        className={cn("h-3 w-3", active ? "opacity-100" : "opacity-40")}
        aria-hidden="true"
      />
    </Link>
  );
}
