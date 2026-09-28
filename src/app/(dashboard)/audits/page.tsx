import Link from "next/link";
import { ClipboardCheck, Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { canAny } from "@/lib/permissions";
import { loadMyOrgPermissions } from "@/lib/server-permissions";
import type { Metadata } from "next";
import type {
  AuditStatus,
  PlatformType,
  ReferenceType,
} from "@/types/domain";
import { AuditsFilters } from "./audits-filters";
import { AuditsPagination } from "./audits-pagination";
import {
  AuditsTable,
  type AuditsView,
  type AuditTableRow,
  type SortColumn,
} from "./audits-table";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("audits.list");
  return { title: t("title") };
}

// Pagination - 50 lignes par page. À 150k audits ça fait 3000 pages, ce qui
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

const ALLOWED_VIEWS: ReadonlySet<AuditsView> = new Set(["list", "cards"]);

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
    view?: string;
  }>;
}

export default async function AuditsPage({ searchParams }: PageProps) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const t = await getTranslations("audits.list");
  const orgPerms = await loadMyOrgPermissions();

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
  // (staff). Pour les autres, ce filtre n'a pas de sens - leur scope d'accès
  // (RLS) est déjà étroit. On l'ignore silencieusement.
  const canEditAudits = canAny(profile.role, orgPerms, "audit.edit");
  const mineFilter = canEditAudits && sp.mine === "1";

  const view: AuditsView =
    sp.view && ALLOWED_VIEWS.has(sp.view as AuditsView)
      ? (sp.view as AuditsView)
      : "list";

  const sortColumn: SortColumn =
    sp.sort && ALLOWED_SORT_COLUMNS.has(sp.sort as SortColumn)
      ? (sp.sort as SortColumn)
      : "updated_at";
  const sortDir: "asc" | "desc" = sp.dir === "asc" ? "asc" : "desc";

  const rawPage = Number.parseInt(sp.page ?? "1", 10);
  const currentPage =
    Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;
  const offset = (currentPage - 1) * PAGE_SIZE;

  const canCreateAudit = canEditAudits;

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

  // Org active pour scoper la liste (la RLS legacy ouvre tout aux auditeurs).
  const { data: currentOrgIdRaw } = await supabase.rpc("current_org");
  const currentOrgId = currentOrgIdRaw as string | null;

  // ---------------------------------------------------------------------
  // Requête paginée - un seul aller-retour qui renvoie aussi le `count`
  // exact (utilisé par la pagination). Tout le filtrage est fait en SQL.
  // `projects!inner` rend la jointure obligatoire et permet de filtrer
  // par nom de projet.
  // ---------------------------------------------------------------------
  let request = supabase
    .from("audits")
    .select(
      `
      id, status, platform, site_name,
      initial_score, final_score, updated_at,
      reference:references(type, version),
      project:projects!inner(name, client:clients(name))
    `,
      { count: "exact" },
    )
    .order(sortColumn, { ascending: sortDir === "asc", nullsFirst: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (currentOrgId) request = request.eq("organization_id", currentOrgId);
  if (statusFilter) request = request.eq("status", statusFilter);
  if (platformFilter) request = request.eq("platform", platformFilter);
  if (mineFilter) {
    // Si aucune assignation, la liste sera vide - comportement attendu.
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
  if (view !== "list") baseParams.set("view", view);

  // Aplatit les jointures Supabase (`reference` et `project.client` peuvent
  // arriver sous forme de tableau selon le résolveur) pour passer une shape
  // stable au client component.
  const rows: AuditTableRow[] = audits.map((a) => {
    const project = Array.isArray(a.project) ? a.project[0] : a.project;
    const client = project?.client
      ? Array.isArray(project.client)
        ? project.client[0]
        : project.client
      : null;
    const ref = Array.isArray(a.reference) ? a.reference[0] : a.reference;
    return {
      id: a.id as string,
      status: a.status as AuditStatus,
      platform: a.platform as PlatformType,
      initial_score: a.initial_score as number | null,
      final_score: a.final_score as number | null,
      updated_at: a.updated_at as string,
      site_name: (a.site_name as string | null) ?? null,
      reference: ref
        ? { type: ref.type as ReferenceType, version: ref.version as string }
        : null,
      project: project
        ? {
            name: project.name as string,
            client: client ? { name: client.name as string } : null,
          }
        : null,
    };
  });

  return (
    <div className="space-y-5 px-4 pb-8 md:px-9">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[2.125rem] font-black leading-tight tracking-tight">
            {t("title")}
          </h1>
          <p className="mt-1 text-base text-muted-foreground">
            {t("subtitle", { count: total })}
          </p>
        </div>

        {canCreateAudit && (
          <Button asChild>
            <Link href="/audits/new">
              <Plus data-anim="spin" aria-hidden="true" />
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
        initialView={view}
      />

      {error ? (
        <div
          role="alert"
          className="rounded-card border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive"
        >
          {error.message}
        </div>
      ) : audits.length === 0 ? (
        <Card className="p-6">
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
                    <Plus aria-hidden="true" />
                    {t("newAudit")}
                  </Link>
                </Button>
              )}
          </EmptyState>
        </Card>
      ) : view === "cards" ? (
        <div className="space-y-4">
          <AuditsTable
            audits={rows}
            sortColumn={sortColumn}
            sortDir={sortDir}
            baseParamsStr={baseParams.toString()}
            canEditAudits={canEditAudits}
            canDeleteAudits={profile.isPlatformAdmin}
            view={view}
          />
          <AuditsPagination
            currentPage={currentPage}
            totalPages={totalPages}
            total={total}
            from={from}
            to={to}
            baseParams={baseParams}
            pathname="/audits"
          />
        </div>
      ) : (
        <Card className="p-2">
          <AuditsTable
            audits={rows}
            sortColumn={sortColumn}
            sortDir={sortDir}
            baseParamsStr={baseParams.toString()}
            canEditAudits={canEditAudits}
            canDeleteAudits={profile.isPlatformAdmin}
            view={view}
          />
          <AuditsPagination
            currentPage={currentPage}
            totalPages={totalPages}
            total={total}
            from={from}
            to={to}
            baseParams={baseParams}
            pathname="/audits"
          />
        </Card>
      )}
    </div>
  );
}
