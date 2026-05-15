"use client";

import { memo } from "react";
import { Check, Minus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CONFORMITY_STATUS_LABELS } from "@/lib/constants";
import type { ConformityStatus } from "@/types/domain";

interface Props {
  current: ConformityStatus | null;
  disabled?: boolean;
  onSelectCompliant: () => void;
  onSelectNonCompliant: () => void;
  onSelectNotApplicable: () => void;
  ariaLabelPrefix: string;
}

// Layout : 3 boutons côte à côte, premier arrondi à gauche, dernier à droite.
const baseBtn =
  "inline-flex h-9 items-center justify-center gap-1.5 border px-2 text-xs font-medium " +
  "transition-all duration-150 active:scale-95 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 " +
  "disabled:cursor-not-allowed disabled:opacity-50";

const ConformityCellInner = ({
  current,
  disabled,
  onSelectCompliant,
  onSelectNonCompliant,
  onSelectNotApplicable,
  ariaLabelPrefix,
}: Props) => {
  return (
    <div
      role="group"
      aria-label={`${ariaLabelPrefix} : statut de conformité`}
      className="inline-flex items-stretch overflow-hidden rounded-md shadow-xs"
    >
      <button
        type="button"
        onClick={onSelectCompliant}
        aria-pressed={current === "COMPLIANT"}
        aria-label={`${ariaLabelPrefix} : marquer ${CONFORMITY_STATUS_LABELS.COMPLIANT}`}
        disabled={disabled}
        className={cn(
          baseBtn,
          "rounded-l-md border-r-0",
          current === "COMPLIANT"
            ? "border-success bg-success text-success-foreground hover:bg-success/90"
            : "border-input bg-background text-success hover:bg-success/10",
        )}
      >
        <Check className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">Conforme</span>
      </button>
      <button
        type="button"
        onClick={onSelectNonCompliant}
        aria-pressed={current === "NON_COMPLIANT"}
        aria-label={`${ariaLabelPrefix} : marquer ${CONFORMITY_STATUS_LABELS.NON_COMPLIANT}`}
        disabled={disabled}
        className={cn(
          baseBtn,
          "border-r-0",
          current === "NON_COMPLIANT"
            ? "border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90"
            : "border-input bg-background text-destructive hover:bg-destructive/10",
        )}
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">Non conforme</span>
      </button>
      <button
        type="button"
        onClick={onSelectNotApplicable}
        aria-pressed={current === "NOT_APPLICABLE"}
        aria-label={`${ariaLabelPrefix} : marquer ${CONFORMITY_STATUS_LABELS.NOT_APPLICABLE}`}
        disabled={disabled}
        className={cn(
          baseBtn,
          "rounded-r-md",
          current === "NOT_APPLICABLE"
            ? "border-muted-foreground bg-muted-foreground text-background hover:bg-muted-foreground/90"
            : "border-input bg-background text-muted-foreground hover:bg-muted",
        )}
      >
        <Minus className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">Non applicable</span>
      </button>
    </div>
  );
};

// 436 critères × N pages → on évite le rerender quand seul un autre critère change.
export const ConformityCell = memo(ConformityCellInner);
