// Constantes SEO/marketing centralisées. Tout ce qui apparaît dans les
// `Metadata`, `robots.ts`, `sitemap.ts`, `manifest.ts`, le JSON-LD et les
// images OG doit pointer ici pour rester cohérent.

const FALLBACK_URL = "https://axessyo.com";

function normalize(url: string): string {
  return url.replace(/\/+$/, "");
}

// Résolution de l'URL canonique du site, par ordre de priorité :
//   1. NEXT_PUBLIC_APP_URL — domaine maîtrisé, source de vérité explicite.
//   2. VERCEL_PROJECT_PRODUCTION_URL — domaine de PROD stable injecté par Vercel
//      (jamais une URL de preview), utilisé comme garde-fou si (1) est oublié.
//   3. FALLBACK_URL — dernier recours pour le dev local / les autres hôtes.
// Évite que des canonicals/OG/sitemap pointent vers le mauvais domaine si la
// variable d'env n'est pas posée sur Vercel.
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL;
  if (explicit) return normalize(explicit);

  const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProd) return normalize(`https://${vercelProd}`);

  return FALLBACK_URL;
}

export const SITE = {
  name: "Axessyo",
  shortName: "Axessyo",
  tagline: {
    fr: "Plateforme SaaS d'audits d'accessibilité numérique",
    en: "Digital accessibility audit SaaS platform",
  },
  description: {
    fr: "Axessyo centralise vos audits d'accessibilité numérique (RGAA, WCAG, RAWeb, RAAM). Saisie de conformité, gestion des non-conformités, rapports PDF — pour auditeurs et équipes clients.",
    en: "Axessyo centralizes your digital accessibility audits (RGAA, WCAG, RAWeb, RAAM). Conformity tracking, non-conformity management, PDF reports — for auditors and client teams.",
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
    "Axessyo",
  ],
  // Couleurs Axessyo (navy de marque #1a4066 / point teal #06b6d4).
  themeColor: "#1a4066",
  backgroundColor: "#ffffff",
  twitter: "@axessyo",
  locale: { fr: "fr_FR", en: "en_US" },
  url: resolveSiteUrl(),
  // Adresse de support — utilisée par le lien « Contactez votre
  // administrateur » sur /login et les voies de retour a11y.
  supportEmail: "contact@axessyo.com",
} as const;

export function siteUrl(path = "/"): string {
  if (!path.startsWith("/")) path = `/${path}`;
  return `${SITE.url}${path}`;
}
