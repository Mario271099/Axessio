"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { FileText, AlertTriangle, Search, RotateCcw } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SeverityBadge } from "@/components/audit/severity-badge";
import { computeRgaaRates } from "@/lib/score";
import { NC_SEVERITY_ORDER } from "@/lib/constants";
import { cn, themeColorForIdentifier } from "@/lib/utils";
import type { ConformityStatus, NCSeverity, NCStatus } from "@/types/domain";

export interface SimulatorNC {
  id: string;
  criteriaId: string;
  title: string;
  description: string | null;
  severity: NCSeverity;
  status: NCStatus;
  isFixed: boolean;
  criterion: { id: string; identifier: string; name: string };
  thematic: {
    id: string;
    identifier: string;
    name: string;
    sortOrder: number;
  } | null;
  page: { id: string; name: string; sortOrder: number } | null;
}

export interface SimulatorPage {
  id: string;
  name: string;
  sortOrder: number;
}

export interface SimulatorThematic {
  id: string;
  identifier: string;
  name: string;
  sortOrder: number;
}

type SeverityFilter = "ALL" | NCSeverity;
type StatusFilter = "ALL" | "TODO" | "IN_PROGRESS" | "FIXED";
type PageFilter = "ALL" | "TRANSVERSAL" | string;
type ThematicFilter = "ALL" | string;
type SortMode =
  | "SEVERITY_DESC"
  | "SEVERITY_ASC"
  | "BY_PAGE"
  | "BY_THEMATIC"
  | "BY_CRITERION";

const STATUS_FILTER_TO_DB: Record<StatusFilter, NCStatus[] | null> = {
  ALL: null,
  TODO: ["OPEN"],
  IN_PROGRESS: ["IN_PROGRESS"],
  FIXED: ["CORRECTED", "RESOLVED"],
};

const STATUS_FILTER_KEYS: StatusFilter[] = [
  "ALL",
  "TODO",
  "IN_PROGRESS",
  "FIXED",
];

const SORT_KEYS: SortMode[] = [
  "SEVERITY_DESC",
  "SEVERITY_ASC",
  "BY_PAGE",
  "BY_THEMATIC",
  "BY_CRITERION",
];

interface RemediationSimulatorProps {
  allNCs: SimulatorNC[];
  auditPages: SimulatorPage[];
  referenceThematics: SimulatorThematic[];
  /** Cases saisies de la matrice (page_conformities). */
  cells: SimulatorCell[];
}

export interface SimulatorCell {
  pageId: string;
  criteriaId: string;
  status: ConformityStatus;
}

export function RemediationSimulator({
  allNCs,
  auditPages,
  referenceThematics,
  cells,
}: RemediationSimulatorProps) {
  const t = useTranslations("audits.simulator");
  const tSort = useTranslations("audits.simulator.sort");
  const tSeverity = useTranslations("constants.ncSeverity");
  const initialChecked = useMemo(
    () => new Set(allNCs.filter((n) => n.isFixed).map((n) => n.id)),
    [allNCs],
  );
  const [checked, setChecked] = useState<Set<string>>(initialChecked);

  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState<SeverityFilter>("ALL");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [pageFilter, setPageFilter] = useState<PageFilter>("ALL");
  const [thematicFilter, setThematicFilter] = useState<ThematicFilter>("ALL");
  const [sort, setSort] = useState<SortMode>("SEVERITY_DESC");

  const cellStatus = useMemo(
    () => new Map(cells.map((c) => [`${c.pageId}::${c.criteriaId}`, c.status])),
    [cells],
  );

  // Une non-conformité correspond à une cellule (page × critère) de la
  // matrice. La même cellule peut porter plusieurs NC : elle ne (re)devient
  // conforme que lorsque TOUTES ses NC sont corrigées. On ne fait basculer
  // que des cellules réellement NON_COMPLIANT (les transversales sans cellule
  // ou les cellules déjà conformes n'influent pas sur le score).
  const fixedCellKeys = useMemo(() => {
    const ncsPerCell: Record<string, string[]> = {};
    for (const nc of allNCs) {
      if (nc.isFixed) continue;
      const cellKey = `${nc.page?.id ?? "transversal"}::${nc.criteriaId}`;
      if (cellStatus.get(cellKey) !== "NON_COMPLIANT") continue;
      (ncsPerCell[cellKey] ??= []).push(nc.id);
    }
    return new Set(
      Object.entries(ncsPerCell)
        .filter(([, ncs]) => ncs.every((id) => checked.has(id)))
        .map(([key]) => key),
    );
  }, [allNCs, checked, cellStatus]);

  // Taux global officiel RGAA (par critère sur l'échantillon, cf. lib/score.ts,
  // miroir de la RPC audit_current_score) avant et après corrections : un
  // critère ne redevient conforme que si toutes ses pages en échec sont
  // corrigées.
  const { initialRates, simulatedRates } = useMemo(() => {
    const pageIds = auditPages.map((p) => p.id);
    const criterionIds = [...new Set(cells.map((c) => c.criteriaId))];
    const statusOf = (pageId: string, criteriaId: string) =>
      cellStatus.get(`${pageId}::${criteriaId}`);
    return {
      initialRates: computeRgaaRates({ pageIds, criterionIds, statusOf }),
      simulatedRates: computeRgaaRates({
        pageIds,
        criterionIds,
        statusOf: (pageId, criteriaId) =>
          fixedCellKeys.has(`${pageId}::${criteriaId}`)
            ? "COMPLIANT"
            : statusOf(pageId, criteriaId),
      }),
    };
  }, [auditPages, cells, cellStatus, fixedCellKeys]);

  const initialScore = initialRates.globalRate ?? 0;
  const simulatedScore = simulatedRates.globalRate ?? 0;
  // Critères qui redeviennent conformes grâce aux corrections cochées.
  const fixedCells =
    simulatedRates.criteria.compliant - initialRates.criteria.compliant;
  // Critères applicables (constant : une correction déplace un critère de
  // non conforme vers conforme sans changer le total).
  const denominator =
    initialRates.criteria.compliant + initialRates.criteria.nonCompliant;

  const delta = +(simulatedScore - initialScore).toFixed(2);

  // Effet de la simulation par thematique : sur les NC ouvertes de chaque
  // thematique, combien sont cochees comme corrigees.
  const thematicEffect = useMemo(() => {
    const rows = new Map<
      string,
      {
        key: string;
        identifier: string;
        name: string;
        color: string;
        total: number;
        selected: number;
      }
    >();
    for (const nc of allNCs) {
      if (nc.isFixed) continue;
      const key = nc.thematic?.id ?? "none";
      const identifier = nc.thematic?.identifier ?? "?";
      const existing = rows.get(key) ?? {
        key,
        identifier,
        name: nc.thematic?.name ?? tSort("noThematic"),
        color: nc.thematic
          ? themeColorForIdentifier(identifier)
          : "hsl(var(--muted-foreground))",
        total: 0,
        selected: 0,
      };
      existing.total += 1;
      if (checked.has(nc.id)) existing.selected += 1;
      rows.set(key, existing);
    }
    return Array.from(rows.values()).sort(
      (a, b) => b.selected - a.selected || b.total - a.total,
    );
  }, [allNCs, checked, tSort]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const allowedStatuses = STATUS_FILTER_TO_DB[status];

    return allNCs.filter((nc) => {
      if (severity !== "ALL" && nc.severity !== severity) return false;
      if (allowedStatuses && !allowedStatuses.includes(nc.status)) return false;

      if (pageFilter === "TRANSVERSAL" && nc.page !== null) return false;
      if (
        pageFilter !== "ALL" &&
        pageFilter !== "TRANSVERSAL" &&
        nc.page?.id !== pageFilter
      )
        return false;

      if (
        thematicFilter !== "ALL" &&
        nc.thematic?.id !== thematicFilter
      )
        return false;

      if (q && !nc.title.toLowerCase().includes(q)) return false;

      return true;
    });
  }, [allNCs, severity, status, pageFilter, thematicFilter, search]);

  const sorted = useMemo(() => {
    const arr = filtered.slice();
    const byCriterion = (a: SimulatorNC, b: SimulatorNC) =>
      a.criterion.identifier.localeCompare(b.criterion.identifier, "fr", {
        numeric: true,
      });

    switch (sort) {
      case "SEVERITY_DESC":
        arr.sort((a, b) => {
          const cmp =
            NC_SEVERITY_ORDER[a.severity] - NC_SEVERITY_ORDER[b.severity];
          return cmp !== 0 ? cmp : byCriterion(a, b);
        });
        break;
      case "SEVERITY_ASC":
        arr.sort((a, b) => {
          const cmp =
            NC_SEVERITY_ORDER[b.severity] - NC_SEVERITY_ORDER[a.severity];
          return cmp !== 0 ? cmp : byCriterion(a, b);
        });
        break;
      case "BY_PAGE":
        arr.sort((a, b) => {
          const pa = a.page?.sortOrder ?? Number.POSITIVE_INFINITY;
          const pb = b.page?.sortOrder ?? Number.POSITIVE_INFINITY;
          if (pa !== pb) return pa - pb;
          const cmp =
            NC_SEVERITY_ORDER[a.severity] - NC_SEVERITY_ORDER[b.severity];
          return cmp !== 0 ? cmp : byCriterion(a, b);
        });
        break;
      case "BY_THEMATIC":
        arr.sort((a, b) => {
          const ta = a.thematic?.sortOrder ?? Number.POSITIVE_INFINITY;
          const tb = b.thematic?.sortOrder ?? Number.POSITIVE_INFINITY;
          if (ta !== tb) return ta - tb;
          return byCriterion(a, b);
        });
        break;
      case "BY_CRITERION":
        arr.sort(byCriterion);
        break;
    }
    return arr;
  }, [filtered, sort]);

  type Group = { key: string; label: string; items: SimulatorNC[] };
  const grouped: Group[] = useMemo(() => {
    if (sort !== "BY_PAGE" && sort !== "BY_THEMATIC") {
      return [{ key: "_all", label: "", items: sorted }];
    }
    const groups: Group[] = [];
    for (const nc of sorted) {
      const key =
        sort === "BY_PAGE"
          ? nc.page?.id ?? "__transversal__"
          : nc.thematic?.id ?? "__no_thematic__";
      const label =
        sort === "BY_PAGE"
          ? nc.page?.name ?? t("transversalPages")
          : nc.thematic
            ? `${nc.thematic.identifier} · ${nc.thematic.name}`
            : tSort("noThematic");
      const last = groups[groups.length - 1];
      if (last && last.key === key) {
        last.items.push(nc);
      } else {
        groups.push({ key, label, items: [nc] });
      }
    }
    return groups;
  }, [sorted, sort, t, tSort]);

  const isGrouped = sort === "BY_PAGE" || sort === "BY_THEMATIC";

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function checkAllOpen() {
    setChecked(new Set(allNCs.map((nc) => nc.id)));
  }
  function checkBySeverity(sev: NCSeverity) {
    const next = new Set<string>(initialChecked);
    for (const nc of allNCs) if (nc.severity === sev) next.add(nc.id);
    setChecked(next);
  }
  function resetSimulation() {
    setChecked(new Set(initialChecked));
  }
  function resetFilters() {
    setSearch("");
    setSeverity("ALL");
    setStatus("ALL");
    setPageFilter("ALL");
    setThematicFilter("ALL");
    setSort("SEVERITY_DESC");
  }

  const hasActiveFilters =
    search.trim() !== "" ||
    severity !== "ALL" ||
    status !== "ALL" ||
    pageFilter !== "ALL" ||
    thematicFilter !== "ALL";

  return (
    <div className="flex flex-col gap-4">
      {/* Synthese : jauge, gain et selections rapides --------------------- */}
      <section
        aria-live="polite"
        className="grid gap-6 rounded-card bg-ink p-5 text-ink-foreground sm:grid-cols-[220px_minmax(0,1fr)] sm:items-center"
      >
        <svg
          width="220"
          height="130"
          viewBox="0 0 220 130"
          role="img"
          aria-label={t("gaugeAria", {
            simulated: Math.round(simulatedScore),
            initial: Math.round(initialScore),
          })}
          className="mx-auto"
        >
          <path
            d="M20 118 A90 90 0 0 1 200 118"
            fill="none"
            stroke="hsl(var(--ink-surface-raised))"
            strokeWidth="18"
            strokeLinecap="round"
          />
          <path
            d="M20 118 A90 90 0 0 1 200 118"
            fill="none"
            stroke="hsl(var(--ink-positive))"
            strokeWidth="18"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={100}
            strokeDashoffset={100 - Math.round(simulatedScore)}
            style={{
              transition: "stroke-dashoffset 600ms cubic-bezier(.2,.8,.2,1)",
            }}
          />
          <path
            d="M20 118 A90 90 0 0 1 200 118"
            fill="none"
            stroke="hsl(var(--highlight))"
            strokeWidth="18"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={100}
            strokeDashoffset={100 - Math.round(initialScore)}
          />
          <text
            x="110"
            y="112"
            textAnchor="middle"
            fill="currentColor"
            style={{ font: "900 38px Figtree, sans-serif" }}
          >
            {Math.round(simulatedScore)}%
          </text>
        </svg>

        <div className="min-w-0">
          <p className="text-base font-semibold text-ink-muted">
            {t("title")}
          </p>
          <p className="mt-1.5 text-2xl font-black leading-tight tracking-tight md:text-[1.875rem]">
            {checked.size === 0
              ? t("headlineEmpty")
              : t("headline", {
                  points: delta.toFixed(delta % 1 === 0 ? 0 : 2),
                  count: fixedCells,
                })}
          </p>
          <p className="mt-2 text-sm text-ink-muted">
            {t("summary", {
              initial: Math.round(initialScore),
              simulated: Math.round(simulatedScore),
              total: denominator,
            })}
          </p>

          <div className="mt-3.5 flex flex-wrap gap-2">
            <InkChip onClick={() => checkBySeverity("CRITICAL")}>
              {t("criticalOnly")}
            </InkChip>
            <InkChip onClick={() => checkBySeverity("HIGH")}>
              {t("highOnly")}
            </InkChip>
            <InkChip onClick={checkAllOpen}>
              {t("checkAll", { count: allNCs.length })}
            </InkChip>
            <InkChip onClick={resetSimulation}>
              <RotateCcw className="size-3.5" aria-hidden="true" />
              {t("reset")}
            </InkChip>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-warning-text" aria-hidden="true" />
            {t("ncsTitle")}
          </CardTitle>
          <CardDescription>
            {t("ncsSubtitle", {
              checked: checked.size,
              total: allNCs.length,
              plural: checked.size > 1 ? "s" : "",
            })}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 border-b pb-4">
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="pl-9"
                aria-label={t("searchAria")}
              />
            </div>
            <Select value={sort} onValueChange={(v) => setSort(v as SortMode)}>
              <SelectTrigger className="sm:w-[220px]" aria-label={t("sortAria")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_KEYS.map((k) => (
                  <SelectItem key={k} value={k}>
                    {tSort(k)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Select
              value={severity}
              onValueChange={(v) => setSeverity(v as SeverityFilter)}
            >
              <SelectTrigger aria-label={t("filterSeverityAria")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("allSeverities")}</SelectItem>
                <SelectItem value="CRITICAL">{tSeverity("CRITICAL")}</SelectItem>
                <SelectItem value="HIGH">{tSeverity("HIGH")}</SelectItem>
                <SelectItem value="MEDIUM">{tSeverity("MEDIUM")}</SelectItem>
                <SelectItem value="LOW">{tSeverity("LOW")}</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={status}
              onValueChange={(v) => setStatus(v as StatusFilter)}
            >
              <SelectTrigger aria-label={t("filterStatusAria")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTER_KEYS.map((k) => (
                  <SelectItem key={k} value={k}>
                    {tSort(k)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={pageFilter}
              onValueChange={(v) => setPageFilter(v as PageFilter)}
            >
              <SelectTrigger aria-label={t("filterPageAria")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("allPages")}</SelectItem>
                <SelectItem value="TRANSVERSAL">{t("transversalPages")}</SelectItem>
                {auditPages.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={thematicFilter}
              onValueChange={(v) => setThematicFilter(v as ThematicFilter)}
            >
              <SelectTrigger aria-label={t("filterThematicAria")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("allThematics")}</SelectItem>
                {referenceThematics.map((tm) => (
                  <SelectItem key={tm.id} value={tm.id}>
                    {tm.identifier} · {tm.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              <strong className="font-medium text-foreground">
                {filtered.length}
              </strong>{" "}
              / {allNCs.length}{" "}
              {t("ncCountShown", { plural: filtered.length > 1 ? "s" : "" })}
            </span>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-7 gap-1 text-xs"
              >
                {t("resetFilters")}
              </Button>
            )}
          </div>
        </CardContent>

        <CardContent className="space-y-2 pt-4">
          {filtered.length === 0 ? (
            <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              {allNCs.length === 0 ? t("emptyAll") : t("emptyFilters")}
            </p>
          ) : (
            grouped.map((group) => (
              <div key={group.key} className="space-y-2">
                {isGrouped && group.label && (
                  <h3 className="mt-2 flex items-center gap-2 border-b border-border pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {sort === "BY_PAGE" ? (
                      <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : null}
                    {group.label}
                    <span className="font-normal normal-case tracking-normal">
                      ({group.items.length})
                    </span>
                  </h3>
                )}
                {group.items.map((nc) => (
                  <NCRow
                    key={nc.id}
                    nc={nc}
                    isChecked={checked.has(nc.id)}
                    onToggle={() => toggle(nc.id)}
                  />
                ))}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <aside className="flex flex-col gap-3 rounded-card border border-border bg-card p-5">
        <h2 className="text-base font-extrabold">{t("thematicTitle")}</h2>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-2 w-3 rounded-full bg-border-strong"
            />
            {t("thematicLegendOpen")}
          </span>
          <span className="inline-flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-2 w-3 rounded-full bg-success"
            />
            {t("thematicLegendSelected")}
          </span>
        </p>

        {thematicEffect.length === 0 ? (
          <p className="text-sm italic text-muted-foreground">
            {t("thematicEmpty")}
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {thematicEffect.map((row) => (
              <li
                key={row.key}
                className="grid grid-cols-[26px_minmax(0,1fr)_auto] items-center gap-2.5 rounded-lg px-1 py-1.5 transition-colors hover:bg-primary-softer"
              >
                <span
                  aria-hidden="true"
                  className="flex size-[26px] items-center justify-center rounded-lg text-[0.7rem] font-black tabular text-white"
                  style={{ background: row.color }}
                >
                  {row.identifier}
                </span>
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="truncate text-sm font-bold">{row.name}</span>
                  <span
                    role="img"
                    aria-label={t("thematicBarAria", {
                      selected: row.selected,
                      total: row.total,
                      name: row.name,
                    })}
                    className="block h-2 overflow-hidden rounded-full bg-border-strong"
                  >
                    <span
                      className="block h-full rounded-full bg-success transition-[width] duration-500"
                      style={{
                        width: `${Math.round((row.selected / row.total) * 100)}%`,
                      }}
                    />
                  </span>
                </span>
                <span className="text-sm font-extrabold tabular">
                  {row.selected} / {row.total}
                </span>
              </li>
            ))}
          </ul>
        )}
      </aside>
      </div>
    </div>
  );
}

/** Pilule d'action posee sur une carte encre. */
function InkChip({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 items-center gap-2 rounded-full border border-ink-raised px-3.5 text-sm font-bold text-ink-foreground transition-colors duration-150 hover:bg-ink-raised"
    >
      {children}
    </button>
  );
}

function NCRow({
  nc,
  isChecked,
  onToggle,
}: {
  nc: SimulatorNC;
  isChecked: boolean;
  onToggle: () => void;
}) {
  const t = useTranslations("audits.simulator");
  const isFixed = nc.isFixed;
  const thematicColor = nc.thematic
    ? themeColorForIdentifier(nc.thematic.identifier)
    : "hsl(var(--muted-foreground))";

  return (
    <label
      className={cn(
        "group grid cursor-pointer grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-3.5 rounded-row px-3.5 py-2.5",
        "transition-colors duration-150",
        isFixed && "text-muted-foreground",
        !isFixed && isChecked && "bg-success/8",
        !isFixed && !isChecked && "hover:bg-primary-softer",
      )}
    >
      <Switch
        checked={isChecked}
        onChange={onToggle}
        aria-label={t("simulateAria", {
          identifier: nc.criterion.identifier,
          title: nc.title,
        })}
      />

      <span
        className="inline-flex items-center rounded-md px-2 py-1 text-xs font-extrabold tabular text-white"
        style={{ background: thematicColor }}
      >
        {nc.criterion.identifier}
      </span>

      <span className="min-w-0">
        <span
          className={cn(
            "block truncate font-bold",
            isFixed && "line-through",
            !isFixed && isChecked && "text-muted-foreground line-through",
          )}
        >
          {nc.title}
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            {nc.page ? (
              <>
                <FileText className="size-3.5 shrink-0" aria-hidden="true" />
                {nc.page.name}
              </>
            ) : (
              t("transversal")
            )}
          </span>
          {isFixed && (
            <span className="font-bold text-success-text">{t("alreadyFixed")}</span>
          )}
        </span>
      </span>

      <span className="flex shrink-0 items-center gap-3">
        <SeverityBadge severity={nc.severity} />
        <span
          aria-hidden="true"
          className={cn(
            "hidden w-20 text-right text-sm font-extrabold text-success-text transition-opacity duration-200 sm:block",
            isChecked && !isFixed ? "opacity-100" : "opacity-0",
          )}
        >
          {t("gain")}
        </span>
      </span>
    </label>
  );
}
