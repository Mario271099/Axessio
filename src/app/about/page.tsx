import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MarketingHero,
  MarketingPage,
} from "@/components/public/marketing-page";
import {
  ArticleLayout,
  CardGrid,
  CheckList,
  Paragraphs,
} from "@/components/public/marketing-blocks";
import { buildPublicMetadata } from "@/lib/public-metadata";
import { SITE, siteUrl } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  return buildPublicMetadata({ path: "/about", namespace: "aboutPage" });
}

export default async function AboutPage() {
  const t = await getTranslations("aboutPage");
  const tHome = await getTranslations("home");

  const pageLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: t("metaTitle"),
    description: t("metaDescription"),
    url: siteUrl("/about"),
    mainEntity: {
      "@type": "Organization",
      name: SITE.name,
      url: SITE.url,
      email: SITE.supportEmail,
      description: t("subtitle"),
    },
  };

  return (
    <MarketingPage
      currentHref="/about"
      pageName={t("breadcrumb")}
      related={["/features", "/security", "/contact"]}
      jsonLd={[pageLd]}
    >
      <MarketingHero
        id="about-title"
        kicker={t("kicker")}
        title={t("title")}
        subtitle={t("subtitle")}
      >
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Button asChild size="lg">
            <Link href="/register">
              {tHome("hero.primaryCta")}
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/contact">{tHome("nav.contact")}</Link>
          </Button>
        </div>
      </MarketingHero>

      <ArticleLayout
        sections={[
          {
            id: "mission",
            title: t("mission.title"),
            content: <Paragraphs items={t.raw("mission.paragraphs") as string[]} />,
          },
          {
            id: "commitments",
            title: t("commitments.title"),
            content: (
              <CardGrid
                items={
                  t.raw("commitments.items") as { title: string; desc: string }[]
                }
              />
            ),
          },
          {
            id: "audience",
            title: t("audience.title"),
            content: <CheckList items={t.raw("audience.items") as string[]} />,
          },
        ]}
      />
    </MarketingPage>
  );
}
