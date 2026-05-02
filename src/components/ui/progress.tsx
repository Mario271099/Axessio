"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.ComponentProps<
  typeof ProgressPrimitive.Root
> {
  value?: number | null;
  fillColor?: string;
}

export function Progress({
  className,
  value,
  fillColor,
  ...props
}: ProgressProps) {
  return (
    <ProgressPrimitive.Root
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-secondary",
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 bg-primary transition-all"
        style={{
          transform: `translateX(-${100 - (value ?? 0)}%)`,
          backgroundColor: fillColor ? `hsl(${fillColor})` : undefined,
        }}
      />
    </ProgressPrimitive.Root>
  );
}
