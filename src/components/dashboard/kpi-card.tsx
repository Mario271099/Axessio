"use client";

import {
  CheckCircle2,
  ClipboardList,
  Clock,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { CountUp } from "@/components/dashboard/count-up";
import { cn } from "@/lib/utils";

export type KpiTone = "primary" | "warning" | "success" | "violet";

// Les icônes Lucide ne sont pas sérialisables ; on passe une clé depuis le
// Server Component et on résout ici, côté client.
export type KpiIconKey =
  | "clipboard-list"
  | "clock"
  | "check-circle"
  | "trending-up";

const iconRegistry = {
  "clipboard-list": ClipboardList,
  clock: Clock,
  "check-circle": CheckCircle2,
  "trending-up": TrendingUp,
} as const;

interface KpiCardProps {
  iconKey: KpiIconKey;
  label: string;
  value: number;
  tone: KpiTone;
  /** Tendance en % vs période précédente. `null` ⇒ pas d'indicateur affiché. */
  delta: number | null;
  /** Note secondaire sous la valeur (ex: « sur 12 audits »). */
  note?: string;
  suffix?: string;
  decimals?: number;
}

const toneBubble: Record<KpiTone, string> = {
  primary: "bg-primary/10 text-primary",
  warning: "bg-warning/10 text-warning",
  success: "bg-success/10 text-success",
  violet: "bg-violet-500/10 text-violet-500",
};

export function KpiCard({
  iconKey,
  label,
  value,
  tone,
  delta,
  note,
  suffix,
  decimals,
}: KpiCardProps) {
  const Icon = iconRegistry[iconKey];

  return (
    <Card className="p-6 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            toneBubble[tone],
          )}
          aria-hidden="true"
        >
          <Icon className="h-5 w-5" />
        </div>
        <TrendIndicator delta={delta} />
      </div>

      <p className="mt-4 text-sm text-muted-foreground">{label}</p>

      <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight">
        <CountUp to={value} decimals={decimals ?? 0} suffix={suffix ?? ""} />
      </p>

      {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
    </Card>
  );
}

function TrendIndicator({ delta }: { delta: number | null }) {
  if (delta === null) return null;
  const positive = delta >= 0;
  const Arrow = positive ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium tabular-nums",
        positive ? "text-success" : "text-destructive",
      )}
    >
      <Arrow className="h-3 w-3" aria-hidden="true" />
      {positive ? "+" : ""}
      {delta.toFixed(0)}%
    </span>
  );
}
