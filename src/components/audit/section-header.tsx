import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  icon: React.ElementType;
  title: string;
  description?: string;
  className?: string;
  /** Ton de l'icône — détermine la couleur de la pastille. */
  tone?: "primary" | "warning" | "success" | "muted";
}

const TONE_CLASSES = {
  primary: "bg-primary/10 text-primary",
  warning: "bg-warning/10 text-warning",
  success: "bg-success/10 text-success",
  muted: "bg-muted text-muted-foreground",
} as const;

/**
 * En-tête de section pour le dashboard d'audit. Donne une structure claire
 * et scannable à la page : un h2 + icône colorée + description courte.
 */
export function SectionHeader({
  icon: Icon,
  title,
  description,
  className,
  tone = "primary",
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-start gap-3 pt-2", className)}>
      <div
        aria-hidden="true"
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          TONE_CLASSES[tone],
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}
