"use client";

import { useTranslations } from "next-intl";
import { AUDIT_STATUS_TONE } from "@/lib/constants";
import type { AuditStatus } from "@/types/domain";
import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-secondary text-secondary-foreground",
  info: "bg-primary/10 text-primary",
  warning: "bg-warning/10 text-warning",
  success: "bg-success/10 text-success",
  muted: "bg-muted text-muted-foreground",
} as const;

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
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        tones[AUDIT_STATUS_TONE[status]],
        className,
      )}
    >
      {t(status)}
    </span>
  );
}
