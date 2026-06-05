import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { PublicHeader } from "@/components/public/public-header";
import { PublicFooter } from "@/components/public/public-footer";
import { PLANS } from "@/lib/billing/plans";
import { SITE, siteUrl } from "@/lib/site";
import { BillingIntervalToggle } from "./billing-interval-toggle";

// ----------------------------------------------------------------------------
// Metadata SEO — page indexable, opposée des layouts privés.
// ----------------------------------------------------------------------------
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pricing");
  const locale = await getLocale();
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: "/pricing" },
    openGraph: {
      type: "website",
      siteName: SITE.name,
      title: `${t("metaTitle")} · ${SITE.name}`,
      description: t("metaDescription"),
      url: `${SITE.url}/pricing`,
      locale: locale === "en" ? SITE.locale.en : SITE.locale.fr,
    },
    twitter: {
      card: "summary_large_image",
      title: `${t("metaTitle")} · ${SITE.name}`,
      description: t("metaDescription"),
    },
  };
}

export default async function PricingPage() {
  const t = await getTranslations("pricing");

  // Économie annuelle moyenne sur les plans payants (Starter / Pro) — passée
  // en prop au composant client pour rester à jour si les prix changent.
  // On prend le plan Starter comme référence (≈ 290 € au lieu de 12 × 29 = 348 €).
  const starter = PLANS.starter;
  const yearlySavingsPercent =
    starter.monthlyPriceEur && starter.yearlyPriceEur
      ? Math.round(
          (1 - starter.yearlyPriceEur / (starter.monthlyPriceEur * 12)) * 100,
        )
      : null;

  // JSON-LD Product / Offer pour aider les moteurs à comprendre les tarifs.
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: SITE.name,
    description: t("metaDescription"),
    brand: { "@type": "Brand", name: SITE.name },
    offers: Object.values(PLANS)
      .filter((p) => p.monthlyPriceEur !== null && p.code !== "free")
      .map((p) => ({
        "@type": "Offer",
        name: p.name,
        price: p.monthlyPriceEur,
        priceCurrency: "EUR",
        url: siteUrl(`/pricing#${p.code}`),
        availability: "https://schema.org/InStock",
      })),
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />

      <main id="main" tabIndex={-1} className="flex-1">
        <section className="container mx-auto max-w-6xl px-6 py-16 sm:py-24">
          <header className="mx-auto max-w-2xl space-y-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              {t("kicker")}
            </p>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              {t("title")}
            </h1>
            <p className="text-base text-muted-foreground md:text-lg">
              {t("subtitle")}
            </p>
          </header>

          <div className="mt-12">
            <BillingIntervalToggle
              yearlySavingsPercent={yearlySavingsPercent}
            />
          </div>

          <footer className="mx-auto mt-12 max-w-2xl space-y-2 text-center text-xs text-muted-foreground">
            <p>{t("vatNote")}</p>
            <p>
              {t("questionsLead")}{" "}
              <a
                href="mailto:contact@axessyo.com"
                className="text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded"
              >
                contact@axessyo.com
              </a>
            </p>
          </footer>
        </section>
      </main>

      <PublicFooter />

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
    </div>
  );
}
