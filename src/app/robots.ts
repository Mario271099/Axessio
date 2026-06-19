import type { MetadataRoute } from "next";
import { SITE, siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  // Hôte canonique nu (sans schéma ni slash) - la directive `host` attend un
  // nom de domaine, pas une URL. Dérivé de SITE.url pour rester cohérent.
  const host = new URL(SITE.url).host;

  return {
    rules: [
      {
        userAgent: "*",
        // Pages publiques indexables (alignées sur le sitemap). Le `/` couvre
        // déjà tout, mais on liste explicitement pour documenter l'intention.
        // /login et /register sont volontairement absents : ils sont en noindex
        // et hors sitemap (pages utilitaires sans intérêt SEO).
        allow: [
          "/",
          "/pricing",
          "/legal",
          "/privacy",
          "/cookies",
          "/accessibility",
        ],
        // Tout ce qui est derrière auth est explicitement exclu pour ne pas
        // gaspiller le crawl-budget des moteurs et éviter d'indexer du
        // contenu utilisateur (qui de toute façon retournerait 401/redirect).
        disallow: [
          "/dashboard",
          "/dashboard/",
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
          "/auth/",
          "/api/",
          "/setup-password",
        ],
      },
      // AI crawlers - on autorise les crawlers de marketing recherche,
      // pas ceux qui aspirent pour entraîner des modèles.
      { userAgent: "GPTBot", disallow: "/" },
      { userAgent: "ChatGPT-User", disallow: "/" },
      { userAgent: "anthropic-ai", disallow: "/" },
      { userAgent: "ClaudeBot", disallow: "/" },
      { userAgent: "CCBot", disallow: "/" },
      { userAgent: "Google-Extended", disallow: "/" },
    ],
    sitemap: siteUrl("/sitemap.xml"),
    host,
  };
}
