import { CheckCircle2, Circle, Eye, AlertTriangle, Clock } from "lucide-react";
import {
  NC_REVIEW_STATUS_LABELS,
  NC_REVIEW_STATUS_TONE,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { NCReviewStatus } from "@/types/domain";

const TONE_CLASSES = {
  neutral: "bg-secondary text-secondary-foreground",
  info: "bg-primary/10 text-primary",
  warning: "bg-warning/10 text-warning",
  success: "bg-success/10 text-success",
  destructive: "bg-destructive/10 text-destructive",
  muted: "bg-muted text-muted-foreground",
} as const;

const ICONS: Record<NCReviewStatus, React.ElementType> = {
  not_requested: Circle,
  pending: Clock,
  under_review: Eye,
  changes_requested: AlertTriangle,
  approved: CheckCircle2,
};

interface NCReviewBadgeProps {
  status: NCReviewStatus;
  className?: string;
  /** Cache le badge si statut = not_requested (l'état neutre n'a pas besoin de visibilité). */
  hideWhenNotRequested?: boolean;
}

export function NCReviewBadge({
  status,
  className,
  hideWhenNotRequested,
}: NCReviewBadgeProps) {
  if (hideWhenNotRequested && status === "not_requested") return null;
  const Icon = ICONS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
        TONE_CLASSES[NC_REVIEW_STATUS_TONE[status]],
        className,
      )}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {NC_REVIEW_STATUS_LABELS[status]}
    </span>
  );
}
