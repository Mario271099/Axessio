import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { SITE, siteUrl } from "@/lib/site";

/**
 * Metadata d'une page marketing indexable. Le namespace i18n doit porter
 * `metaTitle` et `metaDescription` ; le titre passe par le template racine
 * "%s · Axessyo".
 */
export async function buildPublicMetadata({
  path,
  namespace,
}: {
  path: `/${string}`;
  namespace: string;
}): Promise<Metadata> {
  const t = await getTranslations(namespace);
  const locale = await getLocale();
  const title = t("metaTitle");
  const description = t("metaDescription");
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE.name,
      title: `${title} · ${SITE.name}`,
      description,
      url: siteUrl(path),
      locale: locale === "en" ? SITE.locale.en : SITE.locale.fr,
      // Un `openGraph` défini ici remplace celui du layout : sans cette ligne,
      // l'image générée par app/opengraph-image.tsx est perdue.
      images: [siteUrl("/opengraph-image")],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · ${SITE.name}`,
      description,
      images: [siteUrl("/twitter-image")],
    },
  };
}
