"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { CountUp } from "@/components/dashboard/count-up";
import { cn } from "@/lib/utils";

export type KpiTone =
  | "primary"
  | "warning"
  | "success"
  | "violet"
  | "destructive";

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
  /** Rend la tuile cliquable (flèche en haut à droite + levée au survol). */
  href?: string;
}

const toneStyles: Record<
  KpiTone,
  { glyph: string; bar: string; arrow: string; color: string }
> = {
  primary: {
    glyph: "bg-primary text-primary-foreground",
    bar: "bg-primary",
    arrow: "group-hover:bg-primary group-hover:text-primary-foreground",
    color: "hsl(var(--primary))",
  },
  warning: {
    glyph: "bg-warning text-warning-foreground",
    bar: "bg-warning",
    arrow: "group-hover:bg-warning group-hover:text-warning-foreground",
    color: "hsl(var(--warning))",
  },
  success: {
    glyph: "bg-success text-success-foreground",
    bar: "bg-success",
    arrow: "group-hover:bg-success group-hover:text-success-foreground",
    color: "hsl(var(--success))",
  },
  destructive: {
    glyph: "bg-destructive text-destructive-foreground",
    bar: "bg-destructive",
    arrow: "group-hover:bg-destructive group-hover:text-destructive-foreground",
    color: "hsl(var(--destructive))",
  },
  violet: {
    glyph: "bg-theme-2 text-white",
    bar: "bg-theme-2",
    arrow: "group-hover:bg-theme-2 group-hover:text-white",
    color: "var(--theme-2)",
  },
};

/**
 * Tuile d'indicateur du tableau de bord. Au survol : la tuile monte, prend la
 * couleur de son ton, la barre du bas se déploie et la flèche pivote.
 */
export function KpiCard({
  iconKey,
  label,
  value,
  tone,
  delta,
  note,
  suffix,
  decimals,
  href,
}: KpiCardProps) {
  const Icon = iconRegistry[iconKey];
  const style = toneStyles[tone];

  const content = (
    <>
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 transition-transform duration-300",
          style.bar,
          href && "group-hover:scale-x-100",
        )}
      />

      <span className="flex items-start justify-between">
        <span
          aria-hidden="true"
          className={cn(
            "flex size-9 items-center justify-center rounded-lg",
            style.glyph,
          )}
        >
          <Icon className="size-[18px]" />
        </span>
        {href ? (
          <span
            aria-hidden="true"
            className={cn(
              "flex size-[30px] items-center justify-center rounded-full bg-secondary text-foreground transition-[background-color,color,transform] duration-200 group-hover:-rotate-45",
              style.arrow,
            )}
          >
            <ArrowRight className="size-[15px]" />
          </span>
        ) : (
          <TrendIndicator delta={delta} />
        )}
      </span>

      <span className="mt-3 block text-[2.125rem] font-black leading-none tabular tracking-tight">
        <CountUp to={value} decimals={decimals ?? 0} suffix={suffix ?? ""} />
      </span>

      <span className="mt-1.5 block text-base font-bold">{label}</span>
      {note && (
        <span className="mt-0.5 block text-sm text-muted-foreground">
          {note}
        </span>
      )}
    </>
  );

  const shell = cn(
    "group relative block overflow-hidden rounded-card border border-border bg-card p-5 text-card-foreground",
    href && "axs-lift",
  );

  if (href) {
    return (
      <Link
        href={href}
        className={shell}
        style={{ "--lift-color": style.color } as React.CSSProperties}
      >
        {content}
      </Link>
    );
  }

  return <div className={shell}>{content}</div>;
}

function TrendIndicator({ delta }: { delta: number | null }) {
  if (delta === null) return null;
  const positive = delta >= 0;
  const Arrow = positive ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-bold tabular",
        positive ? "text-success" : "text-destructive",
      )}
    >
      <Arrow className="size-3" aria-hidden="true" />
      {positive ? "+" : ""}
      {delta.toFixed(0)}%
    </span>
  );
}
