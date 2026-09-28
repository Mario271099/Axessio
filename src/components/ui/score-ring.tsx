import { cn } from "@/lib/utils";

interface ScoreRingProps {
  /** Pourcentage 0-100. `null` ⇒ anneau gris et « — » au centre. */
  value: number | null;
  /** Diamètre en px. */
  size?: number;
  /** Épaisseur du trait (par défaut 11 % du diamètre). */
  strokeWidth?: number;
  /**
   * `score` : couleur selon les seuils officiels (< 50 non conforme,
   * 50-99 partiel, 100 conforme). `highlight` : ambre des cartes encre.
   * `primary` : cobalt.
   */
  tone?: "score" | "highlight" | "primary";
  /** Couleur de la piste — à surcharger sur fond sombre. */
  trackColor?: string;
  /** Masque la valeur au centre (anneau purement graphique). */
  hideValue?: boolean;
  /** Classes du nombre affiché au centre. */
  valueClassName?: string;
  className?: string;
  /**
   * Nom accessible de l'anneau. Chaine vide = anneau purement decoratif
   * (masque des technologies d'assistance) : a utiliser quand la valeur est
   * deja ecrite en clair a cote.
   */
  ariaLabel?: string;
}

function scoreStroke(value: number): string {
  if (value >= 100) return "hsl(var(--score-compliant))";
  if (value >= 50) return "hsl(var(--score-partial))";
  return "hsl(var(--score-non-compliant))";
}

/**
 * Anneau de conformité du design system « Pro H ». Il se remplit au
 * chargement (animation de `stroke-dashoffset`, coupée par
 * `prefers-reduced-motion`) et prend sa couleur des seuils du RGAA.
 */
export function ScoreRing({
  value,
  size = 120,
  strokeWidth,
  tone = "score",
  trackColor = "hsl(var(--secondary))",
  hideValue = false,
  valueClassName,
  className,
  ariaLabel,
}: ScoreRingProps) {
  const decorative = !ariaLabel;
  const pct = value === null ? 0 : Math.max(0, Math.min(100, value));
  const width = strokeWidth ?? Math.max(5, Math.round(size * 0.11));
  const radius = (size - width) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct / 100);

  const stroke =
    value === null
      ? "hsl(var(--muted-foreground))"
      : tone === "score"
        ? scoreStroke(value)
        : tone === "highlight"
          ? "hsl(var(--highlight))"
          : "hsl(var(--primary))";

  return (
    <div
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : ariaLabel}
      aria-hidden={decorative ? true : undefined}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={width}
        />
        {value !== null && (
          <circle
            className="axs-ring"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={stroke}
            strokeWidth={width}
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={
              {
                "--ring-circumference": circumference,
                "--ring-offset": offset,
              } as React.CSSProperties
            }
          />
        )}
      </svg>
      {!hideValue && (
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-0 flex items-center justify-center font-black tabular",
            size <= 48 ? "text-xs" : size <= 80 ? "text-base" : "text-2xl",
            value === null && "text-muted-foreground",
            valueClassName,
          )}
        >
          {value === null ? "—" : `${Math.round(pct)}%`}
        </span>
      )}
    </div>
  );
}
