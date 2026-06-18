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

/**
 * Détecte la locale préférée depuis le header `Accept-Language` du navigateur.
 * Parcourt les langues par ordre de qualité (q) décroissant et retourne la
 * première supportée. Fallback : DEFAULT_LOCALE (fr). Utilisée par le proxy
 * pour poser le cookie au premier chargement - un choix explicite de
 * l'utilisateur (LanguageToggle) prime ensuite via le cookie.
 */
export function detectLocaleFromHeader(header: string | null): Locale {
  if (!header) return DEFAULT_LOCALE;

  const candidates = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const qParam = params.find((p) => p.trim().startsWith("q="));
      const q = qParam ? Number.parseFloat(qParam.trim().slice(2)) : 1;
      return {
        // "en-US" → "en" ; insensible à la casse.
        lang: (tag ?? "").trim().toLowerCase().split("-")[0] ?? "",
        q: Number.isFinite(q) ? q : 0,
      };
    })
    .filter((c) => c.lang.length > 0 && c.q > 0)
    .sort((a, b) => b.q - a.q);

  for (const candidate of candidates) {
    if (isLocale(candidate.lang)) return candidate.lang;
  }
  return DEFAULT_LOCALE;
}
