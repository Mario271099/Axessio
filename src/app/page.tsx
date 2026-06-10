import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import {
  ArrowRight,
  Check,
  FileDown,
  Globe,
  Languages,
  Lock,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicHeader } from "@/components/public/public-header";
import { PublicFooter } from "@/components/public/public-footer";
import { createClient } from "@/lib/supabase/server";
import { SITE, siteUrl } from "@/lib/site";

const FEATURE_KEYS = [
  "matrix",
  "ncs",
  "reports",
  "multitenant",
  "i18n",
  "a11y",
] as const;

const FEATURE_ICONS = {
  matrix: Check,
  ncs: MessageSquare,
  reports: FileDown,
  multitenant: Lock,
  i18n: Languages,
  a11y: ShieldCheck,
} as const;

const STANDARDS = [
  "RGAA 4.1.2",
  "WCAG 2.2",
  "RAWeb 1.1",
  "RAAM 1.1",
];

// La home reste indexable (override de l'override dashboard) avec sa propre
// méta. On laisse next-intl régler le titre/description selon la locale.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("home");
  const locale = await getLocale();
  const isEn = locale === "en";
  const title = t("metaTitle");
  const description = t("metaDescription");
  return {
    title,
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

  // JSON-LD SoftwareApplication + FAQPage — enrichit le snippet Google.
  type FaqItem = { q: string; a: string };
  const faqItems = (await getTranslations("home"))
    .raw("faq.items") as FaqItem[];

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
    <>
      <PublicHeader />

      <main id="main" tabIndex={-1}>
        {/* =================================================================
            Hero
            ================================================================= */}
        <section
          aria-labelledby="hero-title"
          className="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary/8 via-background to-background"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.15),transparent_55%)]"
          />
          <div className="container relative mx-auto max-w-6xl px-6 py-20 md:py-28">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                {t("hero.kicker")}
              </p>
              <h1
                id="hero-title"
                className="mt-4 text-4xl font-bold leading-tight tracking-tight md:text-6xl"
              >
                {t("hero.title")}
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground md:text-xl">
                {t("hero.subtitle")}
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                <Button asChild size="lg">
                  <Link href="/login">
                    {t("hero.primaryCta")}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="#features">{t("hero.secondaryCta")}</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================================
            Features
            ================================================================= */}
        <section
          id="features"
          aria-labelledby="features-title"
          className="border-b border-border py-20 md:py-28"
        >
          <div className="container mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2
                id="features-title"
                className="text-3xl font-bold tracking-tight md:text-4xl"
              >
                {t("features.title")}
              </h2>
              <p className="mt-4 text-base text-muted-foreground md:text-lg">
                {t("features.subtitle")}
              </p>
            </div>

            <ul className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURE_KEYS.map((key) => {
                const Icon = FEATURE_ICONS[key];
                return (
                  <li key={key}>
                    <article className="h-full rounded-lg border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:shadow-md">
                      <div
                        aria-hidden="true"
                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="mt-4 text-lg font-semibold tracking-tight">
                        {t(`features.items.${key}.title`)}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {t(`features.items.${key}.desc`)}
                      </p>
                    </article>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* =================================================================
            Standards
            ================================================================= */}
        <section
          id="standards"
          aria-labelledby="standards-title"
          className="border-b border-border bg-muted/30 py-20 md:py-24"
        >
          <div className="container mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <Globe
                aria-hidden="true"
                className="mx-auto h-8 w-8 text-primary"
              />
              <h2
                id="standards-title"
                className="mt-4 text-3xl font-bold tracking-tight md:text-4xl"
              >
                {t("standards.title")}
              </h2>
              <p className="mt-4 text-base text-muted-foreground md:text-lg">
                {t("standards.subtitle")}
              </p>
            </div>

            <ul className="mt-12 flex flex-wrap items-center justify-center gap-3">
              {STANDARDS.map((badge) => (
                <li
                  key={badge}
                  className="rounded-md border border-border bg-background px-4 py-2 font-mono text-sm font-medium text-foreground shadow-sm"
                >
                  {badge}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* =================================================================
            CTA
            ================================================================= */}
        <section
          aria-labelledby="cta-title"
          className="border-b border-border py-20 md:py-24"
        >
          <div className="container mx-auto max-w-3xl px-6 text-center">
            <h2
              id="cta-title"
              className="text-3xl font-bold tracking-tight md:text-4xl"
            >
              {t("cta.title")}
            </h2>
            <p className="mt-4 text-base text-muted-foreground md:text-lg">
              {t("cta.subtitle")}
            </p>
            <div className="mt-10">
              <Button asChild size="lg">
                <Link href="/login">
                  {t("cta.button")}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />

      {/* Données structurées spécifiques à la home */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
    </>
  );
}
