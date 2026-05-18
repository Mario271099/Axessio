"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Layers,
  MessageSquare,
  MinusCircle,
  Paperclip,
  Plus,
  RotateCcw,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SeverityBadge } from "@/components/audit/severity-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { intlLocale } from "@/lib/intl";
import type { NCSeverity, UserRole } from "@/types/domain";

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
  const tNcStatus = useTranslations("constants.ncStatus");
  const tNcSeverity = useTranslations("constants.ncSeverity");
  const tList = useTranslations("audits.list");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const intl = intlLocale(locale);

  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [severityFilter, setSeverityFilter] = useState<string>(ALL);
  const [pageFilter, setPageFilter] = useState<string>(ALL);
  const [search, setSearch] = useState("");

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
        {role === "auditor" && (
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

      <Card className="sticky top-20 z-10 shadow-sm">
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

      {filtered.length === 0 ? (
        <EmptyState empty={ncs.length === 0} onReset={resetFilters} />
      ) : (
        <ul className="space-y-3">
          {filtered.map((nc) => (
            <li key={nc.id}>
              <NCRow auditId={auditId} nc={nc} intl={intl} />
            </li>
          ))}
        </ul>
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
}: {
  auditId: string;
  nc: AnomalyListItem;
  intl: string;
}) {
  const t = useTranslations("audits.anomalies");
  const tNcStatus = useTranslations("constants.ncStatus");
  const statusVariant = STATUS_BADGE_VARIANT[nc.status] ?? "outline";
  return (
    <Link
      href={`/audits/${auditId}/anomalies/${nc.id}`}
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
    >
      <Card
        interactive
        className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
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
      </Card>
    </Link>
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
