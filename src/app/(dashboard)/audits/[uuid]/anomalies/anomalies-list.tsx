"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Layers,
  Loader2,
  MessageSquare,
  MinusCircle,
  Paperclip,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { cn } from "@/lib/utils";
import { intlLocale } from "@/lib/intl";
import { canCreateNC, canDeleteNC, canEditNC } from "@/lib/permissions";
import type { NCSeverity, NCStatus, UserRole } from "@/types/domain";
import {
  bulkDeleteNCs,
  bulkUpdateNCSeverity,
  bulkUpdateNCStatus,
} from "./actions";

const STATUS_BADGE_VARIANT: Record<
  string,
  "warning" | "secondary" | "success" | "muted" | "outline"
> = {
  TO_FIX: "warning",
  IN_PROGRESS: "secondary",
  FIXED: "success",
  FALSE_POSITIVE: "muted",
};

const FILTER_STATUSES = [
  "TO_FIX",
  "IN_PROGRESS",
  "FIXED",
  "FALSE_POSITIVE",
] as const;

const FILTER_SEVERITIES: NCSeverity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

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
}

interface AnomaliesListProps {
  ncs: AnomalyListItem[];
  auditId: string;
  auditTitle: string;
  role: UserRole;
}

export function AnomaliesList({
  ncs,
  auditId,
  auditTitle,
  role,
}: AnomaliesListProps) {
  const t = useTranslations("audits.anomalies");
  const tBulk = useTranslations("audits.anomalies.bulk");
  const tNcStatus = useTranslations("constants.ncStatus");
  const tNcSeverity = useTranslations("constants.ncSeverity");
  const tList = useTranslations("audits.list");
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
  // La permission de supprimer est vérifiée séparément côté barre flottante.
  const canBulk = canEditNC(role);
  const canCreate = canCreateNC(role);
  const allowBulkDelete = canDeleteNC(role);

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
      FALSE_POSITIVE: 0,
    } as Record<string, number>;
    for (const nc of ncs) {
      if (nc.status in c) c[nc.status]! += 1;
    }
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

  const handleBulkDelete = () => {
    if (ids.length === 0) return;
    const ok = window.confirm(tBulk("deleteConfirm", { count: ids.length }));
    if (!ok) return;
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
    <div className="container mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1 text-xs text-muted-foreground"
      >
        <Link
          href="/audits"
          className="rounded px-1 py-0.5 hover:bg-accent hover:text-foreground"
        >
          {tList("title")}
        </Link>
        <ChevronRight className="h-3 w-3" aria-hidden="true" />
        <Link
          href={`/audits/${auditId}`}
          className="rounded px-1 py-0.5 hover:bg-accent hover:text-foreground"
        >
          {auditTitle}
        </Link>
        <ChevronRight className="h-3 w-3" aria-hidden="true" />
        <span className="rounded px-1 py-0.5 font-medium text-foreground">
          {t("breadcrumb")}
        </span>
      </nav>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("subtitle", { count: ncs.length })}
          </p>
        </div>
        {canCreate && (
          <Button asChild size="default">
            <Link href={`/audits/${auditId}/anomalies/new`}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t("newNC")}
            </Link>
          </Button>
        )}
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={AlertTriangle}
          tone="primary"
          label={t("kpi.total")}
          value={ncs.length}
        />
        <KpiCard
          icon={Clock}
          tone="warning"
          label={t("kpi.toFix")}
          value={counters.TO_FIX ?? 0}
        />
        <KpiCard
          icon={CheckCircle2}
          tone="success"
          label={t("kpi.fixed")}
          value={counters.FIXED ?? 0}
        />
        <KpiCard
          icon={MinusCircle}
          tone="muted"
          label={t("kpi.falsePositive")}
          value={counters.FALSE_POSITIVE ?? 0}
        />
      </div>

      <Card className="sticky top-0 z-10 shadow-sm">
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              aria-label={t("searchAria")}
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger aria-label={t("filterStatusAria")}>
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

          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger aria-label={t("filterSeverityAria")}>
              <SelectValue placeholder={t("filterSeverityPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t("filterAllSeverities")}</SelectItem>
              {FILTER_SEVERITIES.map((s) => (
                <SelectItem key={s} value={s}>
                  {tNcSeverity(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={pageFilter} onValueChange={setPageFilter}>
            <SelectTrigger aria-label={t("filterPageAria")}>
              <SelectValue placeholder={t("filterPagePlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t("filterAllPages")}</SelectItem>
              <SelectItem value={TRANSVERSAL}>{t("filterTransversal")}</SelectItem>
              {pageNames.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
        {filtersActive && (
          <div className="flex justify-end border-t border-border px-4 py-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              {tCommon("reset")}
            </Button>
          </div>
        )}
      </Card>

      {/* Barre de sélection groupée (au-dessus de la liste). */}
      {canBulk && filtered.length > 0 && (
        <div className="flex items-center gap-3 rounded-md border border-border bg-muted/30 px-4 py-2">
          <Checkbox
            checked={masterChecked}
            onCheckedChange={toggleAllVisible}
            aria-label={tBulk("selectAllAria")}
          />
          <span className="text-xs text-muted-foreground">
            {selected.size > 0
              ? tBulk("selected", { count: selected.size })
              : t("subtitle", { count: filtered.length })}
          </span>
        </div>
      )}

      {feedback && (
        <div
          role={feedback.kind === "error" ? "alert" : "status"}
          className={cn(
            "rounded-md border px-4 py-3 text-sm",
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
              className="rounded p-1 hover:bg-foreground/10"
              aria-label={tBulk("dismiss")}
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState empty={ncs.length === 0} onReset={resetFilters} />
      ) : (
        <ul className="space-y-3">
          {filtered.map((nc) => (
            <li key={nc.id}>
              <NCRow
                auditId={auditId}
                nc={nc}
                intl={intl}
                canBulk={canBulk}
                isSelected={selected.has(nc.id)}
                onToggle={() => toggleOne(nc.id)}
              />
            </li>
          ))}
        </ul>
      )}

      {/* Barre flottante d'actions en masse (bas de l'écran). */}
      {canBulk && selected.size > 0 && (
        <div
          role="region"
          aria-label={tBulk("applyAria")}
          className="fixed bottom-4 left-1/2 z-40 w-full max-w-3xl -translate-x-1/2 px-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-popover/95 px-4 py-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-popover/80">
            <div className="flex items-center gap-3">
              {isPending ? (
                <Loader2
                  className="h-4 w-4 animate-spin text-muted-foreground"
                  aria-hidden="true"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="flex h-7 min-w-7 items-center justify-center rounded-full bg-primary px-2 text-xs font-semibold text-primary-foreground tabular-nums"
                >
                  {selected.size}
                </span>
              )}
              <p className="text-sm font-medium">
                {tBulk("selected", { count: selected.size })}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={isPending}>
                    {tBulk("changeStatus")}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    {tBulk("changeStatus")}
                  </DropdownMenuLabel>
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
                  <Button variant="outline" size="sm" disabled={isPending}>
                    {tBulk("changeSeverity")}
                  </Button>
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={isPending}
                  className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {tBulk("delete")}
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                disabled={isPending}
                className="gap-1.5"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                {tBulk("clear")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const toneClasses = {
  primary: "bg-primary/10 text-primary",
  warning: "bg-warning/10 text-warning",
  success: "bg-success/10 text-success",
  muted: "bg-muted text-muted-foreground",
} as const;

function KpiCard({
  icon: Icon,
  tone,
  label,
  value,
}: {
  icon: React.ElementType;
  tone: keyof typeof toneClasses;
  label: string;
  value: number;
}) {
  return (
    <Card className="p-6 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg",
          toneClasses[tone],
        )}
        aria-hidden="true"
      >
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight">
        {value}
      </p>
    </Card>
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
  const statusVariant = STATUS_BADGE_VARIANT[nc.status] ?? "outline";

  return (
    <Card
      className={cn(
        "flex items-center gap-3 p-4 transition-all duration-150",
        isSelected
          ? "border-primary/60 bg-primary/5 shadow-sm"
          : "hover:-translate-y-0.5 hover:shadow-md",
      )}
    >
      {canBulk && (
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggle}
          aria-label={tBulk("selectRowAria", { title: nc.title })}
          className="shrink-0"
        />
      )}

      <Link
        href={`/audits/${auditId}/anomalies/${nc.id}`}
        className="flex flex-1 flex-col gap-4 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={nc.severity} />
            <Badge variant={statusVariant} className="text-[10px]">
              {tNcStatus(nc.status)}
            </Badge>
            {nc.criterion && (
              <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                {nc.criterion.identifier}
              </span>
            )}
          </div>
          <p className="truncate text-base font-semibold leading-snug">
            {nc.title}
          </p>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              {nc.page ? (
                <>
                  {t("page")}{" "}
                  <span className="text-foreground">{nc.page.name}</span>
                </>
              ) : (
                <>
                  <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("transversal")}
                </>
              )}
            </span>
            <span aria-hidden="true">·</span>
            <time dateTime={nc.createdAt} className="tabular-nums">
              {t("createdOn", {
                date: new Date(nc.createdAt).toLocaleDateString(intl, {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                }),
              })}
            </time>
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-4 text-muted-foreground">
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
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </div>
      </Link>
    </Card>
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
      className="inline-flex items-center gap-1 text-xs tabular-nums"
      aria-label={t("counterAria", { count, label })}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {count}
    </span>
  );
}

function EmptyState({
  empty,
  onReset,
}: {
  empty: boolean;
  onReset: () => void;
}) {
  const t = useTranslations("audits.anomalies");
  const tCommon = useTranslations("common");
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <div
          aria-hidden="true"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
        >
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">
            {empty ? t("emptyTitle") : t("noResultsTitle")}
          </p>
          <p className="text-xs text-muted-foreground">
            {empty ? t("emptyDesc") : t("noResultsDesc")}
          </p>
        </div>
        {!empty && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onReset}
            className="gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            {tCommon("reset")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
