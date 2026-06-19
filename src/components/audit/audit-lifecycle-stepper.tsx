import { getTranslations } from "next-intl/server";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  AuditLifecycle,
  LifecycleStage,
  LifecycleStageKey,
} from "@/lib/audit-lifecycle";

interface AuditLifecycleStepperProps {
  lifecycle: AuditLifecycle;
}

// Format compact pour les sous-titres (ex. "19 juin 2026", "20 → 26 juin").
const dayMonthYear = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});
const dayOnly = new Intl.DateTimeFormat("fr-FR", { day: "numeric" });
const dayMonth = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
});

function formatStageDate(stage: LifecycleStage): string | null {
  if (!stage.date) return null;
  const start = new Date(stage.date);
  if (stage.endDate) {
    const end = new Date(stage.endDate);
    // Plage de l'étape "Audit" : "20 → 26 juin".
    return `${dayOnly.format(start)} → ${dayMonth.format(end)}`;
  }
  return dayMonthYear.format(start);
}

/**
 * Stepper horizontal du cycle de vie de l'audit - pièce maîtresse du
 * dashboard. 7 jalons reliés par des connecteurs. Le connecteur entre deux
 * jalons est vert quand celui de gauche est terminé.
 *
 *   done     : pastille verte + check
 *   current  : pastille navy + halo + numéro d'étape
 *   upcoming : pastille creuse grise + point central
 *
 * Server component : aucun état, lit juste les libellés i18n.
 */
export async function AuditLifecycleStepper({
  lifecycle,
}: AuditLifecycleStepperProps) {
  const t = await getTranslations("audits.lifecycle");
  const { stages } = lifecycle;

  return (
    <ol
      className="mt-4 flex min-w-[640px] items-start"
      aria-label={t("stepperAria")}
    >
      {stages.map((stage, index) => {
        const prevDone = index > 0 && stages[index - 1]?.state === "done";
        const isDone = stage.state === "done";
        const isCurrent = stage.state === "current";

        const sub =
          isCurrent && !stage.date
            ? t("inProgress")
            : (formatStageDate(stage) ?? t("notPlanned"));

        return (
          <li
            key={stage.key}
            className="relative flex flex-1 flex-col items-center px-1 text-center"
            aria-current={isCurrent ? "step" : undefined}
          >
            {/* Connecteur depuis le jalon précédent (centre à centre). */}
            {index > 0 && (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute right-1/2 left-[-50%] top-[16px] h-[3px]",
                  prevDone ? "bg-success" : "bg-border",
                )}
              />
            )}

            {/* Pastille */}
            <span
              aria-hidden="true"
              className={cn(
                "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors",
                isDone && "bg-success text-success-foreground",
                isCurrent &&
                  "bg-primary text-primary-foreground shadow-[0_0_0_5px_hsl(var(--primary)/0.13)]",
                !isDone &&
                  !isCurrent &&
                  "border-2 border-border bg-card",
              )}
            >
              {isDone ? (
                <Check className="h-4 w-4" />
              ) : isCurrent ? (
                index + 1
              ) : (
                <span className="h-[9px] w-[9px] rounded-full bg-muted-foreground/30" />
              )}
            </span>

            {/* Libellé + sous-titre */}
            <span
              className={cn(
                "mt-2 text-[13px] leading-tight",
                isCurrent
                  ? "font-bold text-foreground"
                  : isDone
                    ? "font-semibold text-foreground"
                    : "font-semibold text-muted-foreground",
              )}
            >
              {t(`stages.${stage.key}`)}
            </span>
            <span
              className={cn(
                "mt-0.5 text-xs leading-tight tabular-nums",
                isCurrent ? "font-bold text-primary" : "text-muted-foreground",
              )}
            >
              {sub}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

// Réexport typé pour les consommateurs qui ne tirent que la clé.
export type { LifecycleStageKey };
