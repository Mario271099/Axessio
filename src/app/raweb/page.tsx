import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  FaqList,
  faqJsonLd,
  MarketingPage,
} from "@/components/public/marketing-page";
import {
  ArticleLayout,
  NumberedGrid,
  Paragraphs,
  SourceNote,
  StepList,
  SubHeading,
  textLinkClass,
} from "@/components/public/marketing-blocks";
import {
  OtherStandards,
  StandardHero,
  standardPageLd,
} from "@/components/public/standard-page";
import { buildPublicMetadata } from "@/lib/public-metadata";

const OFFICIAL_SOURCE_URL = "https://accessibilite.public.lu/fr/raweb1.1/";

export async function generateMetadata(): Promise<Metadata> {
  return buildPublicMetadata({ path: "/raweb", namespace: "rawebPage" });
}

export default async function RawebPage() {
  const t = await getTranslations("rawebPage");
  const tm = await getTranslations("marketing");

  const faqItems = t.raw("faq.items") as { q: string; a: string }[];

  return (
    <MarketingPage
      currentHref="/raweb"
      pageName={t("breadcrumb")}
      related={["/raam", "/features", "/pricing"]}
      jsonLd={[
        standardPageLd({
          path: "/raweb",
          name: t("metaTitle"),
          description: t("metaDescription"),
          about: "RAWeb - Référentiel d'évaluation de l'accessibilité web",
          aboutUrl: OFFICIAL_SOURCE_URL,
        }),
        faqJsonLd(faqItems),
      ]}
    >
      <StandardHero
        id="raweb-title"
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
                <SubHeading>{t("what.themesTitle")}</SubHeading>
                <NumberedGrid items={t.raw("what.themes") as string[]} />
              </>
            ),
          },
          {
            id: "diff",
            title: t("diff.title"),
            content: <Paragraphs items={t.raw("diff.paragraphs") as string[]} />,
          },
          {
            id: "who",
            title: t("who.title"),
            content: (
              <>
                <Paragraphs items={t.raw("who.paragraphs") as string[]} />
                <SourceNote>
                  {t.rich("who.source", {
                    link: (chunks) => (
                      <a href={OFFICIAL_SOURCE_URL} className={textLinkClass}>
                        {chunks}
                      </a>
                    ),
                  })}
                </SourceNote>
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
                <OtherStandards current="/raweb" />
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
