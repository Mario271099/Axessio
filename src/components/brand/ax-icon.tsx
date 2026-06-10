// AxIcon — version compacte du logo : carré arrondi navy + monogramme « A y »
// tracé au trait + point d'accent teal (signal A11Y). Utilisé pour favicon /
// app icon / badge dense (sidebar mobile, breadcrumbs, loader, etc.).
//
// Géométrie tracée dans un viewBox 56×56 (cf. design du logo principal).
// Couleurs câblées sur les tokens `--brand-*` de globals.css → respecte le
// mode clair/sombre du design system.

import type { LogoScheme } from "./wordmark";

interface IconColors {
  /** Fond du carré arrondi. */
  bg: string;
  /** Trait du monogramme « A y ». */
  stroke: string;
  /** Point d'accent A11Y. */
  dot: string;
  /** Bordure fine (variantes sur fond translucide). */
  border: boolean;
}

const SCHEMES: Record<LogoScheme, IconColors> = {
  light: {
    bg: "hsl(var(--brand-navy))",
    stroke: "#FFFFFF",
    dot: "hsl(var(--brand-teal))",
    border: false,
  },
  dark: {
    bg: "hsl(var(--brand-navy))",
    stroke: "#FFFFFF",
    dot: "hsl(var(--brand-teal-mid))",
    border: false,
  },
  mono: {
    bg: "hsl(var(--brand-navy))",
    stroke: "#FFFFFF",
    dot: "#FFFFFF",
    border: false,
  },
  accent: {
    bg: "hsl(var(--brand-navy))",
    stroke: "#FFFFFF",
    dot: "hsl(var(--brand-teal))",
    border: false,
  },
  teal: {
    bg: "hsl(var(--brand-teal))",
    stroke: "#FFFFFF",
    dot: "#FFFFFF",
    border: false,
  },
};

export interface AxIconProps {
  size?: number;
  scheme?: LogoScheme;
  /**
   * Texte vocalisé (par défaut « Axessyo »). Passer une chaîne vide
   * (`aria-label=""`) pour une icône purement décorative : elle est alors
   * masquée des technologies d'assistance (`aria-hidden`, sans `role="img"`),
   * typiquement lorsqu'un libellé textuel l'accompagne déjà.
   */
  "aria-label"?: string;
  className?: string;
}

export function AxIcon({
  size = 64,
  scheme = "light",
  "aria-label": ariaLabel = "Axessyo",
  className,
}: AxIconProps) {
  const colors = SCHEMES[scheme];
  // aria-label="" => icône décorative. Un SVG `role="img"` avec un nom
  // accessible vide est une violation axe (svg-img-alt) ; on le masque plutôt.
  const decorative = ariaLabel === "";
  const a11yProps = decorative
    ? { "aria-hidden": true as const }
    : { role: "img" as const, "aria-label": ariaLabel };
  return (
    <svg
      {...a11yProps}
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect
        width="56"
        height="56"
        rx="14"
        fill={colors.bg}
        stroke={colors.border ? "hsl(var(--border))" : "none"}
        strokeWidth={colors.border ? 1 : 0}
      />
      {/* « A » au trait */}
      <path
        d="M10 40 L15.8 14 c0.4 -1.6 2.6 -1.6 3 0 L22.5 28"
        stroke={colors.stroke}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Barre du « A » */}
      <path
        d="M12.5 31.5 h8"
        stroke={colors.stroke}
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      {/* « y » */}
      <path d="M26 20 L33.5 34" stroke={colors.stroke} strokeWidth="3.2" strokeLinecap="round" />
      <path d="M41 20 L33.5 34" stroke={colors.stroke} strokeWidth="3.2" strokeLinecap="round" />
      <path d="M33.5 34 L30.5 44" stroke={colors.stroke} strokeWidth="3.2" strokeLinecap="round" />
      {/* Point d'accent A11Y */}
      <circle cx="43" cy="12" r="3.5" fill={colors.dot} />
    </svg>
  );
}
