import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "flex min-h-24 w-full resize-y rounded-lg border border-input bg-card px-3.5 py-3 text-base leading-relaxed text-foreground",
        "transition-colors duration-150",
        "placeholder:text-muted-foreground",
        "hover:border-primary focus:border-primary",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-input",
        "aria-[invalid=true]:border-destructive",
        className,
      )}
      {...props}
    />
  );
}
