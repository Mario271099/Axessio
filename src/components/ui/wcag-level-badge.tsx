// Badge de niveau WCAG (A / AA / AAA). Ne rend rien si le critère n'a pas de
// niveau (référentiels non-WCAG : RGAA, RAWeb, RAAM). Code couleur :
// A = vert (base), AA = ambre (légal), AAA = violet (renforcé).
const LEVEL_STYLES: Record<string, string> = {
  A: "bg-success/15 text-success",
  AA: "bg-warning/15 text-warning",
  AAA: "bg-primary/15 text-primary",
};

export function WcagLevelBadge({
  level,
  className,
  "aria-label": ariaLabel,
}: {
  level: string | null | undefined;
  className?: string;
  "aria-label"?: string;
}) {
  if (!level) return null;
  const style = LEVEL_STYLES[level] ?? "bg-muted text-muted-foreground";
  return (
    <span
      className={
        "inline-flex shrink-0 items-center rounded px-1.5 py-0.5 font-mono text-[0.65rem] font-semibold uppercase leading-none tracking-wide " +
        style +
        (className ? " " + className : "")
      }
      aria-label={ariaLabel ?? `Niveau WCAG ${level}`}
      title={`Niveau WCAG ${level}`}
    >
      {level}
    </span>
  );
}
