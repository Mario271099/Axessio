"use client";

import { useTranslations } from "next-intl";
import type { NCSeverity } from "@/types/domain";
import { cn } from "@/lib/utils";

/**
 * Sévérité d'une non-conformité : fond pastel + texte foncé du même ton,
 * contrastes vérifiés. Le libellé accompagne toujours la couleur.
 */
const styles: Record<NCSeverity, string> = {
  LOW: "bg-severity-low-bg text-severity-low",
  MEDIUM: "bg-severity-medium-bg text-severity-medium",
  HIGH: "bg-severity-high-bg text-severity-high",
  CRITICAL: "bg-severity-critical-bg text-severity-critical",
};

interface SeverityBadgeProps {
  severity: NCSeverity;
  className?: string;
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const t = useTranslations("constants.ncSeverity");
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-lg px-2.5 py-1 text-[0.82rem] font-extrabold",
        styles[severity],
        className,
      )}
    >
      {t(severity)}
    </span>
  );
}
