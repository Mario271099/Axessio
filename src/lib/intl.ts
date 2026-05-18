/**
 * Convertit le code locale next-intl (`fr` / `en`) vers le tag BCP-47
 * attendu par les APIs `Intl.*` (`fr-FR` / `en-US`).
 */
export function intlLocale(locale: string): string {
  return locale === "en" ? "en-US" : "fr-FR";
}
