"use client";

import { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatScore } from "@/lib/utils";
import {
  calculateScore,
  getConformityLabel,
  getScoreColorVar,
} from "@/lib/score";
import { ThematicSection, type MatrixFilter } from "./thematic-section";
import type {
  AuditPage,
  ConformityStatus,
  Criterion,
  Thematic,
} from "@/types/domain";

interface Props {
  page: AuditPage;
  thematics: Thematic[];
  criteria: Criterion[];
  conformityMap: Map<string, ConformityStatus>;
  currentPageId: string;
  canEdit: boolean;
  onSetStatus: (criteriaId: string, status: ConformityStatus | null) => void;
  onNonCompliantClick: (criterion: Criterion) => void;
  onBulkThematic: (thematicId: string, status: ConformityStatus) => void;
  onClearThematic: (thematicId: string) => void;
  onAccordionClose: () => void;
  isProcessing: boolean;
}

interface FilterOption {
  value: MatrixFilter;
  label: string;
}

const FILTER_OPTIONS: FilterOption[] = [
  { value: "ALL", label: "Tout" },
  { value: "PENDING", label: "À saisir" },
  { value: "COMPLIANT", label: "Conformes" },
  { value: "NON_COMPLIANT", label: "Non conformes" },
  { value: "NOT_APPLICABLE", label: "Non applicables" },
];

export function PageMatrixContent({
  page,
  thematics,
  criteria,
  conformityMap,
  currentPageId,
  canEdit,
  onSetStatus,
  onNonCompliantClick,
  onBulkThematic,
  onClearThematic,
  onAccordionClose,
  isProcessing,
}: Props) {
  const [filter, setFilter] = useState<MatrixFilter>("ALL");
  const [openThematics, setOpenThematics] = useState<string[]>([]);

  // Score de la page courante
  const score = useMemo(() => {
    let compliant = 0;
    let notApplicable = 0;
    for (const c of criteria) {
      const status = conformityMap.get(`${currentPageId}:${c.id}`);
      if (status === "COMPLIANT") compliant += 1;
      else if (status === "NOT_APPLICABLE") notApplicable += 1;
    }
    return {
      value: calculateScore({
        compliant,
        notApplicable,
        totalCriteria: criteria.length,
      }),
      compliant,
      notApplicable,
    };
  }, [criteria, conformityMap, currentPageId]);

  // Compteurs par filtre (pour les badges)
  const counters = useMemo(() => {
    let pending = 0;
    let compliant = 0;
    let nonCompliant = 0;
    let notApplicable = 0;
    for (const c of criteria) {
      const status = conformityMap.get(`${currentPageId}:${c.id}`);
      if (!status) pending += 1;
      else if (status === "COMPLIANT") compliant += 1;
      else if (status === "NON_COMPLIANT") nonCompliant += 1;
      else if (status === "NOT_APPLICABLE") notApplicable += 1;
    }
    return {
      ALL: criteria.length,
      PENDING: pending,
      COMPLIANT: compliant,
      NON_COMPLIANT: nonCompliant,
      NOT_APPLICABLE: notApplicable,
    } as const;
  }, [criteria, conformityMap, currentPageId]);

  const evaluated = score.compliant + score.notApplicable;
  const applicable = criteria.length - score.notApplicable;

  // Détecte la fermeture d'un accordéon
  const handleAccordionChange = (value: string[]) => {
    const wasOpen = openThematics;
    const closed = wasOpen.filter((v) => !value.includes(v));
    setOpenThematics(value);
    if (closed.length > 0) {
      onAccordionClose();
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête : titre + URL ------------------------------------------- */}
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Page sélectionnée
        </p>
        <h2 className="text-xl font-semibold tracking-tight">{page.name}</h2>
        {page.url && (
          <a
            href={page.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            {page.url}
          </a>
        )}
      </header>

      {/* Score de la page ------------------------------------------------ */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span
            className="text-4xl font-bold tabular-nums"
            style={{ color: `hsl(${getScoreColorVar(score.value)})` }}
          >
            {formatScore(score.value)}
          </span>
          <span className="text-sm font-medium text-muted-foreground">
            Score de la page · {getConformityLabel(score.value)}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {evaluated} critère{evaluated > 1 ? "s" : ""} évalué
          {evaluated > 1 ? "s" : ""} sur {applicable} applicable
          {applicable > 1 ? "s" : ""} ({criteria.length} au total ·{" "}
          {score.notApplicable} non applicable
          {score.notApplicable > 1 ? "s" : ""})
        </p>
      </div>

      {/* Filtres --------------------------------------------------------- */}
      <div
        role="radiogroup"
        aria-label="Filtrer les critères"
        className="flex flex-wrap gap-2"
      >
        {FILTER_OPTIONS.map((opt) => {
          const isActive = filter === opt.value;
          const count = counters[opt.value];
          return (
            <Button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(opt.value)}
              className={cn(
                "gap-2",
                isActive && "shadow-sm",
              )}
            >
              {opt.label}
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-[11px] font-mono tabular-nums",
                  isActive
                    ? "bg-primary-foreground/15 text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {count}
              </span>
            </Button>
          );
        })}
      </div>

      {/* Accordéons des thématiques ------------------------------------- */}
      <Accordion
        type="multiple"
        value={openThematics}
        onValueChange={handleAccordionChange}
        className="space-y-2"
      >
        {thematics.map((thematic) => {
          const thematicCriteria = criteria.filter(
            (c) => c.thematicId === thematic.id,
          );
          return (
            <ThematicSection
              key={thematic.id}
              thematic={thematic}
              criteria={thematicCriteria}
              pageId={currentPageId}
              conformityMap={conformityMap}
              filter={filter}
              canEdit={canEdit}
              isProcessing={isProcessing}
              onSetStatus={onSetStatus}
              onNonCompliantClick={onNonCompliantClick}
              onBulkSetNotApplicable={() =>
                onBulkThematic(thematic.id, "NOT_APPLICABLE")
              }
              onClear={() => onClearThematic(thematic.id)}
            />
          );
        })}
      </Accordion>
    </div>
  );
}
