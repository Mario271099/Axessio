"use client";

// Jauge de force et critères du mot de passe, partagés par la création de
// compte, la réinitialisation et la définition d'un premier mot de passe.
// Les trois écrans appliquaient déjà les mêmes règles, chacun de son côté :
// elles sont ici en un seul endroit, sans changement de règle.

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PasswordCriteria {
  minLength: boolean;
  hasUppercase: boolean;
  hasDigit: boolean;
}

/** Règles inchangées : 8 caractères, une majuscule, un chiffre. */
export function evaluatePassword(password: string): PasswordCriteria {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasDigit: /[0-9]/.test(password),
  };
}

/** Nombre de critères remplis, de 0 à 3. */
export function passwordScore(criteria: PasswordCriteria): number {
  return (
    Number(criteria.minLength) +
    Number(criteria.hasUppercase) +
    Number(criteria.hasDigit)
  );
}

/** Clés i18n des niveaux, indexées par le score. */
export const PASSWORD_STRENGTH_KEYS = [
  "tooShort",
  "weak",
  "medium",
  "strong",
] as const;

const FILL = [
  "bg-border",
  "bg-destructive",
  "bg-warning",
  "bg-success",
] as const;

const TEXT = [
  "text-muted-foreground",
  "text-destructive",
  "text-warning-text",
  "text-success-text",
] as const;

interface PasswordStrengthProps {
  id?: string;
  criteria: PasswordCriteria;
  score: number;
  /** Phrase complète déjà traduite, ex. « Force du mot de passe : Fort ». */
  strengthLabel: string;
  /** Les trois libellés, dans l'ordre : longueur, majuscule, chiffre. */
  criteriaLabels: [string, string, string];
  /** Suffixes lus par les lecteurs d'écran (« , respecté »). */
  metLabel: string;
  unmetLabel: string;
}

export function PasswordStrength({
  id,
  criteria,
  score,
  strengthLabel,
  criteriaLabels,
  metLabel,
  unmetLabel,
}: PasswordStrengthProps) {
  const items: Array<[boolean, string]> = [
    [criteria.minLength, criteriaLabels[0]],
    [criteria.hasUppercase, criteriaLabels[1]],
    [criteria.hasDigit, criteriaLabels[2]],
  ];

  return (
    <div id={id} className="flex flex-col gap-2">
      {/* Jauge : un segment par critère rempli. */}
      <div className="grid grid-cols-3 gap-1" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn(
              "h-[5px] rounded-full transition-colors duration-300",
              i < score ? FILL[score] : "bg-border",
            )}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <ul className="flex flex-wrap gap-x-3.5 gap-y-1">
          {items.map(([ok, label]) => (
            <li
              key={label}
              className={cn(
                "flex items-center gap-2 text-[0.84rem] transition-colors",
                ok ? "font-bold text-success-text" : "text-muted-foreground",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-[18px] shrink-0 items-center justify-center rounded-full border-2 text-white",
                  "transition-[background-color,border-color,transform] duration-200",
                  ok
                    ? "scale-110 border-success bg-success"
                    : "border-input bg-transparent",
                )}
              >
                <Check className="size-3" strokeWidth={3.4} />
              </span>
              {label}
              <span className="sr-only">{ok ? metLabel : unmetLabel}</span>
            </li>
          ))}
        </ul>

        <p
          aria-live="polite"
          className={cn(
            "whitespace-nowrap text-[0.8rem] font-extrabold",
            TEXT[score] ?? TEXT[0],
          )}
        >
          {strengthLabel}
        </p>
      </div>
    </div>
  );
}
