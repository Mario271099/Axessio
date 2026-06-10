"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  CheckCircle2,
  FileText,
  AlertTriangle,
  ListFilter,
  Search,
  RotateCcw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SeverityBadge } from "@/components/audit/severity-badge";
import {
  calculateScore,
  getConformityLabel,
  getConformityLevel,
  getScoreColorVar,
} from "@/lib/score";
import { NC_SEVERITY_ORDER } from "@/lib/constants";
import { cn, formatScore } from "@/lib/utils";
import type { NCSeverity, NCStatus } from "@/types/domain";

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
  /** Cellules COMPLIANT de page_conformities (numérateur du score). */
  compliantCount: number;
  /** Cellules NON_COMPLIANT (le reste du dénominateur). */
  nonCompliantCount: number;
  /** Clés `${pageId}::${criteriaId}` des cellules actuellement NON_COMPLIANT. */
  nonCompliantCells: string[];
}

export function RemediationSimulator({
  allNCs,
  auditPages,
  referenceThematics,
  compliantCount,
  nonCompliantCount,
  nonCompliantCells,
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

  const nonCompliantCellSet = useMemo(
    () => new Set(nonCompliantCells),
    [nonCompliantCells],
  );

  // Une non-conformité correspond à une cellule (page × critère) de la
  // matrice. La même cellule peut porter plusieurs NC : elle ne (re)devient
  // conforme que lorsque TOUTES ses NC sont corrigées. On ne fait basculer
  // que des cellules réellement NON_COMPLIANT (les transversales sans cellule
  // ou les cellules déjà conformes n'influent pas sur le score, comme dans la
  // RPC audit_current_score).
  const fixedCells = useMemo(() => {
    const ncsPerCell: Record<string, string[]> = {};
    for (const nc of allNCs) {
      if (nc.isFixed) continue;
      const cellKey = `${nc.page?.id ?? "transversal"}::${nc.criteriaId}`;
      if (!nonCompliantCellSet.has(cellKey)) continue;
      (ncsPerCell[cellKey] ??= []).push(nc.id);
    }
    return Object.values(ncsPerCell).filter((ncs) =>
      ncs.every((id) => checked.has(id)),
    ).length;
  }, [allNCs, checked, nonCompliantCellSet]);

  // Dénominateur constant (COMPLIANT + NON_COMPLIANT) : corriger une NC
  // déplace une cellule de non_compliant vers compliant sans changer le total.
  const denominator = compliantCount + nonCompliantCount;

  const initialScore = useMemo(
    () =>
      calculateScore({
        compliant: compliantCount,
        notApplicable: 0,
        totalCriteria: denominator,
      }),
    [compliantCount, denominator],
  );

  const simulatedScore = useMemo(
    () =>
      calculateScore({
        compliant: compliantCount + fixedCells,
        notApplicable: 0,
        totalCriteria: denominator,
      }),
    [compliantCount, fixedCells, denominator],
  );

  const delta = +(simulatedScore - initialScore).toFixed(2);
  const conformityLevel = getConformityLevel(simulatedScore);

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
    <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>{t("initialScore")}</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {formatScore(initialScore)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {t("criteriaCompliant", {
                compliant: compliantCount,
                total: denominator,
              })}
            </p>
          </CardContent>
        </Card>

        <Card
          aria-live="polite"
          className="border-primary/40 ring-1 ring-primary/20"
        >
          <CardHeader className="pb-3">
            <CardDescription className="text-primary">
              {t("simulatedScore")}
            </CardDescription>
            <CardTitle
              className="text-4xl font-bold tabular-nums"
              style={{ color: `hsl(${getScoreColorVar(simulatedScore)})` }}
            >
              {formatScore(simulatedScore)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress
              value={simulatedScore}
              fillColor={getScoreColorVar(simulatedScore)}
              aria-label={t("simulatedAria", { score: simulatedScore })}
            />
            <div className="flex items-center justify-between text-xs">
              <span
                className={cn(
                  "font-medium",
                  conformityLevel === "non-compliant" && "text-destructive",
                  conformityLevel === "partial" && "text-warning",
                  conformityLevel === "full" && "text-success",
                )}
              >
                {getConformityLabel(simulatedScore)}
              </span>
              <span
                className={cn(
                  "tabular-nums font-medium",
                  delta > 0 && "text-success",
                  delta < 0 && "text-destructive",
                )}
              >
                {delta > 0 ? "+" : ""}
                {delta.toFixed(2)} pts
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t("extraCompliant", { count: fixedCells })}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <ListFilter className="h-4 w-4" aria-hidden="true" />
              {t("quickSelect")}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button onClick={checkAllOpen} variant="outline" size="sm">
              {t("checkAll", { count: allNCs.length })}
            </Button>
            <Button
              onClick={() => checkBySeverity("CRITICAL")}
              variant="outline"
              size="sm"
            >
              {t("criticalOnly")}
            </Button>
            <Button
              onClick={() => checkBySeverity("HIGH")}
              variant="outline"
              size="sm"
            >
              {t("highOnly")}
            </Button>
            <Button
              onClick={resetSimulation}
              variant="ghost"
              size="sm"
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              {t("reset")}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-warning" aria-hidden="true" />
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
    </div>
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
  return (
    <label
      className={cn(
        "group flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 transition-colors",
        isFixed && "bg-muted/40 text-muted-foreground",
        !isFixed && isChecked && "border-success/40 bg-success/5",
        !isFixed && !isChecked && "hover:bg-accent/50",
      )}
    >
      <Checkbox
        checked={isChecked}
        onCheckedChange={onToggle}
        aria-label={t("simulateAria", {
          identifier: nc.criterion.identifier,
          title: nc.title,
        })}
      />
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded bg-muted px-1.5 py-0.5 font-mono text-xs",
              isFixed ? "text-muted-foreground" : "text-muted-foreground",
            )}
          >
            {nc.criterion.identifier}
          </span>
          <SeverityBadge severity={nc.severity} />
          {isFixed && (
            <span className="rounded bg-success/10 px-1.5 py-0.5 text-xs font-medium text-success">
              {t("alreadyFixed")}
            </span>
          )}
          <span
            className={cn(
              "ml-auto flex items-center gap-1 text-xs",
              isFixed ? "text-muted-foreground/80" : "text-muted-foreground",
            )}
          >
            {nc.page ? (
              <>
                <FileText className="h-3 w-3" aria-hidden="true" />
                {nc.page.name}
              </>
            ) : (
              t("transversal")
            )}
          </span>
        </div>
        <p
          className={cn(
            "text-sm",
            isFixed && "line-through",
            !isFixed && isChecked && "text-muted-foreground line-through",
          )}
        >
          {nc.title}
        </p>
        {nc.description && (
          <p
            className={cn(
              "line-clamp-2 text-xs",
              isFixed ? "text-muted-foreground/80" : "text-muted-foreground",
            )}
          >
            {nc.description}
          </p>
        )}
      </div>
    </label>
  );
}
