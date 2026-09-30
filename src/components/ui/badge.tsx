import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Pastille du design system « Pro H » : fond plein pastel, pas de bordure,
 * graisse 800. La couleur ne porte jamais seule l'information : le libelle
 * reste toujours present dans le badge.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-extrabold " +
    "transition-colors duration-150",
  {
    variants: {
      variant: {
        default: "bg-primary-muted text-primary",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-severity-critical-bg text-severity-critical",
        success: "bg-success-bg text-success-text",
        warning: "bg-warning-bg text-warning-text",
        outline: "border border-border-strong bg-transparent text-foreground",
        muted: "bg-muted text-muted-foreground",
        ink: "bg-ink text-ink-foreground",
        highlight: "bg-highlight text-ink",
      },
      size: {
        default: "h-7 px-3 text-[0.84rem]",
        sm: "h-6 px-2.5 text-xs",
        /** Compteur d'onglet / de navigation (ex. « Echantillon 10 »). */
        count: "h-5 min-w-5 justify-center px-1.5 text-xs tabular",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { badgeVariants };
