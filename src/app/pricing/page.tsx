import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { PublicHeader } from "@/components/public/public-header";
import { PublicFooter } from "@/components/public/public-footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PLANS } from "@/lib/billing/plans";
import { SITE, siteUrl } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import { BillingIntervalToggle } from "./billing-interval-toggle";

// Clés des questions de la FAQ - l'ordre est l'ordre d'affichage. Chaque clé
// doit exister dans messages/{fr,en}.json sous pricing.faq.items.
const FAQ_KEYS = [
  "free",
  "commitment",
  "changePlan",
  "limits",
  "payment",
  "vat",
  "data",
  "references",
] as const;

// ----------------------------------------------------------------------------
// Metadata SEO - page indexable, opposée des layouts privés.
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

  // Détection de session côté serveur : un visiteur connecté qui choisit un
  // plan part directement vers le choix de plan (checkout), un prospect part
  // vers l'inscription en conservant le plan voulu. `getUser()` ne lève pas
  // (page publique) - on lit juste l'état pour adapter les CTA.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthenticated = Boolean(user);

  // Économie annuelle moyenne sur les plans payants (Starter / Pro) - passée
  // en prop au composant client pour rester à jour si les prix changent.
  // On prend le plan Starter comme référence (≈ 290 € au lieu de 12 × 29 = 348 €).
  const starter = PLANS.starter;
  const yearlySavingsPercent =
    starter.monthlyPriceEur && starter.yearlyPriceEur
      ? Math.round(
          (1 - starter.yearlyPriceEur / (starter.monthlyPriceEur * 12)) * 100,
        )
      : null;

  const faqItems = FAQ_KEYS.map((key) => ({
    key,
    question: t(`faq.items.${key}.question`),
    answer: t(`faq.items.${key}.answer`),
  }));

  // JSON-LD FAQPage - les questions/réponses peuvent apparaître en rich
  // snippet dans les résultats de recherche.
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

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
              isAuthenticated={isAuthenticated}
            />
          </div>

          {/* FAQ ------------------------------------------------------- */}
          <section
            aria-labelledby="pricing-faq-title"
            className="mx-auto mt-20 max-w-3xl"
          >
            <header className="space-y-2 text-center">
              <h2
                id="pricing-faq-title"
                className="text-2xl font-bold tracking-tight md:text-3xl"
              >
                {t("faq.title")}
              </h2>
              <p className="text-sm text-muted-foreground md:text-base">
                {t("faq.subtitle")}
              </p>
            </header>

            <Accordion type="single" collapsible className="mt-8">
              {faqItems.map((item) => (
                <AccordionItem key={item.key} value={item.key}>
                  <AccordionTrigger className="text-left text-sm font-medium md:text-base">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {item.answer}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          <footer className="mx-auto mt-12 max-w-2xl space-y-2 text-center text-xs text-muted-foreground">
            <p>{t("vatNote")}</p>
            <p>
              {t("questionsLead")}{" "}
              <a
                href="mailto:contact@axessyo.com"
                className="text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded"
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
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </div>
  );
}
