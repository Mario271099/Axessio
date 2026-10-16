import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PublicHeader } from "@/components/public/public-header";
import { PublicFooter } from "@/components/public/public-footer";
import { HomeAppPreview } from "@/components/public/home-app-preview";
import { SignupCta } from "@/components/public/marketing-page";
import { createClient } from "@/lib/supabase/server";
import { SITE, siteUrl } from "@/lib/site";

/**
 * Tuiles de la grille « fonctionnalités », en bento : la matrice occupe la
 * largeur double, les autres se rangent par deux. Chaque tuile porte une
 * couleur de thématique, qui colore aussi sa levée au survol.
 */
const FEATURE_TILES = [
  { key: "matrix", span: "lg:col-span-4", color: "var(--theme-6)" },
  { key: "ncs", span: "lg:col-span-2", color: "var(--theme-4)" },
  { key: "reports", span: "lg:col-span-2", color: "var(--theme-2)" },
  { key: "multitenant", span: "lg:col-span-2", color: "var(--theme-5)" },
  { key: "i18n", span: "lg:col-span-2", color: "var(--theme-9)" },
] as const;

/**
 * Motif de l'aperçu de matrice de la première tuile : C conforme,
 * N non conforme, A non applicable. Décoratif, aucune donnée réelle.
 */
const MATRIX_PREVIEW =
  "CCNCCACNCCCNCACCNCCCNCCACCCNCC".split("");

/** Référentiels pris en charge, dans l'ordre d'usage. */
const STANDARDS = ["RGAA", "WCAG", "RAWeb", "RAAM"] as const;

const STANDARD_COLORS: Record<(typeof STANDARDS)[number], string> = {
  RGAA: "var(--theme-6)",
  WCAG: "var(--theme-5)",
  RAWeb: "var(--theme-2)",
  RAAM: "var(--theme-3)",
};

// La home reste indexable (override de l'override dashboard) avec sa propre
// méta. On laisse next-intl régler le titre/description selon la locale.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("home");
  const locale = await getLocale();
  const isEn = locale === "en";
  const title = t("metaTitle");
  const description = t("metaDescription");
  return {
    // `metaTitle` contient deja la marque ("Axessyo - ...") : on court-circuite
    // le template racine "%s · Axessyo" via `absolute` pour eviter un doublon.
    title: { absolute: title },
    description,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: SITE.name,
      title,
      description,
      url: SITE.url,
      locale: isEn ? SITE.locale.en : SITE.locale.fr,
      alternateLocale: isEn ? [SITE.locale.fr] : [SITE.locale.en],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Utilisateurs authentifiés : on shortcut directement vers le dashboard.
  // Les guests reçoivent la vraie landing, indexable.
  if (user) {
    redirect("/dashboard");
  }

  const t = await getTranslations("home");

  // JSON-LD SoftwareApplication + FAQPage - enrichit le snippet Google.
  type FaqItem = { q: string; a: string };
  type StepItem = { title: string; desc: string };
  type A11yItem = { title: string; desc: string };
  const faqItems = t.raw("faq.items") as FaqItem[];
  const stepItems = t.raw("steps.items") as StepItem[];
  const a11yItems = t.raw("a11yBlock.items") as A11yItem[];

  const softwareLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE.name,
    description: t("metaDescription"),
    url: SITE.url,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: ["fr-FR", "en-US"],
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    image: siteUrl("/opengraph-image"),
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <div className="bg-card">
      <PublicHeader />

      <main id="main" tabIndex={-1}>
        {/* =================================================================
            Hero
            ================================================================= */}
        <section
          aria-labelledby="hero-title"
          className="relative overflow-hidden"
        >
          {/* Formes géométriques de la marque, purement décoratives. */}
          <svg
            aria-hidden="true"
            viewBox="0 0 620 620"
            className="pointer-events-none absolute -right-32 -top-20 hidden h-[620px] w-[620px] lg:block"
          >
            <g fill="hsl(var(--primary-soft))">
              <rect x="0" y="0" width="290" height="290" rx="70" />
              <circle cx="475" cy="145" r="145" />
              <rect x="0" y="330" width="290" height="290" rx="70" />
              {/* L'ambre est franc sur fond clair, presque effacé en sombre :
                  sinon la forme vire au brun sur le fond encre. */}
              <rect
                x="330"
                y="330"
                width="290"
                height="290"
                rx="70"
                fill="var(--highlight-wash)"
              />
            </g>
          </svg>

          <div className="container relative mx-auto grid max-w-7xl gap-12 px-6 py-16 md:py-20 lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)] lg:items-center lg:px-9">
            <div className="min-w-0">
              <p className="inline-flex items-center rounded-full bg-primary-soft px-3.5 py-1.5 text-sm font-extrabold text-primary">
                {t("hero.kicker")}
              </p>
              <h1
                id="hero-title"
                className="mt-5 text-[2.75rem] font-black leading-[1.05] tracking-[-0.04em] md:text-[3.5rem] lg:text-[4rem]"
              >
                {t("hero.title")}
              </h1>
              <p className="mt-5 max-w-[48ch] text-lg leading-relaxed text-secondary-foreground">
                {t("hero.subtitle")}
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link href="/register">
                    {t("hero.primaryCta")}
                    <ArrowRight data-anim="go" aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="#features">{t("hero.secondaryCta")}</Link>
                </Button>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                {t("hero.note")}
              </p>
            </div>

            <HomeAppPreview />
          </div>
        </section>

        {/* =================================================================
            Référentiels
            ================================================================= */}
        <section
          id="standards"
          aria-labelledby="standards-title"
          className="container mx-auto max-w-7xl px-6 pb-16 md:pb-20 lg:px-9"
        >
          <h2
            id="standards-title"
            className="text-lg font-extrabold text-secondary-foreground"
          >
            {t("standards.title")}
          </h2>
          <p className="mt-1 text-base text-muted-foreground">
            {t("standards.subtitle")}
          </p>

          <ul className="mt-5 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {STANDARDS.map((key) => (
              <li key={key}>
                <div
                  className="axs-lift flex h-full flex-col gap-0.5 rounded-card border border-border bg-card px-5 py-4"
                  style={
                    {
                      "--lift-color": STANDARD_COLORS[key],
                    } as React.CSSProperties
                  }
                >
                  <span className="text-2xl font-black tracking-tight">
                    {t(`standards.items.${key}.name`)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {t(`standards.items.${key}.desc`)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* =================================================================
            Fonctionnalités, en bento
            ================================================================= */}
        <section
          id="features"
          aria-labelledby="features-title"
          className="bg-background py-16 md:py-20"
        >
          <div className="container mx-auto max-w-7xl px-6 lg:px-9">
            <h2
              id="features-title"
              className="max-w-[18ch] text-[2rem] font-black leading-[1.05] tracking-[-0.04em] md:text-[2.875rem]"
            >
              {t("features.title")}
            </h2>
            <p className="mt-4 max-w-[56ch] text-lg text-secondary-foreground">
              {t("features.subtitle")}
            </p>

            <ul className="mt-10 grid gap-4 lg:grid-cols-6">
              {FEATURE_TILES.map((tile) => (
                <li key={tile.key} className={tile.span}>
                  <article
                    className="axs-lift flex h-full flex-col gap-2.5 rounded-hero border border-border bg-card p-6"
                    style={
                      { "--lift-color": tile.color } as React.CSSProperties
                    }
                  >
                    <h3 className="text-xl font-black tracking-tight">
                      {t(`features.items.${tile.key}.title`)}
                    </h3>
                    <p className="max-w-[46ch] text-base leading-relaxed text-secondary-foreground">
                      {t(`features.items.${tile.key}.desc`)}
                    </p>

                    {/* La grande tuile porte un aperçu de la matrice : des
                        cellules conforme / non conforme / non applicable,
                        purement graphiques. */}
                    {tile.key === "matrix" && (
                      <span
                        aria-hidden="true"
                        className="mt-auto flex max-w-[620px] flex-wrap gap-1.5 pt-4"
                      >
                        {MATRIX_PREVIEW.map((cell, index) => (
                          <span
                            key={index}
                            className="size-[22px] rounded-md"
                            style={{
                              background:
                                cell === "C"
                                  ? "var(--theme-6)"
                                  : cell === "N"
                                    ? "hsl(var(--destructive))"
                                    : "hsl(var(--border-strong))",
                            }}
                          />
                        ))}
                      </span>
                    )}
                  </article>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* =================================================================
            Un audit en trois temps
            ================================================================= */}
        <section
          aria-labelledby="steps-title"
          className="container mx-auto max-w-7xl px-6 py-16 md:py-20 lg:px-9"
        >
          <h2
            id="steps-title"
            className="text-[2rem] font-black leading-[1.05] tracking-[-0.04em] md:text-[2.875rem]"
          >
            {t("steps.title")}
          </h2>

          <ol className="mt-9 grid gap-4 lg:grid-cols-3">
            {stepItems.map((step, index) => (
              <li
                key={step.title}
                className="group flex flex-col gap-3 rounded-hero border border-border bg-card p-6 transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-md"
              >
                <span
                  aria-hidden="true"
                  className="flex size-12 items-center justify-center rounded-[14px] bg-primary text-xl font-black text-primary-foreground transition-[transform,border-radius] duration-300 ease-[cubic-bezier(0.3,1.5,0.5,1)] group-hover:-rotate-[8deg] group-hover:rounded-full"
                >
                  {index + 1}
                </span>
                <h3 className="text-xl font-black tracking-tight">
                  {step.title}
                </h3>
                <p className="text-base leading-relaxed text-secondary-foreground">
                  {step.desc}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* =================================================================
            Un outil d'accessibilité accessible
            ================================================================= */}
        <section
          aria-labelledby="a11y-title"
          className="container mx-auto max-w-7xl px-6 pb-16 md:pb-20 lg:px-9"
        >
          <div className="grid gap-10 rounded-[2rem] bg-ink p-8 text-ink-foreground md:p-14 lg:grid-cols-2 lg:items-center">
            <div>
              <h2
                id="a11y-title"
                className="text-[1.875rem] font-black leading-[1.05] tracking-[-0.04em] md:text-[2.625rem]"
              >
                {t("features.items.a11y.title")}
              </h2>
              <p className="mt-4 max-w-[46ch] text-lg leading-relaxed text-ink-muted">
                {t("features.items.a11y.desc")}
              </p>
              <Link
                href="/accessibility"
                className="mt-4 inline-flex items-center gap-2 text-base font-extrabold underline decoration-1 underline-offset-4 hover:decoration-2"
              >
                {t("a11yBlock.link")}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>

            <ul className="grid gap-3.5 sm:grid-cols-2">
              {a11yItems.map((item) => (
                <li
                  key={item.title}
                  className="rounded-hero bg-ink-raised p-4.5"
                >
                  <span className="block text-base font-extrabold">
                    {item.title}
                  </span>
                  <span className="block text-sm text-ink-muted">
                    {item.desc}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* =================================================================
            FAQ
            ================================================================= */}
        <section
          id="faq"
          aria-labelledby="faq-title"
          className="container mx-auto max-w-7xl px-6 pb-16 md:pb-20 lg:px-9"
        >
          <div className="grid gap-10 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
            <div>
              <h2
                id="faq-title"
                className="text-[2rem] font-black leading-[1.05] tracking-[-0.04em] md:text-[2.875rem]"
              >
                {t("faq.title")}
              </h2>
              <p className="mt-3.5 text-lg text-secondary-foreground">
                {t("faq.subtitle")}
              </p>
              <p className="mt-3.5 text-base text-secondary-foreground">
                {t("faq.contact")}{" "}
                <a
                  href={`mailto:${SITE.supportEmail}`}
                  className="font-bold text-primary underline decoration-1 underline-offset-4 hover:decoration-2"
                >
                  {t("faq.contactCta")}
                </a>
              </p>
            </div>

            <Accordion type="single" collapsible className="border-t border-border">
              {faqItems.map((item, index) => (
                <AccordionItem
                  key={index}
                  value={`faq-${index}`}
                  className="rounded-none border-x-0 border-b border-t-0"
                >
                  <AccordionTrigger className="px-0 py-5 text-lg">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="border-t-0 px-0 pb-5 pt-0">
                    <p className="max-w-[60ch] text-base leading-relaxed text-secondary-foreground">
                      {item.a}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <SignupCta />
      </main>

      <PublicFooter />

      {/* Données structurées spécifiques à la home */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
    </div>
  );
}
