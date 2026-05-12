// Wordmark Axessio — signature typographique de marque.
// Conventions Axessio :
//   - Pas de forwardRef (style React 19).
//   - Props directes, défaut « light ».
//   - Couleurs câblées sur les tokens CSS `--brand-*` définis dans
//     globals.css → respecte le mode clair/sombre du design system.
//   - DM Sans (300/800) + DM Mono (500) chargées dans app/layout.tsx
//     via next/font/google.
// Cf. design_handoff_axessio_logo/README.md pour les spécifications
// typographiques exactes (-0.04em, 4× scale gap vertical, etc.).

import { cn } from "@/lib/utils";

export type LogoScheme = "light" | "dark" | "mono" | "accent" | "teal";

interface SchemeColors {
  ax: string;
  essio: string;
  badgeBg: string;
  badgeFg: string;
  ruleA: string;
  ruleB: string;
  sub: string;
}

const SCHEMES: Record<LogoScheme, SchemeColors> = {
  light: {
    ax: "hsl(var(--brand-accent))",
    essio: "hsl(var(--brand-text))",
    badgeBg: "hsl(var(--brand-teal-light))",
    badgeFg: "hsl(var(--brand-teal))",
    ruleA: "hsl(var(--brand-accent))",
    ruleB: "hsl(var(--brand-teal-mid))",
    sub: "hsl(var(--brand-text-muted))",
  },
  dark: {
    ax: "hsl(var(--brand-indigo-200))",
    essio: "#FFFFFF",
    badgeBg: "hsl(var(--brand-mint-300) / 0.18)",
    badgeFg: "hsl(var(--brand-mint-300))",
    ruleA: "hsl(var(--brand-accent-mid))",
    ruleB: "hsl(var(--brand-mint-300))",
    sub: "rgba(255,255,255,0.55)",
  },
  mono: {
    ax: "hsl(var(--brand-text))",
    essio: "hsl(var(--brand-text))",
    badgeBg: "hsl(var(--brand-text) / 0.06)",
    badgeFg: "hsl(var(--brand-text))",
    ruleA: "hsl(var(--brand-text))",
    ruleB: "hsl(var(--brand-text))",
    sub: "hsl(var(--brand-text-muted))",
  },
  accent: {
    ax: "#FFFFFF",
    essio: "rgba(255,255,255,0.92)",
    badgeBg: "rgba(255,255,255,0.18)",
    badgeFg: "#FFFFFF",
    ruleA: "#FFFFFF",
    ruleB: "hsl(var(--brand-mint-300))",
    sub: "rgba(255,255,255,0.6)",
  },
  teal: {
    ax: "#FFFFFF",
    essio: "rgba(255,255,255,0.92)",
    badgeBg: "rgba(255,255,255,0.18)",
    badgeFg: "#FFFFFF",
    ruleA: "#FFFFFF",
    ruleB: "hsl(var(--brand-indigo-200))",
    sub: "rgba(255,255,255,0.65)",
  },
};

export interface WordmarkProps {
  /** Multiplicateur global de la taille (1 = 32 px de capitale). */
  scale?: number;
  scheme?: LogoScheme;
  showBadge?: boolean;
  showRule?: boolean;
  showSub?: boolean;
  subtitle?: string;
  className?: string;
  /** Texte vocalisé par les AT (par défaut « Axessio A11Y Desk »). */
  "aria-label"?: string;
}

export function Wordmark({
  scale = 1,
  scheme = "light",
  showBadge = true,
  showRule = true,
  showSub = true,
  subtitle = "Accessibility Desk",
  className,
  "aria-label": ariaLabel = "Axessio A11Y Desk",
}: WordmarkProps) {
  const colors = SCHEMES[scheme];

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={cn("inline-flex flex-col", className)}
      style={{ gap: 4 * scale }}
    >
      <div
        className="flex items-baseline"
        style={{ gap: 1 * scale }}
      >
        <span
          style={{
            fontFamily: "var(--font-brand-sans)",
            fontSize: 32 * scale,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            color: colors.ax,
            lineHeight: 1,
          }}
        >
          Ax
        </span>
        <span
          style={{
            fontFamily: "var(--font-brand-sans)",
            fontSize: 32 * scale,
            fontWeight: 300,
            letterSpacing: "-0.04em",
            color: colors.essio,
            lineHeight: 1,
          }}
        >
          essio
        </span>
        {showBadge && (
          <span
            aria-hidden="true"
            style={{
              fontFamily: "var(--font-brand-mono)",
              fontSize: 10 * scale,
              fontWeight: 500,
              letterSpacing: "0.05em",
              color: colors.badgeFg,
              background: colors.badgeBg,
              padding: `${2 * scale}px ${5 * scale}px`,
              borderRadius: 4 * scale,
              marginLeft: 5 * scale,
              marginTop: 2 * scale,
              alignSelf: "flex-start",
              lineHeight: 1.2,
            }}
          >
            A11Y
          </span>
        )}
      </div>

      {showRule && (
        <div
          aria-hidden="true"
          style={{
            width: "100%",
            height: 2 * scale,
            background: `linear-gradient(90deg, ${colors.ruleA}, ${colors.ruleB})`,
            borderRadius: 99,
          }}
        />
      )}

      {showSub && (
        <div
          aria-hidden="true"
          style={{
            fontFamily: "var(--font-brand-mono)",
            fontSize: 10 * scale,
            fontWeight: 500,
            letterSpacing: "0.18em",
            color: colors.sub,
            textTransform: "uppercase",
            lineHeight: 1,
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
}
