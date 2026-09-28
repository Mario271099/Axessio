"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { ConformityStatus } from "@/types/domain";

interface Props {
  current: ConformityStatus | null;
  disabled?: boolean;
  onSelectCompliant: () => void;
  onSelectNonCompliant: () => void;
  onSelectNotApplicable: () => void;
  ariaLabelPrefix: string;
}

/**
 * Sélecteur C / NC / NA du design system « Pro H » : un segmenté posé sur
 * une piste grise. Le libellé court reste visible, le libellé complet est
 * porté par l'`aria-label` de chaque bouton.
 */
const baseBtn =
  "inline-flex h-[30px] min-w-11 items-center justify-center rounded-md px-2 text-xs font-extrabold " +
  "transition-[background-color,color,transform] duration-150 " +
  "disabled:cursor-not-allowed disabled:opacity-50";

const idleBtn = "text-muted-foreground hover:bg-card hover:text-foreground";

const ConformityCellInner = ({
  current,
  disabled,
  onSelectCompliant,
  onSelectNonCompliant,
  onSelectNotApplicable,
  ariaLabelPrefix,
}: Props) => {
  const t = useTranslations("audits.matrix.cell");
  const tConformity = useTranslations("constants.conformity");
  return (
    <div
      role="group"
      aria-label={t("groupAria", { prefix: ariaLabelPrefix })}
      className="inline-flex shrink-0 items-center gap-0.5 rounded-lg bg-secondary p-[3px]"
    >
      <button
        type="button"
        onClick={onSelectCompliant}
        aria-pressed={current === "COMPLIANT"}
        aria-label={t("compliantAria", {
          prefix: ariaLabelPrefix,
          label: tConformity("COMPLIANT"),
        })}
        disabled={disabled}
        className={cn(
          baseBtn,
          current === "COMPLIANT"
            ? "scale-[1.04] bg-success text-success-foreground"
            : idleBtn,
        )}
      >
        {t("compliantShort")}
      </button>
      <button
        type="button"
        onClick={onSelectNonCompliant}
        aria-pressed={current === "NON_COMPLIANT"}
        aria-label={t("compliantAria", {
          prefix: ariaLabelPrefix,
          label: tConformity("NON_COMPLIANT"),
        })}
        disabled={disabled}
        className={cn(
          baseBtn,
          current === "NON_COMPLIANT"
            ? "scale-[1.04] bg-destructive text-destructive-foreground"
            : idleBtn,
        )}
      >
        {t("nonCompliantShort")}
      </button>
      <button
        type="button"
        onClick={onSelectNotApplicable}
        aria-pressed={current === "NOT_APPLICABLE"}
        aria-label={t("compliantAria", {
          prefix: ariaLabelPrefix,
          label: tConformity("NOT_APPLICABLE"),
        })}
        disabled={disabled}
        className={cn(
          baseBtn,
          current === "NOT_APPLICABLE"
            ? "scale-[1.04] bg-theme-13 text-white"
            : idleBtn,
        )}
      >
        {t("notApplicableShort")}
      </button>
    </div>
  );
};

export const ConformityCell = memo(ConformityCellInner);
