import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { LegalSection, LegalShell } from "@/components/public/legal-shell";
import { intlLocale } from "@/lib/intl";
import { SITE } from "@/lib/site";

// Date d'établissement de la déclaration — à mettre à jour à chaque révision
// (notamment après la réalisation de l'audit RGAA).
const LAST_UPDATED_ISO = "2026-05-30";

const SECTION_KEYS = [
  "state",
  "results",
  "nonAccessible",
  "establishment",
  "feedback",
  "remedy",
] as const;

interface RawSection {
  title: string;
  lines: string[];
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("accessibility");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: "/accessibility" },
    openGraph: {
      type: "article",
      siteName: SITE.name,
      title: t("metaTitle"),
      description: t("metaDescription"),
      url: `${SITE.url}/accessibility`,
    },
  };
}

export default async function AccessibilityPage() {
  const t = await getTranslations("accessibility");
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
      intro={t("intro")}
    >
      {SECTION_KEYS.map((key) => {
        const section = t.raw(`sections.${key}`) as RawSection;
        // La date d'établissement est interpolée dans certaines lignes.
        const lines = section.lines.map((line) =>
          line.replace("{date}", formattedDate),
        );
        return <LegalSection key={key} title={section.title} lines={lines} />;
      })}
    </LegalShell>
  );
}
