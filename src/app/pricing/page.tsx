import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import {
  ArrowRight,
  Bell,
  Building2,
  Check,
  Code2,
  Image as ImageIcon,
  Lock,
  Mail,
  type LucideIcon,
} from "lucide-react";
import { PublicHeader } from "@/components/public/public-header";
import { PublicFooter } from "@/components/public/public-footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { rowsAddedByPlan } from "@/lib/billing/comparison";
import { PLAN_ORDER, PLANS, type PlanCode } from "@/lib/billing/plans";
import { SITE, siteUrl } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import { BillingIntervalToggle } from "./billing-interval-toggle";
import { ComparisonTable } from "./comparison-table";
import { PlanCards } from "./plan-cards";
import { PlanFinder } from "./plan-finder";
import { PricingStateProvider } from "./pricing-state";

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

const CONTACT_EMAIL = "contact@axessyo.com";
const ENTERPRISE_MAILTO = `mailto:${CONTACT_EMAIL}?subject=Demande%20Enterprise`;

/** Icône et couleur (token de thème) des lignes du bloc Enterprise. */
const ENTERPRISE_ICONS: Record<string, { icon: LucideIcon; color: string }> = {
  sso: { icon: Lock, color: "var(--theme-2)" },
  scim: { icon: Building2, color: "var(--theme-5)" },
  api: { icon: Code2, color: "var(--theme-6)" },
  branding: { icon: ImageIcon, color: "var(--theme-3)" },
  support: { icon: Bell, color: "var(--theme-1)" },
};

/**
 * Cible du bouton d'un plan. Logique inchangée :
 *  - Free : un visiteur connecté file au dashboard, un prospect s'inscrit ;
 *  - Enterprise (contact commercial) : e-mail ;
 *  - plan payant, connecté : page de choix de plan, qui pré-sélectionne le
 *    plan et lance le checkout Stripe ;
 *  - plan payant, prospect : inscription en portant le plan, l'onboarding
 *    reprend ensuite.
 */
function planCtaHref(code: PlanCode, isAuthenticated: boolean): string {
  const plan = PLANS[code];
  if (plan.monthlyPriceEur === 0) {
    return isAuthenticated ? "/dashboard" : "/register";
  }
  if (plan.isContactSales) return ENTERPRISE_MAILTO;
  return isAuthenticated
    ? `/onboarding/plan?plan=${code}`
    : `/register?plan=${code}`;
}

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
      // Un `openGraph` défini ici remplace celui du layout : sans cette ligne,
      // l'image générée par app/opengraph-image.tsx est perdue.
      images: [siteUrl("/opengraph-image")],
    },
    twitter: {
      card: "summary_large_image",
      title: `${t("metaTitle")} · ${SITE.name}`,
      description: t("metaDescription"),
      images: [siteUrl("/twitter-image")],
    },
  };
}

export default async function PricingPage() {
  const t = await getTranslations("pricing");

  // Détection de session côté serveur pour adapter les CTA. `getUser()` ne
  // lève pas (page publique) - on lit juste l'état.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthenticated = Boolean(user);

  const ctaHrefs = Object.fromEntries(
    PLAN_ORDER.map((code) => [code, planCtaHref(code, isAuthenticated)]),
  ) as Record<PlanCode, string>;

  // Économie de l'annuel, calculée sur le plan Starter (référence) : en
  // pourcentage pour le badge, en mois offerts pour la note.
  const { monthlyPriceEur: monthly, yearlyPriceEur: yearly } = PLANS.starter;
  const yearlySavingsPercent =
    monthly && yearly ? Math.round((1 - yearly / (monthly * 12)) * 100) : null;
  const yearlyFreeMonths =
    monthly && yearly ? Math.round(12 - yearly / monthly) : 0;

  const enterprise = PLANS.enterprise;
  const enterpriseRows = rowsAddedByPlan("enterprise");

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

  const guarantees = [
    t("guarantees.noCard", { plan: PLANS.free.name }),
    t("guarantees.noCommitment"),
    t("guarantees.stripe"),
  ];

  return (
    <div className="flex min-h-screen flex-col bg-card">
      <PublicHeader currentHref="/pricing" />

      <main id="main" tabIndex={-1} className="flex-1">
        <PricingStateProvider>
          <div className="container mx-auto flex max-w-7xl flex-col gap-20 *:min-w-0 px-6 pb-20 pt-14 sm:gap-24 lg:px-9 lg:pt-19">
            {/* En-tête ------------------------------------------------ */}
            <section aria-labelledby="pricing-title" className="relative">
              <svg
                aria-hidden="true"
                width="420"
                height="220"
                viewBox="0 0 420 220"
                className="pointer-events-none absolute -top-13 right-0 hidden lg:block"
              >
                <rect x="0" y="20" width="120" height="120" rx="32" fill="hsl(var(--primary-soft))" />
                <circle cx="210" cy="80" r="60" fill="var(--highlight-wash)" />
                <rect x="300" y="20" width="120" height="120" rx="32" fill="hsl(var(--primary-soft))" />
              </svg>

              <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
                <div>
                  <p className="text-base font-extrabold text-primary">
                    {t("kicker")}
                  </p>
                  <h1
                    id="pricing-title"
                    className="mt-3 max-w-[15ch] text-[2.5rem] font-black leading-none tracking-[-0.045em] sm:text-[3.25rem] lg:text-[4rem]"
                  >
                    {t("title")}
                  </h1>
                  <p className="mt-5 max-w-[52ch] text-lg leading-relaxed text-secondary-foreground sm:text-[1.1875rem]">
                    {t("subtitle")}
                  </p>
                  <ul className="mt-5.5 flex flex-wrap gap-x-6 gap-y-2.5">
                    {guarantees.map((text) => (
                      <li
                        key={text}
                        className="inline-flex items-center gap-2 text-[0.9rem] font-bold text-secondary-foreground"
                      >
                        <Check
                          aria-hidden="true"
                          strokeWidth={2.6}
                          className="size-4.5 shrink-0 text-success-text"
                        />
                        {text}
                      </li>
                    ))}
                  </ul>
                </div>
                <BillingIntervalToggle
                  yearlySavingsPercent={yearlySavingsPercent}
                  yearlyFreeMonths={yearlyFreeMonths}
                />
              </div>
            </section>

            {/* Plans -------------------------------------------------- */}
            <section aria-labelledby="pricing-plans-title" className="-mt-6">
              <h2 id="pricing-plans-title" className="sr-only">
                {t("plansLabel")}
              </h2>
              <PlanCards ctaHrefs={ctaHrefs} />
              <p className="mt-5 text-sm text-muted-foreground">
                {t("vatNote")}
              </p>
            </section>

            <PlanFinder ctaHrefs={ctaHrefs} />

            <ComparisonTable />

            {/* Enterprise --------------------------------------------- */}
            <section
              aria-labelledby="pricing-enterprise-title"
              className="bg-ink grid items-center gap-10 rounded-[2rem] px-6 py-10 text-ink-foreground sm:px-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,32.5rem)] lg:gap-15 lg:px-15 lg:py-14"
            >
              <div>
                <span className="inline-flex h-7.5 items-center gap-2 rounded-full bg-ink-raised px-3 text-[0.84rem] font-extrabold">
                  <span
                    aria-hidden="true"
                    className="size-2 rounded-[3px]"
                    style={{ background: "var(--theme-2)" }}
                  />
                  {enterprise.name}
                </span>
                <h2
                  id="pricing-enterprise-title"
                  className="mt-4.5 max-w-[18ch] text-[2rem] font-black leading-[1.05] tracking-[-0.04em] md:text-[2.625rem]"
                >
                  {t("enterprise.title")}
                </h2>
                <p className="mt-4 max-w-[46ch] text-[1.09rem] leading-relaxed text-ink-muted">
                  {t("enterprise.body")}
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <a
                    href={ctaHrefs.enterprise}
                    className="group/cta inline-flex h-12 items-center justify-center gap-2 rounded-row bg-card px-6 text-[0.9375rem] font-extrabold text-foreground transition-[box-shadow,transform] duration-150 hover:shadow-[0_14px_26px_-14px_rgb(0_0_0/0.7)] active:scale-[0.97]"
                  >
                    {t("cta.contactSales")}
                    <ArrowRight
                      aria-hidden="true"
                      className="size-[1.0625rem] transition-transform duration-200 group-hover/cta:translate-x-1"
                    />
                  </a>
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-row border-[1.5px] border-ink-muted/40 px-5.5 text-[0.9375rem] font-extrabold transition-colors duration-150 hover:border-ink-foreground active:scale-[0.97]"
                  >
                    <Mail aria-hidden="true" className="size-4.5" />
                    {t("questionsLead")}
                  </a>
                </div>
              </div>

              <ul
                aria-label={t("enterprise.featuresLabel", {
                  plan: enterprise.name,
                })}
                className="flex flex-col gap-2.5"
              >
                {enterpriseRows.map((row) => {
                  const visual = ENTERPRISE_ICONS[row.key] ?? {
                    icon: Check,
                    color: "hsl(var(--primary))",
                  };
                  const Icon = visual.icon;
                  return (
                    <li
                      key={row.key}
                      className="flex items-center gap-3 rounded-card bg-ink-raised px-4 py-3.5 text-[0.97rem] font-bold transition-transform duration-200 hover:translate-x-1"
                    >
                      <span
                        aria-hidden="true"
                        className="flex size-8.5 shrink-0 items-center justify-center rounded-[0.625rem] text-white"
                        style={{ background: visual.color }}
                      >
                        <Icon className="size-4.5" />
                      </span>
                      {t(`compare.rows.${row.key}`)}
                    </li>
                  );
                })}
              </ul>
            </section>

            {/* FAQ ---------------------------------------------------- */}
            <section
              aria-labelledby="pricing-faq-title"
              className="grid gap-8 lg:grid-cols-[25rem_minmax(0,1fr)] lg:gap-15"
            >
              <div>
                <h2
                  id="pricing-faq-title"
                  className="text-[2rem] font-black leading-[1.05] tracking-[-0.04em] md:text-[2.75rem]"
                >
                  {t("faq.title")}
                </h2>
                <p className="mt-3.5 text-[1.0625rem] text-secondary-foreground">
                  {t("faqContact.lead")}{" "}
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="font-bold text-primary underline decoration-1 underline-offset-4 hover:decoration-2"
                  >
                    {t("faqContact.link")}
                  </a>
                </p>
              </div>

              <Accordion
                type="single"
                collapsible
                defaultValue={FAQ_KEYS[0]}
                className="border-t border-border"
              >
                {faqItems.map((item) => (
                  <AccordionItem
                    key={item.key}
                    value={item.key}
                    className="rounded-none border-x-0 border-t-0 bg-transparent"
                  >
                    <AccordionTrigger className="gap-5 px-1 py-5 text-[1.09rem] font-extrabold hover:bg-transparent hover:text-primary">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="border-t-0 px-1 pb-5 pt-0">
                      <p className="max-w-[60ch] text-base leading-relaxed text-secondary-foreground">
                        {item.answer}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          </div>
        </PricingStateProvider>
      </main>

      <PublicFooter currentHref="/pricing" />

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
