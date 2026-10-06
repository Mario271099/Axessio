/**
 * Navigation publique, dans l'ordre d'affichage. Partagée par l'en-tête
 * (serveur) et le menu mobile (client) pour éviter qu'ils divergent.
 *
 * - Lien simple : `key` est la clé i18n sous `home.nav`.
 * - Groupe (sous-menu) : `key` est la clé i18n du libellé sous `home.nav` ;
 *   chaque entrée reprend titre et description de `marketing.related`.
 */
export const PUBLIC_NAV = [
  { kind: "link", href: "/features", key: "features" },
  {
    kind: "group",
    key: "standards",
    items: [
      { href: "/rgaa", key: "rgaa" },
      { href: "/wcag", key: "wcag" },
      { href: "/raweb", key: "raweb" },
      { href: "/raam", key: "raam" },
    ],
  },
  { kind: "link", href: "/pricing", key: "pricing" },
  {
    kind: "group",
    key: "resources",
    items: [
      { href: "/faq", key: "faq" },
      { href: "/security", key: "security" },
      { href: "/about", key: "about" },
    ],
  },
  { kind: "link", href: "/contact", key: "contact" },
] as const;

export type PublicNavEntry = (typeof PUBLIC_NAV)[number];

/** Entrée de sous-menu, libellés déjà traduits (passée aux composants client). */
export type NavGroupItem = { href: string; title: string; desc: string };
