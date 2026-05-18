import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login"],
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
      // AI crawlers — on autorise les crawlers de marketing recherche,
      // pas ceux qui aspirent pour entraîner des modèles.
      { userAgent: "GPTBot", disallow: "/" },
      { userAgent: "ChatGPT-User", disallow: "/" },
      { userAgent: "anthropic-ai", disallow: "/" },
      { userAgent: "ClaudeBot", disallow: "/" },
      { userAgent: "CCBot", disallow: "/" },
      { userAgent: "Google-Extended", disallow: "/" },
    ],
    sitemap: siteUrl("/sitemap.xml"),
    host: siteUrl("/"),
  };
}
