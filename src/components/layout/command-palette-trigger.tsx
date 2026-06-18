"use client";

// Petit bouton "Rechercher" du topbar qui simule un appui sur Cmd+K pour
// ouvrir la palette. Évite d'exposer un état partagé entre topbar et
// palette - la palette écoute déjà le keydown global.

import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function CommandPaletteTrigger({ className }: { className?: string }) {
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

  // Affiche le shortcut côté droit. Compact en mobile (juste l'icône),
  // étendu sur écrans plus larges.
  return (
    <button
      type="button"
      onClick={trigger}
      aria-label={t("openAria")}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border bg-card px-2.5 py-1.5 text-sm text-muted-foreground transition-colors",
        "hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
    >
      <Search className="h-3.5 w-3.5" aria-hidden="true" />
      <span className="hidden sm:inline">{t("triggerLabel")}</span>
      <kbd className="hidden rounded border border-border bg-background px-1 font-mono text-[10px] text-foreground sm:inline">
        ⌘K
      </kbd>
    </button>
  );
}
