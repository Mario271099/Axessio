"use client";

// Champ de recherche du topbar : c'est un bouton qui simule un appui sur
// Cmd+K pour ouvrir la palette. Évite d'exposer un état partagé entre topbar
// et palette - la palette écoute déjà le keydown global.

import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  /** Variante icone seule, pour les petits ecrans. */
  compact?: boolean;
}

export function CommandPaletteTrigger({ className, compact }: Props) {
  const t = useTranslations("commandPalette");

  function trigger() {
    // Dispatch un keydown synthétique. La palette écoute (e.metaKey ||
    // e.ctrlKey) && e.key === 'k' ; sur Mac on simule metaKey, sinon
    // ctrlKey. Choisir Mac par défaut si on n'a pas l'info navigator.
    const isMac =
      typeof navigator !== "undefined" &&
      /mac|iphone|ipad/i.test(navigator.platform);
    const evt = new KeyboardEvent("keydown", {
      key: "k",
      bubbles: true,
      cancelable: true,
      metaKey: isMac,
      ctrlKey: !isMac,
    });
    window.dispatchEvent(evt);
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={trigger}
        aria-label={t("openAria")}
        className={cn(
          "inline-flex size-11 items-center justify-center rounded-lg text-secondary-foreground transition-colors duration-150",
          "hover:bg-primary-soft hover:text-primary",
          className,
        )}
      >
        <Search className="size-[19px]" aria-hidden="true" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={trigger}
      aria-label={t("openAria")}
      className={cn(
        "inline-flex h-11 w-[420px] max-w-full items-center gap-2.5 rounded-row border border-border-strong bg-card px-3.5",
        "text-left text-base text-muted-foreground",
        "transition-[border-color,box-shadow] duration-150",
        "hover:border-primary hover:shadow-[0_0_0_4px_hsl(var(--primary-muted))]",
        className,
      )}
    >
      <Search className="size-[18px] shrink-0" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate">{t("placeholder")}</span>
      <kbd className="shrink-0 rounded-md bg-secondary px-1.5 py-0.5 text-xs font-bold text-muted-foreground">
        Ctrl K
      </kbd>
    </button>
  );
}
