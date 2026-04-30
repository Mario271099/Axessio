"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, FileText, AlertTriangle, ListFilter } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SeverityBadge } from "@/components/audit/severity-badge";
import {
  calculateScore,
  getConformityLabel,
  getConformityLevel,
  getScoreColorVar,
} from "@/lib/score";
import { NC_SEVERITY_ORDER } from "@/lib/constants";
import { cn, formatScore } from "@/lib/utils";
import type { NCSeverity, NonConformityEnriched } from "@/types/domain";

interface RemediationSimulatorProps {
  /** Non-conformités OUVERTES (statut OPEN, IN_PROGRESS, etc.) à simuler. */
  openNCs: NonConformityEnriched[];
  /** Nombre de critères évalués sur l'audit. */
  totalCriteria: number;
  /** Nombre de critères conformes au moment du calcul. */
  initialCompliant: number;
  /** Nombre de critères non applicables. */
  notApplicable: number;
  /** Nombre de critères qui passent de NON_COMPLIANT à COMPLIANT si l'utilisateur coche TOUTES les NC liées à ce critère. */
  fixableCriteriaPerNC: Record<string /* ncId */, string /* criteriaId */>;
}

/**
 * Simulateur de remédiation.
 *
 * L'utilisateur coche des NC virtuellement → on calcule le score "si elles
 * étaient corrigées". Aucune persistance, c'est un outil d'aide à la décision.
 *
 * Règle métier : un critère devient `COMPLIANT` UNIQUEMENT si TOUTES les NC
 * qui pèsent dessus sont cochées comme corrigées.
 */
export function RemediationSimulator({
  openNCs,
  totalCriteria,
  initialCompliant,
  notApplicable,
  fixableCriteriaPerNC,
}: RemediationSimulatorProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  // ---------- Calculs ---------------------------------------------------------
  const initialScore = useMemo(
    () =>
      calculateScore({
        compliant: initialCompliant,
        notApplicable,
        totalCriteria,
      }),
    [initialCompliant, notApplicable, totalCriteria],
  );

  /** Critères pour lesquels TOUTES les NC sont cochées comme corrigées. */
  const fullyFixedCriteria = useMemo(() => {
    // 1. Liste des NC par critère
    const ncsPerCriterion: Record<string, string[]> = {};
    for (const nc of openNCs) {
      const critId = fixableCriteriaPerNC[nc.id] ?? nc.criterion.id;
      if (!ncsPerCriterion[critId]) ncsPerCriterion[critId] = [];
      ncsPerCriterion[critId].push(nc.id);
    }
    // 2. Critères 100% cochés
    return Object.entries(ncsPerCriterion).filter(([, ncs]) =>
      ncs.every((id) => checked.has(id)),
    ).length;
  }, [openNCs, checked, fixableCriteriaPerNC]);

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

  // ---------- NC groupées par sévérité (pour l'affichage) ---------------------
  const sortedNCs = useMemo(
    () =>
      [...openNCs].sort((a, b) => {
        const order = NC_SEVERITY_ORDER[a.severity] - NC_SEVERITY_ORDER[b.severity];
        if (order !== 0) return order;
        return a.criterion.identifier.localeCompare(b.criterion.identifier);
      }),
    [openNCs],
  );

  // ---------- Actions ---------------------------------------------------------
  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function checkAll() {
    setChecked(new Set(openNCs.map((nc) => nc.id)));
  }
  function clearAll() {
    setChecked(new Set());
  }
  function checkBySeverity(sev: NCSeverity) {
    setChecked(new Set(openNCs.filter((nc) => nc.severity === sev).map((nc) => nc.id)));
  }

  const conformityLevel = getConformityLevel(simulatedScore);

  // ---------- Render ----------------------------------------------------------
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
            <CardDescription className="text-primary">Score simulé</CardDescription>
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
              <CheckCircle2 className="h-3.5 w-3.5" />
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
              <ListFilter className="h-4 w-4" />
              Sélection rapide
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button onClick={checkAll} variant="outline" size="sm">
              Tout cocher ({openNCs.length})
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
            <Button onClick={clearAll} variant="ghost" size="sm">
              Tout décocher
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Liste des NC à simuler --------------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-warning" />
            Non-conformités à simuler comme corrigées
          </CardTitle>
          <CardDescription>
            {checked.size} cochée{checked.size > 1 ? "s" : ""} sur {openNCs.length}.
            Aucune modification n&apos;est enregistrée.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {sortedNCs.length === 0 ? (
            <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              Aucune non-conformité ouverte sur cet audit.
            </p>
          ) : (
            sortedNCs.map((nc) => {
              const isChecked = checked.has(nc.id);
              return (
                <label
                  key={nc.id}
                  className={cn(
                    "group flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 transition-colors",
                    isChecked
                      ? "border-success/40 bg-success/5"
                      : "hover:bg-accent/50",
                  )}
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => toggle(nc.id)}
                    aria-label={`Simuler la correction de la non-conformité ${nc.criterion.identifier} : ${nc.title}`}
                  />
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                          {nc.criterion.identifier}
                        </span>
                        <SeverityBadge severity={nc.severity} />
                      </div>
                      {nc.page && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <FileText className="h-3 w-3" />
                          {nc.page.name}
                        </span>
                      )}
                      {!nc.page && (
                        <span className="text-xs text-muted-foreground">
                          Transversale
                        </span>
                      )}
                    </div>
                    <p
                      className={cn(
                        "text-sm",
                        isChecked && "text-muted-foreground line-through",
                      )}
                    >
                      {nc.title}
                    </p>
                    {nc.description && (
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {nc.description}
                      </p>
                    )}
                  </div>
                </label>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
