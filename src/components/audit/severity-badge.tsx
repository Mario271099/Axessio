import { NC_SEVERITY_LABELS } from "@/lib/constants";
import type { NCSeverity } from "@/types/domain";
import { cn } from "@/lib/utils";

const styles: Record<NCSeverity, string> = {
  LOW: "bg-[hsl(var(--severity-low)/0.12)] text-[hsl(var(--severity-low))]",
  MEDIUM:
    "bg-[hsl(var(--severity-medium)/0.12)] text-[hsl(var(--severity-medium))]",
  HIGH: "bg-[hsl(var(--severity-high)/0.12)] text-[hsl(var(--severity-high))]",
  CRITICAL:
    "bg-[hsl(var(--severity-critical)/0.15)] text-[hsl(var(--severity-critical))]",
};

interface SeverityBadgeProps {
  severity: NCSeverity;
  className?: string;
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        styles[severity],
        className,
      )}
    >
      {NC_SEVERITY_LABELS[severity]}
    </span>
  );
}
