"use client";

// Petite icône `?` qui révèle une explication courte au hover et au focus
// clavier. Le trigger reçoit un aria-label (`label` prop, optionnel)
// pour l'accessibilité quand le contenu seul ne suffit pas. Le tooltip
// reste lisible aussi sur mobile (open-on-click via Radix).

import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface InfoTipProps {
  /** Contenu du tooltip — texte court ou markup léger. */
  children: React.ReactNode;
  /** Aria-label du déclencheur pour les lecteurs d'écran. */
  label?: string;
  className?: string;
  /** Taille en pixels de l'icône. Par défaut 14 (`h-3.5 w-3.5`). */
  size?: "sm" | "md";
}

export function InfoTip({
  children,
  label,
  className,
  size = "sm",
}: InfoTipProps) {
  const iconClass = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={label ?? "Aide"}
            className={cn(
              "inline-flex shrink-0 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              className,
            )}
          >
            <HelpCircle className={iconClass} aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent>{children}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
