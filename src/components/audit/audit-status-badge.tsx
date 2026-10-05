"use client";

import { useTranslations } from "next-intl";
import { AUDIT_STATUS_TONE } from "@/lib/constants";
import type { AuditStatus } from "@/types/domain";
import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-secondary text-secondary-foreground",
  info: "bg-primary-muted text-primary",
  warning: "bg-warning-bg text-warning-text",
  success: "bg-success-bg text-success-text",
  muted: "bg-muted text-muted-foreground",
} as const;

/**
 * Statut de l'audit en pastille : point de couleur + libellé. La couleur ne
 * porte jamais seule l'information, le libellé est toujours présent.
 */
export function AuditStatusBadge({
  status,
  className,
}: {
  status: AuditStatus;
  className?: string;
}) {
  const t = useTranslations("constants.auditStatus");
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-2 rounded-full px-3 text-[0.84rem] font-extrabold",
        tones[AUDIT_STATUS_TONE[status]],
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="size-2 shrink-0 rounded-full bg-current"
      />
      {t(status)}
    </span>
  );
}
