import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { LegalSection, LegalShell } from "@/components/public/legal-shell";
import { intlLocale } from "@/lib/intl";
import { SITE, siteUrl } from "@/lib/site";

// Date de la dernière révision - à mettre à jour à chaque modification du
// contenu pour informer les utilisateurs.
const LAST_UPDATED_ISO = "2026-07-20";

const SECTION_KEYS = [
  "editor",
  "director",
  "host",
  "ip",
  "liability",
  "law",
  "contact",
] as const;

interface RawSection {
  title: string;
  lines: string[];
}

export async function generateMetadata(): Promise<Metadata> {
  if (HIDDEN) return {};
  const t = await getTranslations("legal");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: "/legal" },
    openGraph: {
      type: "article",
      siteName: SITE.name,
      title: t("metaTitle"),
      description: t("metaDescription"),
      url: `${SITE.url}/legal`,
      // Un `openGraph` défini ici remplace celui du layout : sans cette ligne,
      // l'image générée par app/opengraph-image.tsx est perdue.
      images: [siteUrl("/opengraph-image")],
    },
  };
}

// Page masquee : passer HIDDEN a false (et remettre les liens footer / auth /
// sidebar / sitemap / robots / inscription / test a11y) pour la republier.
const HIDDEN = true;

export default async function LegalPage() {
  if (HIDDEN) notFound();
  const t = await getTranslations("legal");
  const locale = await getLocale();
  const formattedDate = new Intl.DateTimeFormat(intlLocale(locale), {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(LAST_UPDATED_ISO));

  return (
    <LegalShell
      title={t("title")}
      lastUpdated={t("lastUpdated", { date: formattedDate })}
    >
      {SECTION_KEYS.map((key) => {
        const section = t.raw(`sections.${key}`) as RawSection;
        return (
          <LegalSection
            key={key}
            title={section.title}
            lines={section.lines}
          />
        );
      })}
    </LegalShell>
  );
}
