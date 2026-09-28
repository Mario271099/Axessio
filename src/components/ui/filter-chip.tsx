import { cn } from "@/lib/utils";

interface FilterChipProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  label: string;
  /** Filtre actif : la pilule passe en encre. */
  pressed: boolean;
  /** Nombre d'éléments correspondants, affiché à droite du libellé. */
  count?: number;
  icon?: React.ReactNode;
}

/**
 * Pilule de filtre du design system « Pro H ». 36 px de haut, bordure au
 * repos, fond encre et texte blanc quand le filtre est actif — l'état est
 * porté par `aria-pressed`, pas seulement par la couleur.
 */
export function FilterChip({
  label,
  pressed,
  count,
  icon,
  className,
  ...props
}: FilterChipProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={cn(
        "inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-full border px-3.5 text-sm font-bold",
        "transition-[background-color,border-color,color] duration-150",
        pressed
          ? "border-ink bg-ink text-ink-foreground"
          : "border-border-strong bg-card text-foreground hover:border-primary",
        className,
      )}
      {...props}
    >
      {icon}
      {label}
      {count != null && (
        <span className="text-xs font-extrabold tabular opacity-75">
          {count}
        </span>
      )}
    </button>
  );
}
