import { cn } from "@/lib/utils";

interface LifecycleStepsProps {
  /** Numéro de l'étape en cours (1 = première). */
  currentStep: number;
  /** Nombre de jalons du parcours. */
  totalSteps?: number;
  /** Nom accessible, ex. « Étape 2 sur 7, audit en cours ». */
  label: string;
  className?: string;
}

/**
 * Parcours de l'audit en version compacte : une barre par jalon. Les jalons
 * franchis sont cobalt, celui en cours pulse, les suivants restent creux.
 * La version détaillée (pastilles + dates) est <AuditLifecycleStepper />.
 */
export function LifecycleSteps({
  currentStep,
  totalSteps = 7,
  label,
  className,
}: LifecycleStepsProps) {
  return (
    <span
      role="img"
      aria-label={label}
      className={cn("flex items-center gap-1", className)}
    >
      {Array.from({ length: totalSteps }, (_, index) => {
        const step = index + 1;
        const done = step < currentStep;
        const current = step === currentStep;
        return (
          <span
            key={step}
            aria-hidden="true"
            className={cn(
              "h-1.5 flex-1 rounded-full",
              done && "bg-primary",
              current && "bg-primary axs-step-current",
              !done && !current && "bg-border",
            )}
          />
        );
      })}
    </span>
  );
}
