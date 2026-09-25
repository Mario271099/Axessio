import { cn } from "@/lib/utils";

interface StatusDotProps {
  /** Couleur du point (valeur CSS, en général `hsl(var(--token))`). */
  color: string;
  /** Libellé — toujours présent : la couleur ne porte jamais seule le sens. */
  children: React.ReactNode;
  className?: string;
}

/** Point de couleur suivi de son libellé (statuts de NC, d'invitation…). */
export function StatusDot({ color, children, className }: StatusDotProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 whitespace-nowrap text-[0.84rem] font-bold",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="size-2 shrink-0 rounded-full"
        style={{ background: color }}
      />
      {children}
    </span>
  );
}
