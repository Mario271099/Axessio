// Configuration partagée de l'internationalisation.
// Locale par défaut = français (legacy de l'app). On supporte fr / en pour V1.
// La langue choisie est persistée dans un cookie « locale » (1 an).

export const LOCALES = ["fr", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "fr";

export const LOCALE_COOKIE = "axessio-locale";

export const LOCALE_LABELS: Record<Locale, string> = {
  fr: "Français",
  en: "English",
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  fr: "FR",
  en: "EN",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}
