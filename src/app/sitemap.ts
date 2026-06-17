import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  // Pages vivantes : date du build (contenu marketing susceptible de bouger).
  const now = new Date();
  // Pages legales : date de derniere revision reelle, figee pour eviter de
  // signaler une fausse modification a chaque deploiement.
  const legalLastModified = new Date("2026-05-30");
  // /login et /register sont en noindex : exclues du sitemap (coherence robots).
  return [
    {
      url: siteUrl("/"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: siteUrl("/pricing"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: siteUrl("/legal"),
      lastModified: legalLastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: siteUrl("/privacy"),
      lastModified: legalLastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: siteUrl("/cookies"),
      lastModified: legalLastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: siteUrl("/accessibility"),
      lastModified: legalLastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
