import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  /**
   * Libelle affiche a droite de l'interrupteur. Quand il est absent, passer
   * un `aria-label` : l'interrupteur doit toujours avoir un nom accessible.
   */
  label?: React.ReactNode;
  /** Classes du texte du libelle. */
  labelClassName?: string;
}

/**
 * Interrupteur accessible : c'est une vraie case a cocher, deplacee hors
 * ecran, dont l'etat pilote la piste et la pastille via `peer-checked`.
 * Le clavier, les formulaires et les lecteurs d'ecran fonctionnent donc
 * sans JavaScript.
 */
export function Switch({
  className,
  label,
  labelClassName,
  disabled,
  ...props
}: SwitchProps) {
  const control = (
    <span className="relative inline-flex shrink-0 items-center">
      <input
        type="checkbox"
        className="peer absolute size-0 opacity-0"
        disabled={disabled}
        {...props}
      />
      <span
        aria-hidden="true"
        className={cn(
          "block h-6 w-10 rounded-full bg-muted-foreground transition-colors duration-200",
          "peer-checked:bg-primary",
          "peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring",
          "peer-disabled:opacity-50",
        )}
      />
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute left-[3px] size-[18px] rounded-full bg-white shadow-sm",
          "transition-transform duration-200 ease-[cubic-bezier(0.3,1.4,0.5,1)]",
          "peer-checked:translate-x-4",
        )}
      />
    </span>
  );

  if (label === undefined) {
    return <span className={cn("inline-flex", className)}>{control}</span>;
  }

  return (
    <label
      className={cn(
        "inline-flex cursor-pointer items-center gap-2.5 text-sm font-semibold",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
    >
      {control}
      <span className={labelClassName}>{label}</span>
    </label>
  );
}
