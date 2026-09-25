"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  CheckCircle2,
  Circle,
  LayoutGrid,
  MinusCircle,
  XCircle,
} from "lucide-react";
import { Accordion } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { ThematicSection, type MatrixFilter } from "./thematic-section";
import type {
  ConformityStatus,
  Criterion,
  Thematic,
} from "@/types/domain";

interface Props {
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
  labelKey:
    | "filterAll"
    | "filterPending"
    | "filterCompliant"
    | "filterNonCompliant"
    | "filterNotApplicable";
}

const FILTER_OPTIONS: FilterOption[] = [
  { value: "ALL", iconKey: "all", labelKey: "filterAll" },
  { value: "PENDING", iconKey: "pending", labelKey: "filterPending" },
  { value: "COMPLIANT", iconKey: "compliant", labelKey: "filterCompliant" },
  {
    value: "NON_COMPLIANT",
    iconKey: "non-compliant",
    labelKey: "filterNonCompliant",
  },
  {
    value: "NOT_APPLICABLE",
    iconKey: "not-applicable",
    labelKey: "filterNotApplicable",
  },
];

export function PageMatrixContent({
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
  const t = useTranslations("audits.matrix.content");
  const [filter, setFilter] = useState<MatrixFilter>("ALL");
  const [openThematics, setOpenThematics] = useState<string[]>([]);

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

  const handleAccordionChange = (value: string[]) => {
    const wasOpen = openThematics;
    const closed = wasOpen.filter((v) => !value.includes(v));
    setOpenThematics(value);
    if (closed.length > 0) {
      onAccordionClose();
    }
  };

  return (
    <div className="space-y-4">
      {/* Barre de filtres, en pilules. Le score et les compteurs de la page
          vivent dans l'en-tête de l'écran (au-dessus de la matrice). */}
      <div className="sticky top-0 z-10 -mx-1 bg-background/95 px-1 py-2 backdrop-blur">
        <div
          role="radiogroup"
          aria-label={t("filterAria")}
          className="flex flex-wrap gap-2"
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
                  "inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm font-bold",
                  "transition-[background-color,border-color,color] duration-150",
                  isActive
                    ? "border-ink bg-ink text-ink-foreground"
                    : "border-border-strong bg-card text-foreground hover:border-primary",
                )}
              >
                <Icon className="size-3.5 shrink-0" aria-hidden="true" />
                <span>{t(opt.labelKey)}</span>
                <span className="text-xs font-extrabold tabular opacity-75">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

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
