import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  FaqList,
  faqJsonLd,
  MarketingHero,
  MarketingPage,
} from "@/components/public/marketing-page";
import { buildPublicMetadata } from "@/lib/public-metadata";
import { SITE, siteUrl } from "@/lib/site";

const OFFICIAL_SOURCE_URL =
  "https://accessibilite.numerique.gouv.fr/obligations/";

/** Sections de la page, dans l'ordre : alimentent le sommaire « Sur cette page ». */
const SECTIONS = ["what", "who", "score", "how", "faq"] as const;

/** Niveaux de conformité légaux, du plus bas au plus haut. */
const LEVELS = [
  { key: "none", color: "hsl(var(--destructive))" },
  { key: "partial", color: "hsl(var(--highlight))" },
  { key: "full", color: "var(--theme-6)" },
] as const;

const sectionTitle =
  "text-[1.75rem] font-black leading-[1.08] tracking-[-0.04em] md:text-[2.25rem]";
const paragraph = "text-[1.0625rem] leading-relaxed text-secondary-foreground";

export async function generateMetadata(): Promise<Metadata> {
  return buildPublicMetadata({ path: "/rgaa", namespace: "rgaaPage" });
}

export default async function RgaaPage() {
  const t = await getTranslations("rgaaPage");
  const tm = await getTranslations("marketing");
  const tHome = await getTranslations("home");

  const whatParagraphs = t.raw("what.paragraphs") as string[];
  const themes = t.raw("what.themes") as string[];
  const whoParagraphs = t.raw("who.paragraphs") as string[];
  const obligations = t.raw("who.obligations") as string[];
  const scoreParagraphs = t.raw("score.paragraphs") as string[];
  const steps = t.raw("how.steps") as { title: string; desc: string }[];
  const faqItems = t.raw("faq.items") as { q: string; a: string }[];

  const pageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: t("metaTitle"),
    description: t("metaDescription"),
    url: siteUrl("/rgaa"),
    about: {
      "@type": "Thing",
      name: "RGAA - Référentiel général d'amélioration de l'accessibilité",
      sameAs: "https://accessibilite.numerique.gouv.fr/",
    },
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
  };

  return (
    <MarketingPage
      currentHref="/rgaa"
      pageName={tHome("footer.links.rgaa")}
      jsonLd={[pageLd, faqJsonLd(faqItems)]}
    >
      <MarketingHero
        id="rgaa-title"
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
            <Link href="/features">{t("how.cta")}</Link>
          </Button>
        </div>
      </MarketingHero>

      <div className="bg-background py-16 md:py-20">
        <div className="container mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16 lg:px-9">
          {/* Sommaire ---------------------------------------------------- */}
          <nav aria-labelledby="toc-title" className="lg:sticky lg:top-28 lg:self-start">
            <h2 id="toc-title" className="text-base font-extrabold">
              {tm("onThisPage")}
            </h2>
            <ol className="mt-3 flex flex-col gap-2 border-l-2 border-border pl-4">
              {SECTIONS.map((key) => (
                <li key={key}>
                  <a
                    href={`#${key}`}
                    className="rounded text-[0.95rem] text-secondary-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    {t(`${key}.title`)}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="flex min-w-0 max-w-[72ch] flex-col gap-16">
            {/* Qu'est-ce que le RGAA ----------------------------------- */}
            <section id="what" aria-labelledby="what-title" className="scroll-mt-28">
              <h2 id="what-title" className={sectionTitle}>
                {t("what.title")}
              </h2>
              <div className="mt-5 flex flex-col gap-4">
                {whatParagraphs.map((text) => (
                  <p key={text} className={paragraph}>
                    {text}
                  </p>
                ))}
              </div>
              <h3 className="mt-8 text-xl font-black tracking-tight">
                {t("what.themesTitle")}
              </h3>
              <ol className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {themes.map((theme, index) => (
                  <li
                    key={theme}
                    className="flex items-center gap-3 rounded-card border border-border bg-card px-4 py-3 text-base font-bold"
                  >
                    <span
                      aria-hidden="true"
                      className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-sm font-black tabular-nums text-primary"
                    >
                      {index + 1}
                    </span>
                    {theme}
                  </li>
                ))}
              </ol>
            </section>

            {/* Qui est concerné ---------------------------------------- */}
            <section id="who" aria-labelledby="who-title" className="scroll-mt-28">
              <h2 id="who-title" className={sectionTitle}>
                {t("who.title")}
              </h2>
              <div className="mt-5 flex flex-col gap-4">
                {whoParagraphs.map((text) => (
                  <p key={text} className={paragraph}>
                    {text}
                  </p>
                ))}
              </div>
              <h3 className="mt-8 text-xl font-black tracking-tight">
                {t("who.obligationsTitle")}
              </h3>
              <ul className="mt-4 flex flex-col gap-3">
                {obligations.map((text) => (
                  <li key={text} className="flex gap-3 text-base leading-relaxed">
                    <Check
                      aria-hidden="true"
                      strokeWidth={2.6}
                      className="mt-1 size-4.5 shrink-0 text-success-text"
                    />
                    {text}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-muted-foreground">
                {t.rich("who.source", {
                  link: (chunks) => (
                    <a
                      href={OFFICIAL_SOURCE_URL}
                      className="font-bold text-primary underline decoration-1 underline-offset-4 hover:decoration-2"
                    >
                      {chunks}
                    </a>
                  ),
                })}
              </p>
            </section>

            {/* Calcul du taux ------------------------------------------ */}
            <section id="score" aria-labelledby="score-title" className="scroll-mt-28">
              <h2 id="score-title" className={sectionTitle}>
                {t("score.title")}
              </h2>
              <div className="mt-5 flex flex-col gap-4">
                {scoreParagraphs.map((text) => (
                  <p key={text} className={paragraph}>
                    {text}
                  </p>
                ))}
              </div>
              <h3 className="mt-8 text-xl font-black tracking-tight">
                {t("score.levelsTitle")}
              </h3>
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
            </section>

            {/* Avec Axessyo -------------------------------------------- */}
            <section id="how" aria-labelledby="how-title" className="scroll-mt-28">
              <h2 id="how-title" className={sectionTitle}>
                {t("how.title")}
              </h2>
              <ol className="mt-6 flex flex-col gap-4">
                {steps.map((step, index) => (
                  <li
                    key={step.title}
                    className="flex gap-4 rounded-hero border border-border bg-card p-5"
                  >
                    <span
                      aria-hidden="true"
                      className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-primary text-lg font-black text-primary-foreground"
                    >
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="text-lg font-black tracking-tight">
                        {step.title}
                      </h3>
                      <p className="mt-1 text-base leading-relaxed text-secondary-foreground">
                        {step.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>

              <h3 className="mt-10 text-xl font-black tracking-tight">
                {t("others.title")}
              </h3>
              <p className={`mt-3 ${paragraph}`}>{t("others.body")}</p>
              <Link
                href="/features"
                className="mt-4 inline-flex items-center gap-2 text-base font-extrabold text-primary underline decoration-1 underline-offset-4 hover:decoration-2"
              >
                {t("how.cta")}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </section>

            {/* FAQ ----------------------------------------------------- */}
            <section id="faq" aria-labelledby="faq-title" className="scroll-mt-28">
              <h2 id="faq-title" className={sectionTitle}>
                {t("faq.title")}
              </h2>
              <div className="mt-6">
                <FaqList items={faqItems} />
              </div>
            </section>
          </div>
        </div>
      </div>
    </MarketingPage>
  );
}
