import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

/**
 * Champ de saisie « Pro H » : 44 px de haut, rayon 10 px, bordure a 3:1
 * (token `--input`) qui passe au cobalt au survol et au focus. L'anneau de
 * focus de 3 px vient de la regle globale *:focus-visible.
 */
export function Input({ className, type, ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-lg border border-input bg-card px-3.5 text-base text-foreground",
        "transition-colors duration-150",
        "file:mr-3 file:border-0 file:bg-transparent file:text-sm file:font-bold file:text-foreground",
        "placeholder:text-muted-foreground",
        "hover:border-primary focus:border-primary",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-input",
        "aria-[invalid=true]:border-destructive",
        className,
      )}
      {...props}
    />
  );
}
