"use client";

import { useMemo } from "react";
import { ExternalLink } from "lucide-react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ConformityCell } from "./conformity-cell";
import type {
  ConformityStatus,
  Criterion,
  Thematic,
} from "@/types/domain";

export type MatrixFilter =
  | "ALL"
  | "PENDING"
  | "COMPLIANT"
  | "NON_COMPLIANT"
  | "NOT_APPLICABLE";

interface Props {
  thematic: Thematic;
  criteria: Criterion[];
  pageId: string;
  conformityMap: Map<string, ConformityStatus>;
  filter: MatrixFilter;
  canEdit: boolean;
  onSetStatus: (criteriaId: string, status: ConformityStatus | null) => void;
  onNonCompliantClick: (criterion: Criterion) => void;
  onBulkSetNotApplicable: () => void;
  onClear: () => void;
  isProcessing: boolean;
}

function matchesFilter(
  filter: MatrixFilter,
  status: ConformityStatus | null,
): boolean {
  switch (filter) {
    case "ALL":
      return true;
    case "PENDING":
      return status === null;
    case "COMPLIANT":
      return status === "COMPLIANT";
    case "NON_COMPLIANT":
      return status === "NON_COMPLIANT";
    case "NOT_APPLICABLE":
      return status === "NOT_APPLICABLE";
  }
}

export function ThematicSection({
  thematic,
  criteria,
  pageId,
  conformityMap,
  filter,
  canEdit,
  onSetStatus,
  onNonCompliantClick,
  onBulkSetNotApplicable,
  onClear,
  isProcessing,
}: Props) {
  // Critères filtrés selon le filtre actif
  const visibleCriteria = useMemo(() => {
    return criteria.filter((c) => {
      const status = conformityMap.get(`${pageId}:${c.id}`) ?? null;
      return matchesFilter(filter, status);
    });
  }, [criteria, conformityMap, pageId, filter]);

  const counts = useMemo(() => {
    let saisis = 0;
    for (const c of criteria) {
      const status = conformityMap.get(`${pageId}:${c.id}`);
      if (status) saisis += 1;
    }
    return { saisis, total: criteria.length };
  }, [criteria, conformityMap, pageId]);

  // Si le filtre actif rend la thématique vide → on ne rend rien
  if (visibleCriteria.length === 0) return null;

  const progressPercent =
    counts.total > 0 ? Math.round((counts.saisis / counts.total) * 100) : 0;

  const indicatorClass =
    counts.saisis === 0
      ? "bg-muted-foreground/40"
      : counts.saisis === counts.total
        ? "bg-success"
        : "bg-warning";

  return (
    <AccordionItem value={thematic.id}>
      <AccordionTrigger>
        <span className="flex flex-1 items-center gap-3">
          <span
            aria-hidden="true"
            className={cn("h-2 w-2 shrink-0 rounded-full", indicatorClass)}
          />
          <span className="truncate font-mono text-xs text-muted-foreground">
            {thematic.identifier}
          </span>
          <span className="truncate font-medium">{thematic.name}</span>
        </span>
        <span className="ml-auto mr-2 hidden shrink-0 items-center gap-2 text-xs text-muted-foreground sm:flex">
          <span className="tabular-nums">
            {counts.saisis} / {counts.total}
          </span>
          <Progress
            value={progressPercent}
            className="h-1 w-16"
            aria-hidden="true"
          />
        </span>
      </AccordionTrigger>

      <AccordionContent>
        {canEdit && (
          <div className="mb-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onBulkSetNotApplicable}
              disabled={isProcessing}
            >
              Tout marquer Non applicable
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClear}
              disabled={isProcessing}
            >
              Tout effacer
            </Button>
          </div>
        )}

        <ul role="list" className="divide-y divide-border">
          {visibleCriteria.map((criterion) => {
            const key = `${pageId}:${criterion.id}`;
            const current = conformityMap.get(key) ?? null;
            return (
              <li
                key={criterion.id}
                className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                      {criterion.identifier}
                    </span>
                    <span className="font-medium leading-snug">
                      {criterion.name}
                    </span>
                  </div>
                  {criterion.url && (
                    <a
                      href={criterion.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      Documentation officielle
                    </a>
                  )}
                </div>

                <ConformityCell
                  current={current}
                  disabled={!canEdit || isProcessing}
                  ariaLabelPrefix={`Critère ${criterion.identifier}`}
                  onSelectCompliant={() =>
                    onSetStatus(
                      criterion.id,
                      current === "COMPLIANT" ? null : "COMPLIANT",
                    )
                  }
                  onSelectNonCompliant={() => {
                    if (current === "NON_COMPLIANT") {
                      onSetStatus(criterion.id, null);
                    } else {
                      onNonCompliantClick(criterion);
                    }
                  }}
                  onSelectNotApplicable={() =>
                    onSetStatus(
                      criterion.id,
                      current === "NOT_APPLICABLE" ? null : "NOT_APPLICABLE",
                    )
                  }
                />
              </li>
            );
          })}
        </ul>
      </AccordionContent>
    </AccordionItem>
  );
}
