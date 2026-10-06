/**
 * Liens de la navigation publique, dans l'ordre de la maquette. Partagés par
 * l'en-tête (serveur) et le menu mobile (client) pour éviter qu'ils divergent.
 * `key` est la clé i18n sous `home.nav`.
 */
export const PUBLIC_NAV_LINKS = [
  { href: "/features", key: "features" },
  { href: "/rgaa", key: "rgaa" },
  { href: "/pricing", key: "pricing" },
  { href: "/faq", key: "faq" },
] as const;
