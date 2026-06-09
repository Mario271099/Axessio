"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { BookOpen, ExternalLink, RotateCcw } from "lucide-react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WcagLevelBadge } from "@/components/ui/wcag-level-badge";
import { cn } from "@/lib/utils";
import { ConformityCell } from "./conformity-cell";
import type { ConformityStatus, Criterion, Thematic } from "@/types/domain";

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
  const t = useTranslations("audits.matrix.thematic");
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

  if (visibleCriteria.length === 0) return null;

  const indicatorClass =
    counts.saisis === 0
      ? "bg-muted-foreground/40"
      : counts.saisis === counts.total
        ? "bg-success"
        : "bg-warning";

  return (
    <AccordionItem value={thematic.id} className="my-3 shadow-sm">
      <AccordionTrigger className="px-4 py-4">
        <span className="flex flex-1 items-center gap-3">
          <span
            aria-hidden="true"
            className={cn("h-2 w-2 shrink-0 rounded-full", indicatorClass)}
          />
          <span className="truncate font-mono text-xs text-muted-foreground">
            {thematic.identifier}
          </span>
          <span className="truncate font-semibold">·</span>
          <span className="truncate font-semibold">{thematic.name}</span>
        </span>
        <Badge
          variant="muted"
          className="ml-auto mr-2 tabular-nums"
          aria-label={t("saisiAria", {
            filled: counts.saisis,
            total: counts.total,
          })}
        >
          {t("saisiLabel", { filled: counts.saisis, total: counts.total })}
        </Badge>
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
              {t("bulkNA")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClear}
              disabled={isProcessing}
              className="gap-2"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              {t("clearAll")}
            </Button>
          </div>
        )}

        <ul role="list" className="divide-y divide-border border-t border-border">
          {visibleCriteria.map((criterion) => {
            const key = `${pageId}:${criterion.id}`;
            const current = conformityMap.get(key) ?? null;
            return (
              <li
                key={criterion.id}
                className="flex flex-col gap-3 p-3 transition-colors hover:bg-accent/30 sm:flex-row sm:items-start sm:gap-4"
              >
                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm font-semibold text-muted-foreground">
                    {criterion.identifier}
                  </span>
                  <WcagLevelBadge
                    level={criterion.level}
                    aria-label={
                      criterion.level
                        ? t("wcagLevelAria", { level: criterion.level })
                        : undefined
                    }
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-snug">{criterion.name}</p>
                  {criterion.nameEn && (
                    <p className="mt-0.5 text-xs italic text-muted-foreground">
                      {criterion.nameEn}
                    </p>
                  )}
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                    {criterion.url && (
                      <a
                        href={criterion.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <BookOpen className="h-3 w-3" aria-hidden="true" />
                        {t("viewMethodology")}
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </a>
                    )}
                  </div>
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
