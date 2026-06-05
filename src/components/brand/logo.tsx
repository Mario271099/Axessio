// Logo Axessyo — signature complète : monogramme « A y » (carré navy + trait +
// point teal A11Y) accolé au wordmark « Axessyo ».
//
// Conventions Axessyo :
//   - Pas de forwardRef (style React 19), props directes.
//   - La variante « default » est câblée sur les tokens `--brand-*` de
//     globals.css → s'adapte automatiquement au mode clair/sombre.
//   - Les variantes « light » (fond sombre) et « mono » utilisent des couleurs
//     fixes, pour les contextes où le thème n'est pas résolu.
//   - Police : DM Sans 800 (var --font-brand-sans), chargée dans app/layout.tsx.

type LogoVariant = "default" | "light" | "mono";
type LogoSize = "sm" | "md" | "lg" | "xl";

interface LogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  showWordmark?: boolean;
  className?: string;
}

const sizes: Record<
  LogoSize,
  { icon: number; radius: number; stroke: number; dot: number; cx: number; cy: number; font: number; gap: number }
> = {
  sm: { icon: 24, radius: 6, stroke: 3.8, dot: 2, cx: 16, cy: 6, font: 14, gap: 6 },
  md: { icon: 32, radius: 8, stroke: 3.4, dot: 2.4, cx: 21, cy: 8, font: 17, gap: 8 },
  lg: { icon: 40, radius: 10, stroke: 3.2, dot: 2.8, cx: 26, cy: 10, font: 20, gap: 10 },
  xl: { icon: 56, radius: 14, stroke: 3.4, dot: 4, cx: 37, cy: 14, font: 28, gap: 12 },
};

interface VariantColors {
  bg: string;
  stroke: string;
  dot: string;
  ink: string;
  accent: string;
  border?: string;
}

const colors: Record<LogoVariant, VariantColors> = {
  // Câblée sur les tokens → suit le thème clair/sombre.
  default: {
    bg: "hsl(var(--brand-navy))",
    stroke: "#ffffff",
    dot: "hsl(var(--brand-teal))",
    ink: "hsl(var(--brand-text))",
    accent: "hsl(var(--brand-accent))",
  },
  // Pour fond sombre fixe (panneaux marketing, hero).
  light: {
    bg: "rgba(255,255,255,0.10)",
    stroke: "#ffffff",
    dot: "#22d3ee",
    ink: "#ffffff",
    accent: "#22d3ee",
    border: "rgba(255,255,255,0.14)",
  },
  mono: {
    bg: "#1a4066",
    stroke: "#ffffff",
    dot: "#ffffff",
    ink: "#0f172a",
    accent: "#0f172a",
  },
};

export function Logo({
  variant = "default",
  size = "lg",
  showWordmark = true,
  className,
}: LogoProps) {
  const s = sizes[size];
  const c = colors[variant];
  const scale = s.icon / 56;

  // Paths tracés sur un viewBox 56×56, mis à l'échelle de la taille demandée.
  const iconPaths = {
    a1: `M${10 * scale} ${40 * scale} L${15.8 * scale} ${14 * scale}c${0.4 * scale} ${-1.6 * scale} ${2.6 * scale} ${-1.6 * scale} ${3 * scale} 0L${22.5 * scale} ${28 * scale}`,
    bar: `M${12.5 * scale} ${31.5 * scale}h${8 * scale}`,
    y1: `M${26 * scale} ${20 * scale} L${33.5 * scale} ${34 * scale}`,
    y2: `M${41 * scale} ${20 * scale} L${33.5 * scale} ${34 * scale}`,
    y3: `M${33.5 * scale} ${34 * scale} L${30.5 * scale} ${44 * scale}`,
  };

  return (
    <span
      className={className}
      style={{ display: "inline-flex", alignItems: "center", gap: s.gap }}
    >
      <svg
        width={s.icon}
        height={s.icon}
        viewBox={`0 0 ${s.icon} ${s.icon}`}
        fill="none"
        aria-hidden="true"
      >
        <rect
          width={s.icon}
          height={s.icon}
          rx={s.radius}
          fill={c.bg}
          stroke={c.border}
          strokeWidth={c.border ? 1 : 0}
        />
        <path d={iconPaths.a1} stroke={c.stroke} strokeWidth={s.stroke} strokeLinecap="round" strokeLinejoin="round" />
        <path d={iconPaths.bar} stroke={c.stroke} strokeWidth={s.stroke} strokeLinecap="round" />
        <path d={iconPaths.y1} stroke={c.stroke} strokeWidth={s.stroke} strokeLinecap="round" />
        <path d={iconPaths.y2} stroke={c.stroke} strokeWidth={s.stroke} strokeLinecap="round" />
        <path d={iconPaths.y3} stroke={c.stroke} strokeWidth={s.stroke} strokeLinecap="round" />
        <circle cx={s.cx} cy={s.cy} r={s.dot} fill={c.dot} />
      </svg>

      {showWordmark && (
        <span
          style={{
            fontFamily: "var(--font-brand-sans), sans-serif",
            fontWeight: 800,
            fontSize: s.font,
            letterSpacing: "-0.045em",
            lineHeight: 1,
            userSelect: "none",
          }}
        >
          <span style={{ color: c.ink }}>Axes</span>
          <span style={{ color: c.accent }}>syo</span>
        </span>
      )}
    </span>
  );
}

// Raccourci icône seule.
export function LogoIcon({ size = "md", variant = "default", className }: Omit<LogoProps, "showWordmark">) {
  return <Logo size={size} variant={variant} showWordmark={false} className={className} />;
}
