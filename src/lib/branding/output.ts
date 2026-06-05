// Branding "sortie" (output) — la forme du branding telle qu'elle est injectée
// dans les emails et le PDF. Volontairement séparée de `OrgBranding` (qui est
// la forme brute des colonnes DB) parce que la sortie est toujours résolue :
// un champ manquant retombe sur la valeur Axessyo par défaut, jamais null.
//
// Ce module ne dépend ni de la DB ni de `server-only` : il ne contient que des
// helpers purs (sanitization), ce qui les rend testables en isolation.

export interface OutputBranding {
  /** Nom de marque affiché (nom de l'org si custom, sinon "Axessyo"). */
  brandName: string;
  /** URL absolue https du logo, ou null → on rend un wordmark texte. */
  logoUrl: string | null;
  /** Couleur primaire HEX (#RRGGBB) pour les CTA / entêtes. */
  primaryColor: string;
  /** Sous-titre sous le logo ; null pour les orgs white-label. */
  tagline: string | null;
  /** Email de contact (reply-to), ou null. */
  supportEmail: string | null;
  /** True si le branding provient d'une org (plan avec `branding.custom`). */
  isCustom: boolean;
}

export const AXESSIO_DEFAULT_OUTPUT_BRANDING: OutputBranding = {
  brandName: "Axessyo",
  logoUrl: null,
  primaryColor: "#0f172a",
  tagline: "Plateforme d'audits d'accessibilité numérique",
  supportEmail: null,
  isCustom: false,
};

/**
 * Valide une couleur HEX #RRGGBB. Retourne `fallback` si invalide — on injecte
 * cette valeur dans du CSS inline (email + PDF), donc une valeur non validée
 * permettrait une injection de style. La page branding valide déjà à la
 * saisie, mais on re-valide ici par défense en profondeur.
 */
export function sanitizeHexColor(
  value: string | null | undefined,
  fallback = AXESSIO_DEFAULT_OUTPUT_BRANDING.primaryColor,
): string {
  if (typeof value !== "string") return fallback;
  return /^#[0-9a-fA-F]{6}$/.test(value.trim()) ? value.trim() : fallback;
}

/**
 * Valide qu'un logo est une URL absolue https. Les emails et le PDF chargent
 * cette URL côté client/headless : on refuse tout ce qui n'est pas https
 * (http, data:, javascript:, chemin relatif) pour éviter mixed-content et
 * tout schéma exotique. Retourne null si invalide → wordmark texte.
 */
export function sanitizeLogoUrl(value: string | null | undefined): string | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
