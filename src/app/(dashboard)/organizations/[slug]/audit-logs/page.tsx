import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, History } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { orgHasFeature } from "@/lib/billing/server";
import { ExportButton } from "./export-button";

const PAGE_SIZE = 50;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const t = await getTranslations("organizations.auditLogs");
  const { slug } = await params;
  return { title: t("metaTitle", { slug }) };
}

interface LogRow {
  id: string;
  created_at: string;
  audit_id: string | null;
  actor_id: string | null;
  actor_role: string | null;
  action: string;
  payload: unknown;
  actor:
    | {
        first_name: string | null;
        last_name: string | null;
        email: string | null;
      }
    | Array<{
        first_name: string | null;
        last_name: string | null;
        email: string | null;
      }>
    | null;
}

export default async function AuditLogsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    action?: string;
    actorId?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}) {
  await requireProfile();
  const { slug } = await params;
  const sp = await searchParams;
  const t = await getTranslations("organizations.auditLogs");
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, slug, name")
    .eq("slug", slug)
    .maybeSingle();
  if (!org) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", org.id)
    .eq("user_id", user?.id ?? "")
    .maybeSingle();
  if (!membership) notFound();
  const isOrgAdmin =
    membership.role === "owner" || membership.role === "admin";

  const exportEnabled = await orgHasFeature("audit_logs.export");

  // Parse filters.
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const action = sp.action?.trim() || undefined;
  const actorId = sp.actorId?.trim() || undefined;
  const from = sp.from || undefined;
  const to = sp.to || undefined;

  // Query.
  let query = supabase
    .from("audit_logs")
    .select(
      `id, created_at, audit_id, actor_id, actor_role, action, payload,
       actor:profiles!audit_logs_actor_id_fkey(first_name, last_name, email)`,
      { count: "exact" },
    )
    .eq("organization_id", org.id)
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (action) query = query.eq("action", action);
  if (actorId) query = query.eq("actor_id", actorId);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);

  const { data: rows, count } = await query;

  // Liste distincte des actions vues (pour le datalist du filtre).
  const { data: actionRows } = await supabase
    .from("audit_logs")
    .select("action")
    .eq("organization_id", org.id)
    .limit(500);
  const distinctActions = Array.from(
    new Set((actionRows ?? []).map((r) => r.action)),
  ).sort();

  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const filters = { action, actorId, from, to };

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-6 md:p-8">
      <Button asChild variant="ghost" size="sm" className="gap-1 -ml-3">
        <Link href={`/organizations/${org.slug}`}>
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {t("back")}
        </Link>
      </Button>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <History className="h-6 w-6 text-primary" aria-hidden="true" />
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        {isOrgAdmin && (
          <ExportButton
            organizationId={org.id}
            filters={filters}
            disabled={!exportEnabled}
            disabledReason={
              !exportEnabled ? t("exportGated") : undefined
            }
          />
        )}
      </header>

      {/* Filtres */}
      <Card>
        <CardContent className="p-4">
          <form
            method="GET"
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            <div className="space-y-1">
              <label htmlFor="action" className="text-xs font-medium">
                {t("filters.action")}
              </label>
              <input
                id="action"
                name="action"
                list="actions-list"
                defaultValue={action ?? ""}
                placeholder={t("filters.actionPlaceholder")}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
              />
              <datalist id="actions-list">
                {distinctActions.map((a) => (
                  <option key={a} value={a} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1">
              <label htmlFor="from" className="text-xs font-medium">
                {t("filters.from")}
              </label>
              <input
                id="from"
                name="from"
                type="date"
                defaultValue={from ?? ""}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="to" className="text-xs font-medium">
                {t("filters.to")}
              </label>
              <input
                id="to"
                name="to"
                type="date"
                defaultValue={to ?? ""}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit" size="sm">
                {t("filters.apply")}
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href={`/organizations/${org.slug}/audit-logs`}>
                  {t("filters.reset")}
                </Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {(rows ?? []).length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {t("empty")}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {((rows ?? []) as LogRow[]).map((row) => {
                const actor = Array.isArray(row.actor) ? row.actor[0] : row.actor;
                const actorName = actor
                  ? [actor.first_name, actor.last_name]
                      .filter(Boolean)
                      .join(" ")
                      .trim() || actor.email
                  : "—";
                const payloadStr =
                  row.payload &&
                  typeof row.payload === "object" &&
                  Object.keys(row.payload).length > 0
                    ? JSON.stringify(row.payload)
                    : null;
                return (
                  <li
                    key={row.id}
                    className="grid gap-1 px-4 py-3 text-sm sm:grid-cols-[160px_180px_1fr]"
                  >
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {new Date(row.created_at).toLocaleString()}
                    </span>
                    <span className="truncate">
                      <span className="text-xs">{actorName || "—"}</span>
                      {row.actor_role && (
                        <Badge
                          variant="secondary"
                          className="ml-2 text-[10px]"
                        >
                          {row.actor_role}
                        </Badge>
                      )}
                    </span>
                    <div className="min-w-0 space-y-1">
                      <span className="font-mono text-xs">{row.action}</span>
                      {payloadStr && (
                        <p className="truncate font-mono text-[10px] text-muted-foreground">
                          {payloadStr}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav
          className="flex items-center justify-between text-xs text-muted-foreground"
          aria-label={t("pagination.aria")}
        >
          <span>
            {t("pagination.summary", {
              from: (page - 1) * PAGE_SIZE + 1,
              to: Math.min(page * PAGE_SIZE, totalCount),
              total: totalCount,
            })}
          </span>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Button asChild variant="outline" size="sm">
                <Link
                  href={buildPageUrl(org.slug, sp, page - 1)}
                  prefetch={false}
                >
                  {t("pagination.prev")}
                </Link>
              </Button>
            )}
            <span>
              {t("pagination.page", { page, total: totalPages })}
            </span>
            {page < totalPages && (
              <Button asChild variant="outline" size="sm">
                <Link
                  href={buildPageUrl(org.slug, sp, page + 1)}
                  prefetch={false}
                >
                  {t("pagination.next")}
                </Link>
              </Button>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}

function buildPageUrl(
  slug: string,
  sp: { action?: string; actorId?: string; from?: string; to?: string },
  page: number,
): string {
  const params = new URLSearchParams();
  if (sp.action) params.set("action", sp.action);
  if (sp.actorId) params.set("actorId", sp.actorId);
  if (sp.from) params.set("from", sp.from);
  if (sp.to) params.set("to", sp.to);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return `/organizations/${slug}/audit-logs${qs ? `?${qs}` : ""}`;
}

export const dynamic = "force-dynamic";
