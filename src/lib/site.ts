// Constantes SEO/marketing centralisées. Tout ce qui apparaît dans les
// `Metadata`, `robots.ts`, `sitemap.ts`, `manifest.ts`, le JSON-LD et les
// images OG doit pointer ici pour rester cohérent.

const FALLBACK_URL = "https://axessio.app";

function normalize(url: string): string {
  return url.replace(/\/+$/, "");
}

export const SITE = {
  name: "Axessio",
  shortName: "Axessio",
  tagline: {
    fr: "Plateforme SaaS d'audits d'accessibilité numérique",
    en: "Digital accessibility audit SaaS platform",
  },
  description: {
    fr: "Axessio centralise vos audits d'accessibilité numérique (RGAA, WCAG, RAWeb, RAAM). Saisie de conformité, gestion des non-conformités, rapports PDF — pour auditeurs et équipes clients.",
    en: "Axessio centralizes your digital accessibility audits (RGAA, WCAG, RAWeb, RAAM). Conformity tracking, non-conformity management, PDF reports — for auditors and client teams.",
  },
  keywords: [
    "accessibilité numérique",
    "digital accessibility",
    "audit accessibilité",
    "accessibility audit",
    "RGAA",
    "WCAG",
    "RAWeb",
    "RAAM",
    "PDF/UA",
    "EN 301 549",
    "conformité",
    "compliance",
    "SaaS",
    "Axessio",
  ],
  // Couleurs Axessio (navy de marque #1a4066 / point teal #06b6d4).
  themeColor: "#1a4066",
  backgroundColor: "#ffffff",
  twitter: "@axessio",
  locale: { fr: "fr_FR", en: "en_US" },
  url: normalize(process.env.NEXT_PUBLIC_APP_URL ?? FALLBACK_URL),
  // Adresse de support — utilisée par le lien « Contactez votre
  // administrateur » sur /login et les voies de retour a11y.
  supportEmail: "contact@axessio.app",
} as const;

export function siteUrl(path = "/"): string {
  if (!path.startsWith("/")) path = `/${path}`;
  return `${SITE.url}${path}`;
}
