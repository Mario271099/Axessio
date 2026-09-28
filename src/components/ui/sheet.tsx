"use client";

// Panneau lateral (menu mobile). Meme primitive Radix que Dialog : le focus,
// Echap et aria-modal sont deja geres.
//
// Gabarit des maquettes : voile encre a 55 %, panneau blanc arrondi sur son
// bord interieur (24 px), entree par glissement, lignes de navigation de
// 52 px.

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetPortal = DialogPrimitive.Portal;
export const SheetClose = DialogPrimitive.Close;

export function SheetOverlay({
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

const SIDE_CLASSES = {
  right:
    "inset-y-0 right-0 rounded-l-[1.5rem] border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
  left: "inset-y-0 left-0 rounded-r-[1.5rem] border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
} as const;

export function SheetContent({
  side = "right",
  className,
  children,
  closeLabel = "Fermer",
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  side?: keyof typeof SIDE_CLASSES;
  closeLabel?: string;
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Content
        className={cn(
          "fixed z-50 flex h-full w-[312px] max-w-[calc(100vw-3rem)] flex-col gap-4 overflow-y-auto",
          "border-border bg-card px-3.5 py-[18px] shadow-modal",
          "duration-300 ease-lift data-[state=closed]:animate-out data-[state=open]:animate-in",
          SIDE_CLASSES[side],
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          className={cn(
            "absolute right-3.5 top-[18px] inline-flex size-10 items-center justify-center rounded-xl",
            "text-secondary-foreground transition-[background-color,color,transform] duration-200",
            "hover:rotate-90 hover:bg-primary-soft hover:text-foreground",
          )}
          aria-label={closeLabel}
        >
          <Plus className="size-5 rotate-45" strokeWidth={2.4} aria-hidden="true" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </SheetPortal>
  );
}

export function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn(
        "pr-12 text-lg font-extrabold tracking-[-0.025em]",
        className,
      )}
      {...props}
    />
  );
}

export function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

/**
 * Classes d'une ligne de navigation du panneau : 52 px, cobalt plein quand
 * elle est active. Rendu sous forme de classes et non de composant, pour
 * rester posable sur un `<Link>` de Next (navigation cote client).
 */
export function sheetNavLink(active = false) {
  return cn(
    "flex h-[52px] items-center gap-3.5 rounded-xl px-3.5 text-base font-bold transition-colors",
    "[&_svg]:size-5 [&_svg]:shrink-0",
    active
      ? "bg-primary text-primary-foreground [&_svg]:text-primary-foreground"
      : "text-foreground hover:bg-primary-soft [&_svg]:text-muted-foreground",
  );
}
