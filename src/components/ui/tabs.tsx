"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;

/**
 * Onglets soulignes du design system « Pro H » : le soulignement cobalt
 * s'etend a mi-course au survol, puis entierement sur l'onglet actif.
 */
export function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        "flex items-center gap-7 overflow-x-auto border-b border-border",
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "relative inline-flex h-12 shrink-0 items-center gap-2 whitespace-nowrap text-base font-bold text-muted-foreground",
        "transition-colors duration-150",
        "after:absolute after:inset-x-0 after:-bottom-px after:h-[3px] after:origin-bottom after:scale-x-0 after:rounded-t-[3px] after:bg-primary after:transition-transform after:duration-200",
        "hover:text-foreground hover:after:scale-x-50",
        "disabled:pointer-events-none disabled:opacity-50",
        "data-[state=active]:text-primary data-[state=active]:after:scale-x-100",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn("mt-4", className)} {...props} />;
}
