import { Lock } from "lucide-react";
import {
  AUDIT_WORKFLOW_LABELS,
  AUDIT_WORKFLOW_TONE,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { AuditWorkflowStatus } from "@/types/domain";

const TONES = {
  neutral: "bg-secondary text-secondary-foreground",
  info: "bg-primary/10 text-primary",
  warning: "bg-warning/10 text-warning",
  success: "bg-success/10 text-success",
  muted: "bg-muted text-muted-foreground",
} as const;

interface WorkflowBadgeProps {
  status: AuditWorkflowStatus;
  /** Affiche un cadenas si l'audit est verrouillé (validated / delivered). */
  showLock?: boolean;
  className?: string;
}

export function WorkflowBadge({ status, showLock, className }: WorkflowBadgeProps) {
  const locked = status === "validated" || status === "delivered";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
        TONES[AUDIT_WORKFLOW_TONE[status]],
        className,
      )}
    >
      {showLock && locked && <Lock className="h-3 w-3" aria-hidden="true" />}
      {AUDIT_WORKFLOW_LABELS[status]}
    </span>
  );
}
