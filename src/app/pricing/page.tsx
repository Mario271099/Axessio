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
    <div className="flex min-h-screen flex-col bg-card">
      <PublicHeader />

      <main id="main" tabIndex={-1} className="flex-1">
        <section className="container mx-auto max-w-7xl px-6 py-16 sm:py-20 lg:px-9">
          <header className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
            <p className="inline-flex items-center rounded-full bg-primary-soft px-3.5 py-1.5 text-sm font-extrabold text-primary">
              {t("kicker")}
            </p>
            <h1 className="text-[2.25rem] font-black leading-[1.05] tracking-[-0.04em] md:text-[2.875rem]">
              {t("title")}
            </h1>
            <p className="text-lg text-secondary-foreground">
              {t("subtitle")}
            </p>
          </header>

          <div className="mt-10">
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
            <header className="flex flex-col gap-2 text-center">
              <h2
                id="pricing-faq-title"
                className="text-[1.75rem] font-black leading-[1.05] tracking-[-0.04em] md:text-[2.25rem]"
              >
                {t("faq.title")}
              </h2>
              <p className="text-base text-secondary-foreground">
                {t("faq.subtitle")}
              </p>
            </header>

            <Accordion
              type="single"
              collapsible
              className="mt-8 border-t border-border"
            >
              {faqItems.map((item) => (
                <AccordionItem
                  key={item.key}
                  value={item.key}
                  className="rounded-none border-x-0 border-b border-t-0"
                >
                  <AccordionTrigger className="px-0 py-5 text-left text-lg">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="border-t-0 px-0 pb-5 pt-0">
                    <p className="max-w-[60ch] text-base leading-relaxed text-secondary-foreground">
                      {item.answer}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          <footer className="mx-auto mt-12 flex max-w-2xl flex-col gap-2 text-center text-sm text-muted-foreground">
            <p>{t("vatNote")}</p>
            <p>
              {t("questionsLead")}{" "}
              <a
                href="mailto:contact@axessyo.com"
                className="font-bold text-primary underline decoration-1 underline-offset-4 hover:decoration-2"
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
         
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
         
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </div>
  );
}
