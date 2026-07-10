import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { LegalSection, LegalShell } from "@/components/public/legal-shell";
import { intlLocale } from "@/lib/intl";
import { SITE } from "@/lib/site";

const LAST_UPDATED_ISO = "2026-07-20";

const SECTION_KEYS = ["noTracking", "disable", "contact"] as const;

interface RawSection {
  title: string;
  lines: string[];
}

interface RawCookie {
  name: string;
  purpose: string;
  duration: string;
}

interface RawHeaders {
  name: string;
  purpose: string;
  duration: string;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("cookies");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: "/cookies" },
    openGraph: {
      type: "article",
      siteName: SITE.name,
      title: t("metaTitle"),
      description: t("metaDescription"),
      url: `${SITE.url}/cookies`,
    },
  };
}

export default async function CookiesPage() {
  const t = await getTranslations("cookies");
  const locale = await getLocale();
  const formattedDate = new Intl.DateTimeFormat(intlLocale(locale), {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(LAST_UPDATED_ISO));

  const items = t.raw("items") as RawCookie[];
  const headers = t.raw("tableHeaders") as RawHeaders;

  return (
    <LegalShell
      title={t("title")}
      lastUpdated={t("lastUpdated", { date: formattedDate })}
      intro={t("intro")}
    >
      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">
          {locale === "en"
            ? "Cookies in use"
            : "Cookies utilisés"}
        </h2>
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-2 font-medium">
                  {headers.name}
                </th>
                <th scope="col" className="px-4 py-2 font-medium">
                  {headers.purpose}
                </th>
                <th scope="col" className="px-4 py-2 font-medium">
                  {headers.duration}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item) => (
                <tr key={item.name}>
                  <td className="px-4 py-3 font-mono text-xs text-foreground">
                    {item.name}
                  </td>
                  <td className="px-4 py-3 text-foreground/90">
                    {item.purpose}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {item.duration}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

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
