import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { LegalSection, LegalShell } from "@/components/public/legal-shell";
import { intlLocale } from "@/lib/intl";
import { SITE } from "@/lib/site";

const LAST_UPDATED_ISO = "2026-07-20";

const SECTION_KEYS = [
  "controller",
  "data",
  "purposes",
  "basis",
  "retention",
  "recipients",
  "rights",
  "complaint",
  "security",
] as const;

interface RawSection {
  title: string;
  lines: string[];
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("privacy");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: "/privacy" },
    openGraph: {
      type: "article",
      siteName: SITE.name,
      title: t("metaTitle"),
      description: t("metaDescription"),
      url: `${SITE.url}/privacy`,
    },
  };
}

export default async function PrivacyPage() {
  const t = await getTranslations("privacy");
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
