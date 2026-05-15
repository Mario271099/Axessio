import { cn } from "@/lib/utils";

interface MiniDonutProps {
  /** Pourcentage 0-100. `null` ⇒ donut grisé + "—". */
  value: number | null;
  /** Diamètre en px (default 64). */
  size?: number;
  /** Tonalité du stroke. "score" choisit la couleur selon la valeur (rouge/jaune/vert). */
  tone?: "primary" | "score";
  /** Libellé sous le donut (optionnel). */
  className?: string;
  /** Label accessible pour le donut. */
  ariaLabel?: string;
}

function scoreStroke(value: number): string {
  if (value >= 100) return "hsl(var(--success))";
  if (value >= 50) return "hsl(var(--warning))";
  return "hsl(var(--destructive))";
}

export function MiniDonut({
  value,
  size = 64,
  tone = "primary",
  className,
  ariaLabel,
}: MiniDonutProps) {
  const pct = value === null ? 0 : Math.max(0, Math.min(100, value));
  // Géométrie : stroke 7 px, padding visuel laissé via rx du SVG.
  const strokeWidth = Math.max(5, Math.round(size * 0.11));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - pct / 100);

  const stroke =
    value === null
      ? "hsl(var(--muted-foreground))"
      : tone === "score"
        ? scoreStroke(value)
        : "hsl(var(--primary))";

  return (
    <div
      role="img"
      aria-label={
        ariaLabel ??
        (value === null ? "Score non disponible" : `${Math.round(pct)} pour cent`)
      }
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 400ms ease-out" }}
        />
      </svg>
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-0 flex items-center justify-center font-bold tabular-nums",
          size <= 48 ? "text-xs" : "text-sm",
          value === null && "text-muted-foreground",
        )}
      >
        {value === null ? "—" : `${Math.round(pct)}%`}
      </span>
    </div>
  );
}
