import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  size?: number;
  className?: string;
  fullscreen?: boolean;
}

// Loader de marque : le monogramme « A y » du logo se trace trait par trait,
// puis le point d'accent A11Y apparaît avec une onde, en boucle. Une barre
// indéterminée sous l'icône complète le mouvement. Géométrie identique au logo
// du header (viewBox 56×56). Animations dans globals.css (.brand-loader*),
// coupées sous prefers-reduced-motion (icône statique complète).
export function BrandLoader({
  label,
  size = 72,
  className,
  fullscreen = true,
}: Props) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={label}
      className={cn(
        "flex flex-col items-center justify-center gap-5",
        fullscreen && "min-h-[60vh]",
        className,
      )}
    >
      <div className="brand-loader" style={{ width: size, height: size }} aria-hidden="true">
        <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
          <rect width="56" height="56" rx="14" className="brand-loader-tile" />
          <g
            className="brand-loader-strokes"
            stroke="#FFFFFF"
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              pathLength={1}
              style={{ "--d": "0s" } as CSSProperties}
              d="M10 40 L15.8 14 c0.4 -1.6 2.6 -1.6 3 0 L22.5 28"
            />
            <path pathLength={1} style={{ "--d": "0.28s" } as CSSProperties} d="M12.5 31.5 h8" />
            <path pathLength={1} style={{ "--d": "0.42s" } as CSSProperties} d="M26 20 L33.5 34" />
            <path pathLength={1} style={{ "--d": "0.56s" } as CSSProperties} d="M41 20 L33.5 34" />
            <path pathLength={1} style={{ "--d": "0.7s" } as CSSProperties} d="M33.5 34 L30.5 44" />
          </g>
          <circle cx="37" cy="14" r="4" className="brand-loader-ripple" />
          <circle cx="37" cy="14" r="4" className="brand-loader-dot" />
        </svg>
      </div>
      <span className="brand-loader-bar" aria-hidden="true" />
      <p className="text-sm font-medium text-muted-foreground" aria-hidden="true">
        {label}
      </p>
      <span className="sr-only">{label}</span>
    </div>
  );
}
