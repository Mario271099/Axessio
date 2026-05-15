"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Circle,
  ExternalLink,
  LayoutGrid,
  MinusCircle,
  XCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Accordion } from "@/components/ui/accordion";
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

type FilterIconKey =
  | "all"
  | "pending"
  | "compliant"
  | "non-compliant"
  | "not-applicable";

const FILTER_ICONS = {
  all: LayoutGrid,
  pending: Circle,
  compliant: CheckCircle2,
  "non-compliant": XCircle,
  "not-applicable": MinusCircle,
} as const;

interface FilterOption {
  value: MatrixFilter;
  iconKey: FilterIconKey;
  label: string;
}

const FILTER_OPTIONS: FilterOption[] = [
  { value: "ALL", iconKey: "all", label: "Tout" },
  { value: "PENDING", iconKey: "pending", label: "À saisir" },
  { value: "COMPLIANT", iconKey: "compliant", label: "Conformes" },
  { value: "NON_COMPLIANT", iconKey: "non-compliant", label: "Non conformes" },
  { value: "NOT_APPLICABLE", iconKey: "not-applicable", label: "Non applicables" },
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

  // Gradient subtil sur la card hero selon le niveau de conformité.
  const heroGradient =
    score.value >= 100
      ? "from-success/10 via-card to-card"
      : score.value >= 50
        ? "from-warning/10 via-card to-card"
        : "from-destructive/10 via-card to-card";

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
        <h2 className="text-xl font-bold tracking-tight">{page.name}</h2>
        {page.url && (
          <a
            href={page.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex max-w-full items-center gap-1 truncate text-sm text-primary hover:underline"
          >
            <span className="truncate">{page.url}</span>
            <ExternalLink
              className="h-3.5 w-3.5 shrink-0"
              aria-hidden="true"
            />
          </a>
        )}
      </header>

      {/* Card hero : score de la page + compteurs visuels -------------- */}
      <Card
        className={cn(
          "bg-gradient-to-br p-6",
          heroGradient,
        )}
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Score de la page
            </p>
            <div className="mt-1 flex items-baseline gap-3">
              <span
                className="text-4xl font-bold tabular-nums tracking-tight"
                style={{ color: `hsl(${getScoreColorVar(score.value)})` }}
              >
                {formatScore(score.value)}
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                {getConformityLabel(score.value)}
              </span>
            </div>
          </div>

          <ul className="grid grid-cols-2 gap-x-6 gap-y-2 sm:flex sm:items-center sm:gap-6">
            <CounterPill
              icon={CheckCircle2}
              tone="text-success"
              count={counters.COMPLIANT}
              label="Conformes"
            />
            <CounterPill
              icon={XCircle}
              tone="text-destructive"
              count={counters.NON_COMPLIANT}
              label="Non conformes"
            />
            <CounterPill
              icon={MinusCircle}
              tone="text-muted-foreground"
              count={counters.NOT_APPLICABLE}
              label="Non applicables"
            />
            <CounterPill
              icon={Circle}
              tone="text-muted-foreground/70"
              count={counters.PENDING}
              label="Non évalués"
            />
          </ul>
        </div>
      </Card>

      {/* Barre de filtres ------------------------------------------------ */}
      <Card className="sticky top-20 z-10 flex flex-wrap gap-2 p-2 shadow-sm">
        <div
          role="radiogroup"
          aria-label="Filtrer les critères"
          className="flex flex-wrap gap-1"
        >
          {FILTER_OPTIONS.map((opt) => {
            const isActive = filter === opt.value;
            const count = counters[opt.value];
            const Icon = FILTER_ICONS[opt.iconKey];
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick={() => setFilter(opt.value)}
                className={cn(
                  "inline-flex h-8 items-center gap-2 rounded-md border px-3 text-xs font-medium transition-all duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isActive
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-transparent bg-background text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{opt.label}</span>
                <span
                  className={cn(
                    "tabular-nums",
                    isActive
                      ? "rounded bg-primary/20 px-1 py-0.5 text-[10px]"
                      : "rounded bg-muted px-1 py-0.5 text-[10px]",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Accordéons des thématiques ------------------------------------- */}
      <Accordion
        type="multiple"
        value={openThematics}
        onValueChange={handleAccordionChange}
        className="space-y-0"
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

function CounterPill({
  icon: Icon,
  tone,
  count,
  label,
}: {
  icon: React.ElementType;
  tone: string;
  count: number;
  label: string;
}) {
  return (
    <li className="flex items-center gap-2">
      <Icon className={cn("h-4 w-4 shrink-0", tone)} aria-hidden="true" />
      <span className="text-sm">
        <span className={cn("font-semibold tabular-nums", tone)}>{count}</span>
        <span className="ml-1 text-muted-foreground">{label}</span>
      </span>
    </li>
  );
}
