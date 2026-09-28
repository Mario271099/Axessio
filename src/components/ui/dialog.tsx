"use client";

// Fenetre modale. Radix gere le focus, Echap, aria-modal et le verrou de
// defilement : on n'habille que le rendu.
//
// Gabarit des maquettes : voile encre a 55 %, fenetre blanche de rayon 22 px,
// en-tete « icone + titre + description » avec la croix en haut a droite,
// corps qui defile seul, pied avec « Annuler » a gauche de l'action
// principale. Le contenu n'a pas de marge interne : elle est portee par
// DialogHeader / DialogBody / DialogFooter.

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogClose = DialogPrimitive.Close;

/** Teinte de la pastille d'icone de l'en-tete. */
export const DIALOG_TONES = {
  primary: "bg-primary text-primary-foreground",
  destructive: "bg-destructive text-destructive-foreground",
  warning: "bg-warning text-warning-foreground",
  success: "bg-success text-success-foreground",
  ink: "bg-ink text-ink-foreground",
} as const;

export type DialogTone = keyof typeof DIALOG_TONES;

/** Largeurs des maquettes, de la confirmation courte au formulaire de NC. */
const SIZES = {
  sm: "sm:max-w-[440px]",
  md: "sm:max-w-[560px]",
  lg: "sm:max-w-[620px]",
  xl: "sm:max-w-[700px]",
  "2xl": "sm:max-w-[780px]",
} as const;

export function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        "fixed inset-0 z-50 bg-overlay/55",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out",
        "data-[state=open]:animate-in data-[state=open]:fade-in",
        className,
      )}
      {...props}
    />
  );
}

export function DialogContent({
  className,
  children,
  size = "md",
  closeLabel = "Fermer",
  closeClassName,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  size?: keyof typeof SIZES;
  closeLabel?: string;
  /** Pour les fenetres posees sur fond sombre (apercu de capture). */
  closeClassName?: string;
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 flex w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col",
          "max-h-[min(90dvh,900px)] overflow-hidden rounded-hero border border-border bg-card shadow-modal",
          "duration-300 ease-lift",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95",
          "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-bottom-3",
          SIZES[size],
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          className={cn(
            "absolute right-[18px] top-[18px] inline-flex size-10 items-center justify-center rounded-xl",
            "text-secondary-foreground transition-[background-color,color,transform] duration-200",
            "hover:rotate-90 hover:bg-primary-soft hover:text-foreground",
            "disabled:pointer-events-none",
            closeClassName,
          )}
          aria-label={closeLabel}
        >
          {/* Une croix qui redevient un plus au survol. */}
          <Plus className="size-5 rotate-45" strokeWidth={2.4} aria-hidden="true" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

export function DialogHeader({
  className,
  icon,
  tone = "primary",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  /** Icone lucide, posee dans une pastille de 44 px. */
  icon?: React.ReactNode;
  tone?: DialogTone;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3.5 pb-1.5 pl-[26px] pr-[68px] pt-6 text-left",
        className,
      )}
      {...props}
    >
      {icon && (
        <span
          aria-hidden="true"
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-[0.875rem] [&_svg]:size-[22px]",
            DIALOG_TONES[tone],
          )}
        >
          {icon}
        </span>
      )}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/** Corps de la fenetre : c'est lui qui defile quand le contenu depasse. */
export function DialogBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-[26px] pb-2 pt-3.5",
        className,
      )}
      {...props}
    />
  );
}

export function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mt-1.5 flex flex-col-reverse gap-2.5 border-t border-border bg-muted/30 px-[26px] pb-[22px] pt-4",
        "sm:flex-row sm:items-center sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

/** Indication discrete alignee a gauche du pied (raccourci clavier, etat). */
export function DialogFooterHint({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "flex items-center gap-1.5 text-[0.8rem] text-muted-foreground sm:mr-auto",
        className,
      )}
      {...props}
    />
  );
}

export function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn(
        "text-[1.375rem] font-black leading-[1.2] tracking-[-0.025em]",
        className,
      )}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn("mt-1 text-base leading-normal text-muted-foreground", className)}
      {...props}
    />
  );
}
