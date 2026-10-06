import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  MarketingHero,
  MarketingPage,
} from "@/components/public/marketing-page";
import {
  ArticleLayout,
  CardGrid,
  planBadgeLabel,
  SourceNote,
  textLinkClass,
} from "@/components/public/marketing-blocks";
import type { FeatureCode } from "@/lib/billing/plans";
import { buildPublicMetadata } from "@/lib/public-metadata";
import { SITE, siteUrl } from "@/lib/site";

type Item = { title: string; desc: string };

/** Fonctionnalités payantes des intégrations, dans l'ordre des items i18n. */
const INTEGRATION_FEATURES: ReadonlyArray<FeatureCode> = [
  "api.access",
  "webhooks.outgoing",
];

export async function generateMetadata(): Promise<Metadata> {
  return buildPublicMetadata({ path: "/security", namespace: "securityPage" });
}

export default async function SecurityPage() {
  const t = await getTranslations("securityPage");
  const tm = await getTranslations("marketing");

  const integrations = (t.raw("integrations.items") as Item[]).map(
    (item, index) => ({
      ...item,
      tag: planBadgeLabel(INTEGRATION_FEATURES[index], tm) ?? undefined,
    }),
  );

  const pageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: t("metaTitle"),
    description: t("metaDescription"),
    url: siteUrl("/security"),
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
  };

  return (
    <MarketingPage
      currentHref="/security"
      pageName={t("breadcrumb")}
      related={["/about", "/features", "/contact"]}
      jsonLd={[pageLd]}
    >
      <MarketingHero
        id="security-title"
        kicker={t("kicker")}
        title={t("title")}
        subtitle={t("subtitle")}
      />

      <ArticleLayout
        sections={[
          {
            id: "hosting",
            title: t("hosting.title"),
            content: (
              <>
                <CardGrid items={t.raw("hosting.items") as Item[]} />
                <SourceNote>
                  {t.rich("hosting.source", {
                    link: (chunks) => (
                      <Link href="/privacy" className={textLinkClass}>
                        {chunks}
                      </Link>
                    ),
                  })}
                </SourceNote>
              </>
            ),
          },
          {
            id: "access",
            title: t("access.title"),
            content: <CardGrid items={t.raw("access.items") as Item[]} />,
          },
          {
            id: "data",
            title: t("data.title"),
            content: <CardGrid items={t.raw("data.items") as Item[]} />,
          },
          {
            id: "integrations",
            title: t("integrations.title"),
            content: <CardGrid items={integrations} />,
          },
          {
            id: "report",
            title: t("report.title"),
            content: (
              <p className="text-[1.0625rem] leading-relaxed text-secondary-foreground">
                {t.rich("report.body", {
                  email: SITE.supportEmail,
                  link: (chunks) => (
                    <a
                      href={`mailto:${SITE.supportEmail}`}
                      className={textLinkClass}
                    >
                      {chunks}
                    </a>
                  ),
                })}
              </p>
            ),
          },
        ]}
      />
    </MarketingPage>
  );
}
