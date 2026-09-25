import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine et déduplique des classes Tailwind.
 * `cn("p-2", isError && "text-red-500", undefined)` → "p-2 text-red-500"
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDate(input: string | Date | null | undefined): string {
  if (!input) return "—";
  const date = typeof input === "string" ? new Date(input) : input;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(input: string | Date | null | undefined): string {
  if (!input) return "—";
  const date = typeof input === "string" ? new Date(input) : input;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return "—";
  return `${score.toFixed(2).replace(/\.?0+$/, "")}%`;
}

export function initials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

/**
 * Monogramme d'une entité (client, organisation, projet) : deux lettres au
 * plus. « Mairie de Valmont » → « MV », « Ipedis » → « IP ».
 */
export function monogram(name: string | null | undefined): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  const first = words[0];
  const last = words[words.length - 1];
  if (!first || !last) return "?";
  if (words.length === 1) return first.slice(0, 2).toUpperCase();
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

/**
 * Couleur de thématique (1 à 13) dérivée d'une chaîne, sous forme de
 * référence CSS. Un même client garde ainsi la même couleur de monogramme
 * d'un écran à l'autre, sans stocker quoi que ce soit en base.
 */
export function themeColorVar(seed: string | null | undefined): string {
  const value = seed ?? "";
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % 104729;
  }
  return `var(--theme-${(hash % 13) + 1})`;
}
