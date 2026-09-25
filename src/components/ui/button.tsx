import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Bouton du design system « Pro H ».
 *
 * - hauteur 44 px, rayon 10 px, graisse 700 ;
 * - `default` porte l'ombre cobalt, qui se creuse au survol ;
 * - `:active` ecrase legerement le bouton (scale .97) ;
 * - une icone `data-anim="spin"` pivote de 90 degres au survol,
 *   `data-anim="go"` glisse vers la droite (voir .axs-btn dans globals.css) ;
 * - le focus est l'anneau cobalt global de 3 px (regle *:focus-visible).
 */
const buttonVariants = cva(
  "axs-btn inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg " +
    "text-base font-bold leading-none " +
    "transition-[background-color,border-color,box-shadow,color,transform] duration-200 " +
    "active:scale-[0.97] " +
    "disabled:pointer-events-none disabled:opacity-50 " +
    "[&_svg]:pointer-events-none [&_svg]:size-[17px] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-btn hover:bg-primary-hover hover:shadow-btn-hover",
        outline:
          "border border-border-strong bg-card text-foreground hover:border-primary hover:bg-primary-softer",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-primary-soft hover:text-primary",
        ghost:
          "text-secondary-foreground hover:bg-primary-soft hover:text-primary",
        destructive:
          "bg-destructive text-destructive-foreground shadow-btn-danger hover:bg-destructive/90",
        dark: "bg-ink text-ink-foreground hover:bg-ink-raised",
        link: "text-primary underline decoration-1 underline-offset-4 hover:decoration-2",
      },
      size: {
        default: "h-11 px-[18px]",
        sm: "h-9 px-3.5 text-sm [&_svg]:size-4",
        lg: "h-[54px] rounded-[14px] px-6 text-[1.05rem]",
        icon: "size-11 p-0",
        "icon-sm": "size-10 rounded-lg p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { buttonVariants };
