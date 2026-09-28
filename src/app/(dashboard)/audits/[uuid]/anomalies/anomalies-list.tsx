"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertTriangle,
  ChevronRight,
  Layers,
  Loader2,
  MessageSquare,
  Paperclip,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterChip } from "@/components/ui/filter-chip";
import { StatusDot } from "@/components/ui/status-dot";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SeverityBadge } from "@/components/audit/severity-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, themeColorForIdentifier } from "@/lib/utils";
import { intlLocale } from "@/lib/intl";
import { canAny, type Permission } from "@/lib/permissions";
import type {
  NCReviewStatus,
  NCSeverity,
  NCStatus,
  UserRole,
} from "@/types/domain";
import { NCReviewBadge } from "@/components/audit/nc-review-badge";
import {
  bulkDeleteNCs,
  bulkUpdateNCSeverity,
  bulkUpdateNCStatus,
} from "./actions";

const NC_STATUS_COLOR: Record<string, string> = {
  TO_FIX: "hsl(var(--destructive))",
  IN_PROGRESS: "hsl(var(--primary))",
  FIXED: "hsl(var(--success))",
};

const FILTER_STATUSES = ["TO_FIX", "IN_PROGRESS", "FIXED"] as const;

const FILTER_SEVERITIES: NCSeverity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

/** Ordre des pilules de sévérité : la plus urgente en premier. */
const PILL_SEVERITIES: NCSeverity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

const ALL = "ALL";
const TRANSVERSAL = "__TRANSVERSAL__";

export interface AnomalyListItem {
  id: string;
  title: string;
  status: string;
  severity: NCSeverity;
  createdAt: string;
  criterion: { identifier: string; name: string } | null;
  page: { name: string } | null;
  messageCount: number;
  attachmentCount: number;
  /** Numéro séquentiel par audit (migration 41). */
  displayNumber: number;
  /** Statut de relecture pour afficher l'indicateur sur la carte. */
  reviewStatus: NCReviewStatus;
}

interface AnomaliesListProps {
  ncs: AnomalyListItem[];
  auditId: string;
  role: UserRole;
  orgPermissions?: Permission[];
}

export function AnomaliesList({
  ncs,
  auditId,
  role,
  orgPermissions,
}: AnomaliesListProps) {
  const orgPerms = new Set(orgPermissions ?? []);
  const t = useTranslations("audits.anomalies");
  const tBulk = useTranslations("audits.anomalies.bulk");
  const tNcStatus = useTranslations("constants.ncStatus");
  const tNcSeverity = useTranslations("constants.ncSeverity");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const intl = intlLocale(locale);
  const router = useRouter();

  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [severityFilter, setSeverityFilter] = useState<string>(ALL);
  const [pageFilter, setPageFilter] = useState<string>(ALL);
  const [search, setSearch] = useState("");

  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [feedback, setFeedback] = useState<
    { kind: "success" | "error"; message: string } | null
  >(null);
  const [isPending, startTransition] = useTransition();

  // Sélection groupée : seulement pour ceux qui peuvent éditer les NC.
  const canBulk = canAny(role, orgPerms, "nc.edit");
  const canCreate = canAny(role, orgPerms, "nc.create");
  const allowBulkDelete = canAny(role, orgPerms, "nc.delete");

  const pageNames = useMemo(() => {
    const names = new Set<string>();
    for (const nc of ncs) {
      if (nc.page?.name) names.add(nc.page.name);
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b, locale));
  }, [ncs, locale]);

  const counters = useMemo(() => {
    const c = {
      TO_FIX: 0,
      IN_PROGRESS: 0,
      FIXED: 0,
    } as Record<string, number>;
    for (const nc of ncs) {
      if (nc.status in c) c[nc.status]! += 1;
    }
    return c;
  }, [ncs]);

  const severityCounters = useMemo(() => {
    const c: Record<string, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0,
    };
    for (const nc of ncs) c[nc.severity] = (c[nc.severity] ?? 0) + 1;
    return c;
  }, [ncs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ncs.filter((nc) => {
      if (statusFilter !== ALL && nc.status !== statusFilter) return false;
      if (severityFilter !== ALL && nc.severity !== severityFilter) return false;
      if (pageFilter !== ALL) {
        if (pageFilter === TRANSVERSAL) {
          if (nc.page) return false;
        } else if (nc.page?.name !== pageFilter) {
          return false;
        }
      }
      if (q && !nc.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [ncs, statusFilter, severityFilter, pageFilter, search]);

  // Purge la sélection des IDs qui ne sont plus dans la liste (après
  // suppression bulk ou changement de données côté serveur).
  useEffect(() => {
    setSelected((prev) => {
      const ncIds = new Set(ncs.map((n) => n.id));
      let changed = false;
      const next = new Set<string>();
      for (const id of prev) {
        if (ncIds.has(id)) next.add(id);
        else changed = true;
      }
      return changed ? next : prev;
    });
  }, [ncs]);

  const filtersActive =
    statusFilter !== ALL ||
    severityFilter !== ALL ||
    pageFilter !== ALL ||
    search.trim().length > 0;

  const resetFilters = () => {
    setStatusFilter(ALL);
    setSeverityFilter(ALL);
    setPageFilter(ALL);
    setSearch("");
  };

  // -------------------------------------------------------------------------
  // Sélection
  // -------------------------------------------------------------------------
  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allVisibleSelected =
    filtered.length > 0 && filtered.every((nc) => selected.has(nc.id));
  const someVisibleSelected =
    filtered.some((nc) => selected.has(nc.id)) && !allVisibleSelected;
  const masterChecked: boolean | "indeterminate" = allVisibleSelected
    ? true
    : someVisibleSelected
      ? "indeterminate"
      : false;

  const toggleAllVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        for (const nc of filtered) next.delete(nc.id);
      } else {
        for (const nc of filtered) next.add(nc.id);
      }
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  // -------------------------------------------------------------------------
  // Actions en masse
  // -------------------------------------------------------------------------
  const ids = useMemo(() => Array.from(selected), [selected]);

  const handleBulkStatus = (status: NCStatus) => {
    if (ids.length === 0) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await bulkUpdateNCStatus(auditId, ids, status);
      if (res.error) {
        setFeedback({ kind: "error", message: res.error });
        return;
      }
      setFeedback({
        kind: "success",
        message: tBulk("successStatus", { count: res.count ?? ids.length }),
      });
      clearSelection();
      router.refresh();
    });
  };

  const handleBulkSeverity = (severity: NCSeverity) => {
    if (ids.length === 0) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await bulkUpdateNCSeverity(auditId, ids, severity);
      if (res.error) {
        setFeedback({ kind: "error", message: res.error });
        return;
      }
      setFeedback({
        kind: "success",
        message: tBulk("successSeverity", { count: res.count ?? ids.length }),
      });
      clearSelection();
      router.refresh();
    });
  };

  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleBulkDelete = () => {
    if (ids.length === 0) return;
    setDeleteOpen(false);
    setFeedback(null);
    startTransition(async () => {
      const res = await bulkDeleteNCs(auditId, ids);
      if (res.error) {
        setFeedback({ kind: "error", message: res.error });
        return;
      }
      setFeedback({
        kind: "success",
        message: tBulk("successDelete", { count: res.count ?? ids.length }),
      });
      clearSelection();
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[1.75rem] font-black leading-tight tracking-tight">
            {t("title")}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-base text-muted-foreground">
            <span>{t("subtitle", { count: ncs.length })}</span>
            <StatusDot color="hsl(var(--destructive))">
              {counters.TO_FIX} {t("kpi.toFix")}
            </StatusDot>
            <StatusDot color="hsl(var(--primary))">
              {counters.IN_PROGRESS} {t("kpi.inProgress")}
            </StatusDot>
            <StatusDot color="hsl(var(--success))">
              {counters.FIXED} {t("kpi.fixed")}
            </StatusDot>
          </p>
        </div>
        {canCreate && (
          <Button asChild variant="destructive">
            <Link href={`/audits/${auditId}/anomalies/new`}>
              <Plus data-anim="spin" aria-hidden="true" />
              {t("newNC")}
            </Link>
          </Button>
        )}
      </header>

      {/* Filtres : recherche, pilules de sévérité, statut et page. */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative w-full sm:w-64">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-row pl-11"
            aria-label={t("searchAria")}
          />
        </div>

        <div
          role="group"
          aria-label={t("filterSeverityAria")}
          className="flex flex-wrap items-center gap-2"
        >
          <FilterChip
            label={t("filterAllSeverities")}
            pressed={severityFilter === ALL}
            count={ncs.length}
            onClick={() => setSeverityFilter(ALL)}
          />
          {PILL_SEVERITIES.map((s) => (
            <FilterChip
              key={s}
              label={tNcSeverity(s)}
              pressed={severityFilter === s}
              count={severityCounters[s]}
              onClick={() => setSeverityFilter(s)}
            />
          ))}
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger
            className="h-9 w-44 rounded-full text-sm font-bold sm:ml-auto"
            aria-label={t("filterStatusAria")}
          >
            <SelectValue placeholder={t("filterStatusPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("filterAllStatuses")}</SelectItem>
            {FILTER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {tNcStatus(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={pageFilter} onValueChange={setPageFilter}>
          <SelectTrigger
            className="h-9 w-44 rounded-full text-sm font-bold"
            aria-label={t("filterPageAria")}
          >
            <SelectValue placeholder={t("filterPagePlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("filterAllPages")}</SelectItem>
            <SelectItem value={TRANSVERSAL}>
              {t("filterTransversal")}
            </SelectItem>
            {pageNames.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {filtersActive && (
          <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
            <RotateCcw aria-hidden="true" />
            {tCommon("reset")}
          </Button>
        )}
      </div>

      {feedback && (
        <div
          role={feedback.kind === "error" ? "alert" : "status"}
          className={cn(
            "rounded-row border px-4 py-3 text-sm font-semibold",
            feedback.kind === "error"
              ? "border-destructive/40 bg-destructive/5 text-destructive"
              : "border-success/40 bg-success/5 text-success",
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <span>{feedback.message}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="rounded-md p-1 hover:bg-foreground/10"
              aria-label={tBulk("dismiss")}
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <NoResults empty={ncs.length === 0} onReset={resetFilters} />
      ) : (
        <Card className="p-2">
          <div className="overflow-x-auto">
            <table className="w-full">
              <caption className="sr-only">
                {t("subtitle", { count: filtered.length })}
              </caption>
              <thead className="border-b border-border">
                <tr className="text-left text-xs font-bold text-muted-foreground">
                  {canBulk && (
                    <th scope="col" className="w-10 px-3 py-2">
                      <Checkbox
                        checked={masterChecked}
                        onCheckedChange={toggleAllVisible}
                        aria-label={tBulk("selectAllAria")}
                      />
                    </th>
                  )}
                  <th scope="col" className="w-20 px-3 py-2">
                    {t("columns.criterion")}
                  </th>
                  <th scope="col" className="px-3 py-2">
                    {t("columns.title")}
                  </th>
                  <th scope="col" className="px-3 py-2">
                    {t("columns.page")}
                  </th>
                  <th scope="col" className="px-3 py-2">
                    {t("columns.severity")}
                  </th>
                  <th scope="col" className="px-3 py-2">
                    {t("columns.status")}
                  </th>
                  <th scope="col" className="px-3 py-2">
                    {t("columns.activity")}
                  </th>
                  <th scope="col" className="px-3 py-2">
                    <span className="sr-only">{tCommon("open")}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((nc) => (
                  <NCRow
                    key={nc.id}
                    auditId={auditId}
                    nc={nc}
                    intl={intl}
                    canBulk={canBulk}
                    isSelected={selected.has(nc.id)}
                    onToggle={() => toggleOne(nc.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Barre flottante d'actions en masse (bas de l'écran). */}
      {canBulk && selected.size > 0 && (
        <div
          role="region"
          aria-label={tBulk("applyAria")}
          className="fixed bottom-4 left-1/2 z-40 w-full max-w-3xl -translate-x-1/2 px-4"
        >
          <div className="axs-bulk flex flex-wrap items-center justify-between gap-3 rounded-[14px] bg-ink px-4 py-2.5 text-ink-foreground shadow-float">
            <div className="flex items-center gap-3">
              {isPending ? (
                <Loader2
                  className="size-4 animate-spin text-ink-muted"
                  aria-hidden="true"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="flex h-7 min-w-7 items-center justify-center rounded-full bg-primary px-2 text-xs font-extrabold tabular text-primary-foreground"
                >
                  {selected.size}
                </span>
              )}
              <p className="text-sm font-bold">
                {tBulk("selected", { count: selected.size })}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <BulkButton disabled={isPending}>
                    {tBulk("changeStatus")}
                  </BulkButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{tBulk("changeStatus")}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {FILTER_STATUSES.map((s) => (
                    <DropdownMenuItem
                      key={s}
                      onSelect={() => handleBulkStatus(s as NCStatus)}
                    >
                      {tNcStatus(s)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <BulkButton disabled={isPending}>
                    {tBulk("changeSeverity")}
                  </BulkButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    {tBulk("changeSeverity")}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {FILTER_SEVERITIES.map((s) => (
                    <DropdownMenuItem
                      key={s}
                      onSelect={() => handleBulkSeverity(s)}
                    >
                      {tNcSeverity(s)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {allowBulkDelete && (
                <>
                  <BulkButton
                    tone="destructive"
                    disabled={isPending}
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                    {tBulk("delete")}
                  </BulkButton>
                  <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                    <AlertDialogContent>
                      <AlertDialogHeader icon={<Trash2 aria-hidden="true" />}>
                        <AlertDialogTitle>
                          {tCommon("confirmTitle")}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {tBulk("deleteConfirm", { count: ids.length })}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>
                          {tCommon("cancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction
                          variant="destructive"
                          onClick={handleBulkDelete}
                        >
                          {tCommon("delete")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}

              <BulkButton disabled={isPending} onClick={clearSelection}>
                <X className="size-3.5" aria-hidden="true" />
                {tBulk("clear")}
              </BulkButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/** Bouton de la barre d'actions en masse (sur fond encre). */
function BulkButton({
  tone = "default",
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "default" | "destructive";
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3.5 text-sm font-bold",
        "transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50",
        tone === "destructive"
          ? "border-transparent text-destructive hover:bg-destructive/15"
          : "border-ink-raised text-ink-foreground hover:bg-ink-raised",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function NCRow({
  auditId,
  nc,
  intl,
  canBulk,
  isSelected,
  onToggle,
}: {
  auditId: string;
  nc: AnomalyListItem;
  intl: string;
  canBulk: boolean;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const t = useTranslations("audits.anomalies");
  const tBulk = useTranslations("audits.anomalies.bulk");
  const tNcStatus = useTranslations("constants.ncStatus");
  const statusColor = NC_STATUS_COLOR[nc.status] ?? "hsl(var(--muted-foreground))";
  // La référence du critère porte la couleur de sa thématique (« 11.1 » → 11).
  const thematicColor = nc.criterion
    ? themeColorForIdentifier(nc.criterion.identifier.split(".")[0] ?? "")
    : "hsl(var(--muted-foreground))";

  return (
    <tr
      className={cn(
        "group border-b border-border last:border-0",
        isSelected
          ? "bg-primary-soft shadow-[inset_0_0_0_2px_hsl(var(--primary))]"
          : "axs-row",
      )}
    >
      {canBulk && (
        <td className="px-3 py-2.5">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggle}
            aria-label={tBulk("selectRowAria", { title: nc.title })}
          />
        </td>
      )}

      <td className="px-3 py-2.5">
        {nc.criterion ? (
          <span
            className="inline-flex items-center rounded-md px-2 py-1 text-xs font-extrabold tabular text-white"
            style={{ background: thematicColor }}
          >
            {nc.criterion.identifier}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>

      <td className="px-3 py-2.5">
        <Link
          href={`/audits/${auditId}/anomalies/${nc.id}`}
          className="block min-w-0"
        >
          <span className="block font-bold leading-snug hover:underline">
            {nc.title}
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
            {nc.displayNumber > 0 && (
              <span className="tabular">
                NC #{String(nc.displayNumber).padStart(3, "0")}
              </span>
            )}
            <time dateTime={nc.createdAt} className="tabular">
              {t("createdOn", {
                date: new Date(nc.createdAt).toLocaleDateString(intl, {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                }),
              })}
            </time>
            <NCReviewBadge status={nc.reviewStatus} hideWhenNotRequested />
          </span>
        </Link>
      </td>

      <td className="px-3 py-2.5 text-sm">
        {nc.page ? (
          nc.page.name
        ) : (
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <Layers className="size-3.5 shrink-0" aria-hidden="true" />
            {t("transversal")}
          </span>
        )}
      </td>

      <td className="px-3 py-2.5">
        <SeverityBadge severity={nc.severity} />
      </td>

      <td className="px-3 py-2.5">
        <StatusDot color={statusColor}>{tNcStatus(nc.status)}</StatusDot>
      </td>

      <td className="px-3 py-2.5">
        <span className="flex items-center gap-3 text-muted-foreground">
          <Counter
            icon={MessageSquare}
            count={nc.messageCount}
            label={t("messages")}
          />
          <Counter
            icon={Paperclip}
            count={nc.attachmentCount}
            label={t("captures")}
          />
        </span>
      </td>

      <td className="px-3 py-2.5 text-right">
        <Link
          href={`/audits/${auditId}/anomalies/${nc.id}`}
          aria-label={t("openAria", { title: nc.title })}
          className="inline-flex size-9 items-center justify-center rounded-lg text-primary opacity-0 transition-opacity duration-150 focus-visible:opacity-100 group-hover:opacity-100"
        >
          <ChevronRight className="size-[18px]" aria-hidden="true" />
        </Link>
      </td>
    </tr>
  );
}

function Counter({
  icon: Icon,
  count,
  label,
}: {
  icon: React.ElementType;
  count: number;
  label: string;
}) {
  const t = useTranslations("audits.anomalies");
  return (
    <span
      className="inline-flex items-center gap-1 text-sm tabular"
      aria-label={t("counterAria", { count, label })}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {count}
    </span>
  );
}

function NoResults({
  empty,
  onReset,
}: {
  empty: boolean;
  onReset: () => void;
}) {
  const t = useTranslations("audits.anomalies");
  const tCommon = useTranslations("common");
  return (
    <EmptyState
      icon={AlertTriangle}
      title={empty ? t("emptyTitle") : t("noResultsTitle")}
      description={empty ? t("emptyDesc") : t("noResultsDesc")}
    >
      {!empty && (
        <Button type="button" variant="outline" size="sm" onClick={onReset}>
          <RotateCcw aria-hidden="true" />
          {tCommon("reset")}
        </Button>
      )}
    </EmptyState>
  );
}
