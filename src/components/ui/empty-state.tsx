// EmptyState - composant partagé pour les états vides (listes sans résultats,
// premières connexions, etc.). Volontairement sans interactivité interne :
// le caller fournit son propre CTA via `children` (lien, bouton, dialog…).

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  icon?: LucideIcon;
  title: string;
  description?: string;
  /** CTA(s) - bouton, lien, etc. Rendu sous le texte. */
  children?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border py-12 px-6 text-center",
        className,
      )}
    >
      {Icon && (
        <div
          aria-hidden="true"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
        >
          <Icon className="h-6 w-6" />
        </div>
      )}
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {children && <div className="mt-2 flex flex-wrap items-center justify-center gap-2">{children}</div>}
    </div>
  );
}
