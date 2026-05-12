// AxIcon — version compacte du logo : carré arrondi + monogramme « Ax » +
// point d'accent (signal A11Y). Utilisé pour favicon / app icon / badge
// dense (sidebar mobile, breadcrumbs, etc.).

import type { LogoScheme } from "./wordmark";

interface IconColors {
  bg: string;
  ax: string;
  a11y: string;
  border: boolean;
}

const SCHEMES: Record<LogoScheme, IconColors> = {
  light: {
    bg: "#FFFFFF",
    ax: "hsl(var(--brand-accent))",
    a11y: "hsl(var(--brand-teal-mid))",
    border: true,
  },
  dark: {
    bg: "hsl(var(--brand-text))",
    ax: "#FFFFFF",
    a11y: "hsl(var(--brand-mint-300))",
    border: false,
  },
  mono: {
    bg: "#FFFFFF",
    ax: "hsl(var(--brand-text))",
    a11y: "hsl(var(--brand-text))",
    border: true,
  },
  accent: {
    bg: "hsl(var(--brand-accent))",
    ax: "#FFFFFF",
    a11y: "hsl(var(--brand-mint-300))",
    border: false,
  },
  teal: {
    bg: "hsl(var(--brand-teal))",
    ax: "#FFFFFF",
    a11y: "hsl(var(--brand-indigo-200))",
    border: false,
  },
};

export interface AxIconProps {
  size?: number;
  scheme?: LogoScheme;
  /** Texte vocalisé (par défaut « Axessio »). */
  "aria-label"?: string;
  className?: string;
}

export function AxIcon({
  size = 64,
  scheme = "light",
  "aria-label": ariaLabel = "Axessio",
  className,
}: AxIconProps) {
  const colors = SCHEMES[scheme];
  return (
    <svg
      role="img"
      aria-label={ariaLabel}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect
        width="64"
        height="64"
        rx="14"
        fill={colors.bg}
        stroke={colors.border ? "hsl(var(--border))" : "none"}
        strokeWidth={colors.border ? 1 : 0}
      />
      <text
        x="32"
        y="42"
        textAnchor="middle"
        fontFamily="var(--font-brand-sans)"
        fontSize="32"
        fontWeight="800"
        letterSpacing="-1.5"
        fill={colors.ax}
      >
        Ax
      </text>
      <circle cx="50" cy="50" r="3.5" fill={colors.a11y} />
    </svg>
  );
}
