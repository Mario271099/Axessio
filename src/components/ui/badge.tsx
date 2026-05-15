import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  // Bordure 1 px colorée de la même teinte que le fond — donne le rendu
  // « pastille » caractéristique du DS Linear/Stripe.
  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium " +
    "transition-colors duration-150 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-primary/20 bg-primary/10 text-primary hover:bg-primary/15",
        secondary:
          "border-secondary bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/15",
        success:
          "border-success/20 bg-success/10 text-success hover:bg-success/15",
        warning:
          "border-warning/20 bg-warning/10 text-warning hover:bg-warning/15",
        outline: "border-border bg-transparent text-foreground",
        muted:
          "border-muted bg-muted text-muted-foreground hover:bg-muted/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { badgeVariants };
