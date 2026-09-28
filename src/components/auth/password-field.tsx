"use client";

// Champ de mot de passe des écrans d'authentification : l'oeil de la
// maquette, posé dans le champ, qui bascule entre texte et points.
// Le bouton porte son état avec aria-pressed et un libellé explicite.

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PasswordFieldProps
  extends Omit<React.ComponentProps<typeof Input>, "type"> {
  /** Libellé du bouton quand le mot de passe est masqué. */
  showLabel: string;
  /** Libellé du bouton quand le mot de passe est en clair. */
  hideLabel: string;
}

export function PasswordField({
  className,
  showLabel,
  hideLabel,
  ...props
}: PasswordFieldProps) {
  const [shown, setShown] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={shown ? "text" : "password"}
        className={cn("pr-[52px]", className)}
      />
      <button
        type="button"
        onClick={() => setShown((v) => !v)}
        aria-label={shown ? hideLabel : showLabel}
        aria-pressed={shown}
        className={cn(
          "absolute right-1.5 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-lg",
          "text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary",
        )}
      >
        {shown ? (
          <EyeOff className="size-[19px]" aria-hidden="true" />
        ) : (
          <Eye className="size-[19px]" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
