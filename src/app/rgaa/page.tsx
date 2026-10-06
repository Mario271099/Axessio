import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  FaqList,
  faqJsonLd,
  MarketingPage,
} from "@/components/public/marketing-page";
import {
  ArticleLayout,
  CheckList,
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

const OFFICIAL_SOURCE_URL =
  "https://accessibilite.numerique.gouv.fr/obligations/";

/** Niveaux de conformité légaux, du plus bas au plus haut. */
const LEVELS = [
  { key: "none", color: "hsl(var(--destructive))" },
  { key: "partial", color: "hsl(var(--highlight))" },
  { key: "full", color: "var(--theme-6)" },
] as const;

export async function generateMetadata(): Promise<Metadata> {
  return buildPublicMetadata({ path: "/rgaa", namespace: "rgaaPage" });
}

export default async function RgaaPage() {
  const t = await getTranslations("rgaaPage");
  const tHome = await getTranslations("home");

  const faqItems = t.raw("faq.items") as { q: string; a: string }[];

  return (
    <MarketingPage
      currentHref="/rgaa"
      pageName={tHome("footer.links.rgaa")}
      related={["/wcag", "/features", "/pricing"]}
      jsonLd={[
        standardPageLd({
          path: "/rgaa",
          name: t("metaTitle"),
          description: t("metaDescription"),
          about: "RGAA - Référentiel général d'amélioration de l'accessibilité",
          aboutUrl: "https://accessibilite.numerique.gouv.fr/",
        }),
        faqJsonLd(faqItems),
      ]}
    >
      <StandardHero
        id="rgaa-title"
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
            id: "who",
            title: t("who.title"),
            content: (
              <>
                <Paragraphs items={t.raw("who.paragraphs") as string[]} />
                <SubHeading>{t("who.obligationsTitle")}</SubHeading>
                <CheckList items={t.raw("who.obligations") as string[]} />
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
            id: "score",
            title: t("score.title"),
            content: (
              <>
                <Paragraphs items={t.raw("score.paragraphs") as string[]} />
                <SubHeading>{t("score.levelsTitle")}</SubHeading>
                <ul className="mt-4 grid gap-3 sm:grid-cols-3">
                  {LEVELS.map((level) => (
                    <li
                      key={level.key}
                      className="flex flex-col gap-1 rounded-card border border-border bg-card p-4"
                    >
                      <span
                        aria-hidden="true"
                        className="mb-1.5 block h-1.5 w-10 rounded-full"
                        style={{ background: level.color }}
                      />
                      <span className="text-xl font-black tabular-nums tracking-tight">
                        {t(`score.levels.${level.key}.range`)}
                      </span>
                      <span className="text-base font-bold text-secondary-foreground">
                        {t(`score.levels.${level.key}.label`)}
                      </span>
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
                <SubHeading>{t("others.title")}</SubHeading>
                <p className="mt-3 text-[1.0625rem] leading-relaxed text-secondary-foreground">
                  {t("others.body")}
                </p>
                <OtherStandards current="/rgaa" />
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
