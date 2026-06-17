"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { setLocale } from "@/i18n/actions";
import { type Locale } from "@/i18n/config";

// Bascule rapide FR <-> EN pour le header public. Un simple bouton qui affiche
// le code de la langue *opposee* : un clic suffit pour passer dans l'autre
// langue (le choix est persiste dans un cookie par `setLocale`).
export function PublicLocaleSwitcher({
  className,
}: {
  className?: string;
}) {
  const current = useLocale() as Locale;
  const [pending, startTransition] = useTransition();

  const target: Locale = current === "fr" ? "en" : "fr";
  const label =
    current === "fr" ? "Passer en anglais" : "Switch to French";

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      onClick={() => startTransition(() => setLocale(target))}
      disabled={pending}
      aria-label={label}
      title={label}
      className={className}
    >
      <span aria-hidden="true" className="font-mono text-xs font-semibold">
        {target.toUpperCase()}
      </span>
    </Button>
  );
}
