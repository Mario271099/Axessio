"use client";

// Entree de navigation du design system « Pro H ». Partagee par la sidebar
// 256 px, le rail 76 px des pages d'audit et le drawer mobile : une seule
// source de verite pour le rendu (la config des entrees reste dans
// `nav-config.tsx`).

import Link from "next/link";
import { cn } from "@/lib/utils";

interface BaseProps {
  label: string;
  icon: React.ElementType;
  /** Entree correspondant a la page courante. */
  active?: boolean;
}

export type NavLinkProps = BaseProps &
  React.ComponentProps<typeof Link> & {
    /** Compteur affiche en pastille a droite (masque si 0). */
    badge?: number;
  };

/**
 * Entree pleine largeur : icone + libelle + compteur.
 * Actif = fond cobalt et texte blanc ; survol = fond cobalt tres clair et
 * icone qui grossit legerement.
 */
export function NavLink({
  label,
  icon: Icon,
  active = false,
  badge = 0,
  className,
  ...rest
}: NavLinkProps) {
  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex h-[42px] items-center gap-3 rounded-lg px-3 text-base font-semibold transition-colors duration-200",
        active
          ? "bg-primary text-primary-foreground"
          : "text-secondary-foreground hover:bg-primary-soft hover:text-foreground",
        className,
      )}
      {...rest}
    >
      <Icon
        aria-hidden="true"
        className={cn(
          "size-[19px] shrink-0 transition-[color,transform] duration-200",
          active
            ? "text-primary-foreground"
            : "text-muted-foreground group-hover:scale-110 group-hover:text-primary",
        )}
      />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {badge > 0 && (
        <span
          className={cn(
            "inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-[7px] text-xs font-extrabold tabular",
            active
              ? "bg-primary-foreground/20 text-primary-foreground"
              : "bg-primary-muted text-primary",
          )}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

/**
 * Entree du rail 76 px : icone seule, le libelle apparait en info-bulle au
 * survol et au focus clavier. L'info-bulle porte le nom accessible du lien,
 * elle reste donc annoncee par les lecteurs d'ecran meme masquee a l'oeil.
 */
export function RailNavLink({
  label,
  icon: Icon,
  active = false,
  className,
  ...rest
}: BaseProps & React.ComponentProps<typeof Link>) {
  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex size-11 shrink-0 items-center justify-center rounded-row transition-colors duration-150",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-primary-soft hover:text-primary",
        className,
      )}
      {...rest}
    >
      <Icon aria-hidden="true" className="size-5" />
      <span
        className={cn(
          "pointer-events-none absolute left-[calc(100%+12px)] top-1/2 z-20 -translate-x-1 -translate-y-1/2",
          "whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-[0.82rem] font-bold text-ink-foreground",
          "opacity-0 transition duration-150",
          "group-hover:translate-x-0 group-hover:opacity-100",
          "group-focus-visible:translate-x-0 group-focus-visible:opacity-100",
        )}
      >
        {label}
      </span>
    </Link>
  );
}
