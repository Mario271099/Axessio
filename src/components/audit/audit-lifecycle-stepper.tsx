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
 * Parcours de l'audit en 7 jalons — pièce maîtresse de la vue d'ensemble.
 * Chaque jalon porte sa pastille, son libellé et sa date ; le connecteur
 * passe au cobalt quand le jalon de gauche est franchi.
 *
 *   done     : pastille cobalt + check
 *   current  : pastille blanche cerclée de cobalt + halo qui pulse
 *   upcoming : pastille creuse grise + numéro
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
      className="flex min-w-[680px] items-start"
      aria-label={t("stepperAria")}
    >
      {stages.map((stage, index) => {
        const isDone = stage.state === "done";
        const isCurrent = stage.state === "current";
        const isLast = index === stages.length - 1;

        const sub =
          isCurrent && !stage.date
            ? t("inProgress")
            : (formatStageDate(stage) ?? t("notPlanned"));

        return (
          <li
            key={stage.key}
            className="relative flex flex-1 flex-col items-start gap-2 pr-2"
            aria-current={isCurrent ? "step" : undefined}
          >
            {/* Connecteur vers le jalon suivant. */}
            {!isLast && (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute left-[30px] right-0 top-[13.5px] h-[3px] rounded-full",
                  isDone ? "bg-primary" : "bg-border",
                )}
              />
            )}

            {/* Pastille */}
            <span
              aria-hidden="true"
              className={cn(
                "relative z-10 flex size-[30px] shrink-0 items-center justify-center rounded-full text-[0.8rem] font-extrabold",
                isDone && "bg-primary text-primary-foreground",
                isCurrent &&
                  "bg-card text-primary shadow-[inset_0_0_0_3px_hsl(var(--primary))]",
                !isDone && !isCurrent && "bg-secondary text-muted-foreground",
              )}
            >
              {isCurrent && (
                <span className="axs-halo absolute -inset-1.5 rounded-full border-2 border-primary" />
              )}
              {isDone ? <Check className="size-4" strokeWidth={3} /> : index + 1}
            </span>

            {/* Libellé + date */}
            <span className="flex min-w-0 flex-col leading-tight">
              <span
                className={cn(
                  "text-sm",
                  isCurrent
                    ? "font-black text-primary"
                    : isDone
                      ? "font-bold text-foreground"
                      : "font-semibold text-muted-foreground",
                )}
              >
                {t(`stages.${stage.key}`)}
              </span>
              <span className="mt-0.5 text-xs tabular text-muted-foreground">
                {sub}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

// Réexport typé pour les consommateurs qui ne tirent que la clé.
export type { LifecycleStageKey };
