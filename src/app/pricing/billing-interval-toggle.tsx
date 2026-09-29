"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { usePricingState, type BillingInterval } from "./pricing-state";

interface Props {
  /** Économie de l'annuel par rapport au mensuel × 12, calculée depuis PLANS. */
  yearlySavingsPercent: number | null;
  /** Mois offerts par l'annuel, calculés depuis PLANS. */
  yearlyFreeMonths: number;
}

const INTERVALS: ReadonlyArray<BillingInterval> = ["monthly", "yearly"];

/** Bascule Mensuel / Annuel : deux boutons `aria-pressed` dans un groupe. */
export function BillingIntervalToggle({
  yearlySavingsPercent,
  yearlyFreeMonths,
}: Props) {
  const t = useTranslations("pricing");
  const { interval, setInterval } = usePricingState();

  return (
    <div className="flex flex-col items-start gap-2.5 lg:items-end">
      <div
        role="group"
        aria-label={t("toggleAria")}
        className="inline-flex gap-1 rounded-card bg-secondary p-1.5"
      >
        {INTERVALS.map((value) => {
          const pressed = interval === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={pressed}
              onClick={() => setInterval(value)}
              className={cn(
                "inline-flex h-11 items-center gap-2 rounded-row px-5 text-[0.9375rem] font-extrabold transition-colors duration-150",
                pressed
                  ? "bg-card text-primary shadow-sm"
                  : "text-secondary-foreground hover:bg-card/60 hover:text-foreground",
              )}
            >
              {t(`interval.${value}`)}
              {value === "yearly" && yearlySavingsPercent !== null && (
                <span className="inline-flex h-6 items-center rounded-full bg-success px-2 text-[0.78rem] text-success-foreground">
                  {t("savingsBadge", { percent: yearlySavingsPercent })}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-sm text-muted-foreground">
        {interval === "yearly"
          ? t("intervalNote.yearly", { months: yearlyFreeMonths })
          : t("intervalNote.monthly")}
      </p>
    </div>
  );
}
