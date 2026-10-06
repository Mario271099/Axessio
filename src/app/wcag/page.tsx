import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  FaqList,
  faqJsonLd,
  MarketingPage,
} from "@/components/public/marketing-page";
import {
  ArticleLayout,
  CardGrid,
  Paragraphs,
  StepList,
  SubHeading,
} from "@/components/public/marketing-blocks";
import {
  OtherStandards,
  StandardHero,
  standardPageLd,
} from "@/components/public/standard-page";
import { buildPublicMetadata } from "@/lib/public-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildPublicMetadata({ path: "/wcag", namespace: "wcagPage" });
}

export default async function WcagPage() {
  const t = await getTranslations("wcagPage");
  const tm = await getTranslations("marketing");

  const faqItems = t.raw("faq.items") as { q: string; a: string }[];

  return (
    <MarketingPage
      currentHref="/wcag"
      pageName={t("breadcrumb")}
      related={["/rgaa", "/features", "/pricing"]}
      jsonLd={[
        standardPageLd({
          path: "/wcag",
          name: t("metaTitle"),
          description: t("metaDescription"),
          about: "Web Content Accessibility Guidelines (WCAG) 2.2",
          aboutUrl: "https://www.w3.org/TR/WCAG22/",
        }),
        faqJsonLd(faqItems),
      ]}
    >
      <StandardHero
        id="wcag-title"
        kicker={t("kicker")}
        title={t("title")}
        subtitle={t("subtitle")}
      />

      <ArticleLayout
        sections={[
          {
            id: "what",
            title: t("what.title"),
            content: (
              <>
                <Paragraphs items={t.raw("what.paragraphs") as string[]} />
                <SubHeading>{t("what.principlesTitle")}</SubHeading>
                <CardGrid
                  items={
                    t.raw("what.principles") as { title: string; desc: string }[]
                  }
                />
              </>
            ),
          },
          {
            id: "levels",
            title: t("levels.title"),
            content: <Paragraphs items={t.raw("levels.paragraphs") as string[]} />,
          },
          {
            id: "news",
            title: t("news.title"),
            content: (
              <>
                <Paragraphs items={t.raw("news.paragraphs") as string[]} />
                <SubHeading>{t("news.listTitle")}</SubHeading>
                <ul className="mt-4 flex flex-col gap-2">
                  {(t.raw("news.criteria") as string[]).map((label) => (
                    <li
                      key={label}
                      className="rounded-card border border-border bg-card px-4 py-3 text-base font-bold"
                    >
                      {label}
                    </li>
                  ))}
                </ul>
              </>
            ),
          },
          {
            id: "how",
            title: t("how.title"),
            content: (
              <>
                <StepList
                  items={t.raw("how.steps") as { title: string; desc: string }[]}
                />
                <SubHeading>{tm("otherStandards")}</SubHeading>
                <OtherStandards current="/wcag" />
              </>
            ),
          },
          {
            id: "faq",
            title: t("faq.title"),
            content: <FaqList items={faqItems} />,
          },
        ]}
      />
    </MarketingPage>
  );
}
