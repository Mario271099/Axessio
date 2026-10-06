import type { MetadataRoute } from "next";
import { IS_PRODUCTION_DEPLOYMENT, siteUrl } from "@/lib/site";

// Pages publiques indexables (alignées sur le sitemap). Le `/` couvre déjà
// tout, mais on liste explicitement pour documenter l'intention. /login et
// /register sont volontairement absents : ils sont en noindex et hors sitemap
// (pages utilitaires sans intérêt SEO).
const PUBLIC_PAGES = [
  "/",
  "/pricing",
  "/features",
  "/rgaa",
  "/faq",
  "/legal",
  "/privacy",
  "/cookies",
  "/accessibility",
];

// Tout ce qui est derrière auth est explicitement exclu pour ne pas gaspiller
// le crawl-budget des moteurs et éviter d'indexer du contenu utilisateur (qui
// de toute façon retournerait 401/redirect).
const PRIVATE_PATHS = [
  "/dashboard",
  "/dashboard/",
  "/admin/",
  "/audits",
  "/audits/",
  "/clients",
  "/clients/",
  "/projects",
  "/projects/",
  "/users",
  "/users/",
  "/settings",
  "/settings/",
  "/notifications",
  "/notifications/",
  "/organizations/",
  "/planning",
  "/onboarding/",
  "/auth/",
  "/api/",
  "/setup-password",
];

// Robots qui récupèrent une page pour répondre à une question (recherche IA).
const AI_SEARCH_BOTS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
];

// Robots qui aspirent le web pour entraîner des modèles.
const AI_TRAINING_BOTS = [
  "GPTBot",
  "ClaudeBot",
  "anthropic-ai",
  "CCBot",
  "Google-Extended",
];

export default function robots(): MetadataRoute.Robots {
  // Staging / previews : interdiction totale de crawl (doublé par le header
  // X-Robots-Tag posé dans next.config.ts). Pas de sitemap ni de host - on ne
  // donne aucun signal d'indexation hors production.
  if (!IS_PRODUCTION_DEPLOYMENT) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: PUBLIC_PAGES,
        disallow: PRIVATE_PATHS,
      },
      // Robots de recherche IA (ChatGPT, Claude, Perplexity) : autorisés sur
      // les pages publiques pour qu'Axessyo puisse être cité dans leurs
      // réponses. Même périmètre que `*` (un groupe nommé remplace `*`).
      {
        userAgent: AI_SEARCH_BOTS,
        allow: PUBLIC_PAGES,
        disallow: PRIVATE_PATHS,
      },
      // Robots d'entraînement de modèles : bloqués, ils n'apportent aucune
      // visibilité.
      { userAgent: AI_TRAINING_BOTS, disallow: "/" },
    ],
    sitemap: siteUrl("/sitemap.xml"),
  };
}
