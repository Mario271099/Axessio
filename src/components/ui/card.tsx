import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Active le hover « lift » : la carte monte de 3 px et prend la couleur du
   * contexte (variable CSS `--lift-color`, cobalt par defaut).
   * A reserver aux cartes effectivement cliquables (lien, action).
   */
  interactive?: boolean;
  /**
   * `ink` : carte sombre des blocs de synthese (score moyen, plan, astuce).
   * Le texte secondaire s'y ecrit en `text-ink-muted`.
   */
  tone?: "default" | "ink";
}

export function Card({
  className,
  interactive,
  tone = "default",
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card border",
        tone === "ink"
          ? "border-ink bg-ink text-ink-foreground"
          : "border-border bg-card text-card-foreground",
        interactive && "axs-lift cursor-pointer",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-1 p-5 pb-3", className)}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-lg font-extrabold leading-tight tracking-tight",
        className,
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)} {...props} />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pt-0", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center p-5 pt-0", className)} {...props} />
  );
}
