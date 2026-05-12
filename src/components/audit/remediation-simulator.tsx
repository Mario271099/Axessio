"use client";

import { useMemo, useState } from "react";
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
import { NC_CLOSED_STATUSES, NC_SEVERITY_ORDER } from "@/lib/constants";
import { cn, formatScore } from "@/lib/utils";
import type { NCSeverity, NCStatus } from "@/types/domain";

// ============================================================================
// Types exposés (consommés par page.tsx)
// ============================================================================

export interface SimulatorNC {
  id: string;
  criteriaId: string;
  title: string;
  description: string | null;
  severity: NCSeverity;
  status: NCStatus;
  /** Vrai si la NC est déjà fermée en base (CORRECTED / RESOLVED / NON_REPRODUCIBLE). */
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

// ============================================================================
// États de filtre / tri
// ============================================================================

type SeverityFilter = "ALL" | NCSeverity;
type StatusFilter = "ALL" | "TODO" | "IN_PROGRESS" | "FIXED" | "FALSE_POSITIVE";
type PageFilter = "ALL" | "TRANSVERSAL" | string; // sinon = pageId
type ThematicFilter = "ALL" | string;
type SortMode =
  | "SEVERITY_DESC"
  | "SEVERITY_ASC"
  | "BY_PAGE"
  | "BY_THEMATIC"
  | "BY_CRITERION";

const STATUS_FILTER_LABELS: Record<StatusFilter, string> = {
  ALL: "Tous les statuts",
  TODO: "À corriger",
  IN_PROGRESS: "En cours",
  FIXED: "Corrigée",
  FALSE_POSITIVE: "Faux positif",
};

const STATUS_FILTER_TO_DB: Record<StatusFilter, NCStatus[] | null> = {
  ALL: null,
  TODO: ["OPEN"],
  IN_PROGRESS: ["IN_PROGRESS"],
  FIXED: ["CORRECTED", "RESOLVED"],
  FALSE_POSITIVE: ["NON_REPRODUCIBLE", "REJECTED", "CANCELLED"],
};

const SORT_LABELS: Record<SortMode, string> = {
  SEVERITY_DESC: "Sévérité (décroissante)",
  SEVERITY_ASC: "Sévérité (croissante)",
  BY_PAGE: "Grouper par page",
  BY_THEMATIC: "Grouper par thématique",
  BY_CRITERION: "Numéro de critère",
};

interface RemediationSimulatorProps {
  allNCs: SimulatorNC[];
  auditPages: SimulatorPage[];
  referenceThematics: SimulatorThematic[];
  totalCriteria: number;
  initialCompliant: number;
  notApplicable: number;
  fixableCriteriaPerNC: Record<string, string>;
}

export function RemediationSimulator({
  allNCs,
  auditPages,
  referenceThematics,
  totalCriteria,
  initialCompliant,
  notApplicable,
  fixableCriteriaPerNC,
}: RemediationSimulatorProps) {
  // Initial : toutes les NC déjà fermées en base sont pré-cochées.
  const initialChecked = useMemo(
    () => new Set(allNCs.filter((n) => n.isFixed).map((n) => n.id)),
    [allNCs],
  );
  const [checked, setChecked] = useState<Set<string>>(initialChecked);

  // ---------- Filtres ---------------------------------------------------------
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState<SeverityFilter>("ALL");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [pageFilter, setPageFilter] = useState<PageFilter>("ALL");
  const [thematicFilter, setThematicFilter] = useState<ThematicFilter>("ALL");
  const [sort, setSort] = useState<SortMode>("SEVERITY_DESC");

  // ---------- Score : seules les NC ouvertes virtuellement cochées comptent --
  // (les FIXED sont déjà reflétées dans initialCompliant)
  const fullyFixedCriteria = useMemo(() => {
    const ncsPerCriterion: Record<string, string[]> = {};
    for (const nc of allNCs) {
      if (nc.isFixed) continue;
      const critId = fixableCriteriaPerNC[nc.id] ?? nc.criterion.id;
      if (!ncsPerCriterion[critId]) ncsPerCriterion[critId] = [];
      ncsPerCriterion[critId].push(nc.id);
    }
    return Object.entries(ncsPerCriterion).filter(([, ncs]) =>
      ncs.every((id) => checked.has(id)),
    ).length;
  }, [allNCs, checked, fixableCriteriaPerNC]);

  const initialScore = useMemo(
    () =>
      calculateScore({
        compliant: initialCompliant,
        notApplicable,
        totalCriteria,
      }),
    [initialCompliant, notApplicable, totalCriteria],
  );

  const simulatedScore = useMemo(
    () =>
      calculateScore({
        compliant: initialCompliant + fullyFixedCriteria,
        notApplicable,
        totalCriteria,
      }),
    [initialCompliant, fullyFixedCriteria, notApplicable, totalCriteria],
  );

  const delta = +(simulatedScore - initialScore).toFixed(2);
  const conformityLevel = getConformityLevel(simulatedScore);

  // ---------- Liste filtrée + triée -----------------------------------------
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

  // Regroupement quand on trie par page / thématique
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
          ? nc.page?.name ?? "Transversales"
          : nc.thematic
            ? `${nc.thematic.identifier} · ${nc.thematic.name}`
            : "Sans thématique";
      const last = groups[groups.length - 1];
      if (last && last.key === key) {
        last.items.push(nc);
      } else {
        groups.push({ key, label, items: [nc] });
      }
    }
    return groups;
  }, [sorted, sort]);

  const isGrouped = sort === "BY_PAGE" || sort === "BY_THEMATIC";

  // ---------- Actions --------------------------------------------------------
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
  /** Réinitialise : seules les NC déjà FIXED en base restent cochées. */
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

  // ---------- Render ---------------------------------------------------------
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
      {/* Panneau de scoring ------------------------------------------------- */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Score initial</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {formatScore(initialScore)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {initialCompliant} / {totalCriteria - notApplicable} critères conformes
            </p>
          </CardContent>
        </Card>

        <Card
          aria-live="polite"
          className="border-primary/40 ring-1 ring-primary/20"
        >
          <CardHeader className="pb-3">
            <CardDescription className="text-primary">
              Score simulé
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
              aria-label={`Score simulé : ${simulatedScore}%`}
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
              <span>
                {fullyFixedCriteria} critère{fullyFixedCriteria !== 1 ? "s" : ""}{" "}
                supplémentaire{fullyFixedCriteria !== 1 ? "s" : ""} conforme
                {fullyFixedCriteria !== 1 ? "s" : ""}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <ListFilter className="h-4 w-4" aria-hidden="true" />
              Sélection rapide
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button onClick={checkAllOpen} variant="outline" size="sm">
              Tout cocher ({allNCs.length})
            </Button>
            <Button
              onClick={() => checkBySeverity("CRITICAL")}
              variant="outline"
              size="sm"
            >
              Critiques uniquement
            </Button>
            <Button
              onClick={() => checkBySeverity("HIGH")}
              variant="outline"
              size="sm"
            >
              Hautes uniquement
            </Button>
            <Button
              onClick={resetSimulation}
              variant="ghost"
              size="sm"
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Réinitialiser
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Liste des NC à simuler --------------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-warning" aria-hidden="true" />
            Non-conformités à simuler comme corrigées
          </CardTitle>
          <CardDescription>
            {checked.size} cochée{checked.size > 1 ? "s" : ""} sur {allNCs.length}.
            Aucune modification n&apos;est enregistrée.
          </CardDescription>
        </CardHeader>

        {/* Barre de filtres -------------------------------------------------- */}
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
                placeholder="Rechercher dans le titre…"
                className="pl-9"
                aria-label="Rechercher dans le titre des non-conformités"
              />
            </div>
            <Select
              value={sort}
              onValueChange={(v) => setSort(v as SortMode)}
            >
              <SelectTrigger
                className="sm:w-[220px]"
                aria-label="Trier par"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SORT_LABELS) as SortMode[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {SORT_LABELS[k]}
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
              <SelectTrigger aria-label="Filtrer par sévérité">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Toutes sévérités</SelectItem>
                <SelectItem value="CRITICAL">Critique</SelectItem>
                <SelectItem value="HIGH">Haute</SelectItem>
                <SelectItem value="MEDIUM">Moyenne</SelectItem>
                <SelectItem value="LOW">Faible</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={status}
              onValueChange={(v) => setStatus(v as StatusFilter)}
            >
              <SelectTrigger aria-label="Filtrer par statut">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(STATUS_FILTER_LABELS) as StatusFilter[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {STATUS_FILTER_LABELS[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={pageFilter}
              onValueChange={(v) => setPageFilter(v as PageFilter)}
            >
              <SelectTrigger aria-label="Filtrer par page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Toutes les pages</SelectItem>
                <SelectItem value="TRANSVERSAL">Transversales</SelectItem>
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
              <SelectTrigger aria-label="Filtrer par thématique">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Toutes thématiques</SelectItem>
                {referenceThematics.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.identifier} · {t.name}
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
              / {allNCs.length} NC affichée{filtered.length > 1 ? "s" : ""}
            </span>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-7 gap-1 text-xs"
              >
                Réinitialiser les filtres
              </Button>
            )}
          </div>
        </CardContent>

        {/* Liste -------------------------------------------------------------- */}
        <CardContent className="space-y-2 pt-4">
          {filtered.length === 0 ? (
            <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              {allNCs.length === 0
                ? "Aucune non-conformité sur cet audit."
                : "Aucune non-conformité ne correspond aux filtres."}
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

// ============================================================================
// Ligne de NC
// ============================================================================
function NCRow({
  nc,
  isChecked,
  onToggle,
}: {
  nc: SimulatorNC;
  isChecked: boolean;
  onToggle: () => void;
}) {
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
        aria-label={`Simuler la correction de ${nc.criterion.identifier} : ${nc.title}`}
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
              Déjà corrigée
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
              "Transversale"
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
