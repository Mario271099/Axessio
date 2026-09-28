"use client";

// Boite de confirmation accessible - remplace `window.confirm()`.
// Wrapping minimal de Radix AlertDialog (focus auto, role="alertdialog",
// fermeture a Esc). Semantiquement distinct de Dialog : pour les actions
// destructrices qui exigent une confirmation explicite, donc sans croix de
// fermeture — on choisit entre « Annuler » et l'action.
//
// Gabarit des maquettes : fenetre etroite, icone posee au-dessus du titre,
// pied sans filet ni fond teinte.

import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { DIALOG_TONES, type DialogTone } from "@/components/ui/dialog";

export const AlertDialog = AlertDialogPrimitive.Root;
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
export const AlertDialogPortal = AlertDialogPrimitive.Portal;

export function AlertDialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  return (
    <AlertDialogPrimitive.Overlay
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

export function AlertDialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content>) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 flex w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col",
          "max-h-[min(90dvh,900px)] overflow-hidden rounded-hero border border-border bg-card shadow-modal",
          "duration-300 ease-lift sm:max-w-[420px]",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95",
          "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-bottom-3",
          className,
        )}
        {...props}
      >
        {children}
      </AlertDialogPrimitive.Content>
    </AlertDialogPortal>
  );
}

export function AlertDialogHeader({
  className,
  icon,
  tone = "destructive",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  /** Icone lucide, posee dans une pastille de 44 px au-dessus du titre. */
  icon?: React.ReactNode;
  tone?: DialogTone;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 px-[26px] pb-2 pt-[26px] text-left",
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
      {children}
    </div>
  );
}

/** Complement facultatif sous la description (consequence chiffree, rappel). */
export function AlertDialogBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-[26px] pb-1 pt-3",
        className,
      )}
      {...props}
    />
  );
}

export function AlertDialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2.5 px-[26px] pb-[22px] pt-4",
        "sm:flex-row sm:items-center sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

export function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      className={cn(
        "text-xl font-black leading-[1.2] tracking-[-0.025em]",
        className,
      )}
      {...props}
    />
  );
}

export function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      className={cn("text-base leading-normal text-muted-foreground", className)}
      {...props}
    />
  );
}

export function AlertDialogAction({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action> & {
  variant?: "default" | "destructive" | "dark";
}) {
  return (
    <AlertDialogPrimitive.Action
      className={cn(buttonVariants({ variant }), className)}
      {...props}
    />
  );
}

export function AlertDialogCancel({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
  return (
    <AlertDialogPrimitive.Cancel
      className={cn(buttonVariants({ variant: "outline" }), className)}
      {...props}
    />
  );
}
