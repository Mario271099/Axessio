// Consentement cookies (banniere <CookieConsentBanner />). Source de verite
// unique de la cle localStorage et des valeurs possibles, partagee entre la
// banniere et l'init Sentry (instrumentation-client.ts) pour eviter toute
// divergence de nom de cle.

export const CONSENT_KEY = "axessyo_cookie_consent";

export type Consent = "accepted" | "refused";

/** Lit le choix stocke, ou null si aucun choix (ou localStorage indisponible). */
export function getStoredConsent(): Consent | null {
  try {
    const value = window.localStorage.getItem(CONSENT_KEY);
    return value === "accepted" || value === "refused" ? value : null;
  } catch {
    // localStorage indisponible (mode prive strict) : pas de choix exploitable.
    return null;
  }
}
