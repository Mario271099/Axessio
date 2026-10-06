import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MarketingHero,
  MarketingPage,
} from "@/components/public/marketing-page";
import {
  minPlanForFeature,
  PLAN_ORDER,
  PLANS,
  type FeatureCode,
} from "@/lib/billing/plans";
import { buildPublicMetadata } from "@/lib/public-metadata";
import { SITE, siteUrl } from "@/lib/site";

/**
 * Groupes de fonctionnalités, dans l'ordre d'affichage. Chaque clé existe dans
 * messages/{fr,en}.json sous featuresPage.groups. `feature` relie l'item au
 * catalogue de plans : le badge « Plan X et supérieurs » en découle, il suit
 * donc automatiquement tout changement de plan.
 */
const GROUPS: ReadonlyArray<{
  key: string;
  color: string;
  items: ReadonlyArray<{ key: string; feature?: FeatureCode }>;
}> = [
  {
    key: "audit",
    color: "var(--theme-6)",
    items: [
      { key: "sample" },
      { key: "matrix" },
      { key: "score" },
      { key: "ncs" },
    ],
  },
  {
    key: "deliver",
    color: "var(--theme-2)",
    items: [
      { key: "report", feature: "export.pdf" },
      { key: "exports" },
      { key: "simulator", feature: "remediation.simulator" },
      { key: "client" },
    ],
  },
  {
    key: "team",
    color: "var(--theme-5)",
    items: [
      { key: "collaboration", feature: "audit.collaboration" },
      { key: "proofreading", feature: "audit.proofreading" },
      { key: "planning" },
      { key: "notifications" },
    ],
  },
  {
    key: "security",
    color: "var(--theme-3)",
    items: [
      { key: "isolation" },
      { key: "auditLogs", feature: "audit_logs.export" },
      { key: "webhooks", feature: "webhooks.outgoing" },
      { key: "api", feature: "api.access" },
      { key: "branding", feature: "branding.custom" },
    ],
  },
];

export async function generateMetadata(): Promise<Metadata> {
  return buildPublicMetadata({ path: "/features", namespace: "featuresPage" });
}

export default async function FeaturesPage() {
  const t = await getTranslations("featuresPage");
  const tm = await getTranslations("marketing");
  const tHome = await getTranslations("home");

  /** Libellé du plan minimum, ou null si la fonctionnalité est dans tous les plans. */
  function planBadge(feature?: FeatureCode): string | null {
    if (!feature) return null;
    const plan = minPlanForFeature(feature);
    if (!plan || plan === "free") return null;
    // Le plan le plus haut n'a pas de « supérieurs ».
    const isTopPlan = plan === PLAN_ORDER[PLAN_ORDER.length - 1];
    return tm(isTopPlan ? "availableOn" : "availableFrom", {
      plan: PLANS[plan].name,
    });
  }

  const softwareLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE.name,
    description: t("metaDescription"),
    url: siteUrl("/features"),
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    featureList: GROUPS.flatMap((group) =>
      group.items.map((item) =>
        t(`groups.${group.key}.items.${item.key}.title`),
      ),
    ),
  };

  return (
    <MarketingPage
      currentHref="/features"
      pageName={t("kicker")}
      jsonLd={[softwareLd]}
    >
      <MarketingHero
        id="features-title"
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
            <Link href="/pricing">{tHome("nav.pricing")}</Link>
          </Button>
        </div>
      </MarketingHero>

      <div className="bg-background py-16 md:py-20">
        <div className="container mx-auto flex max-w-7xl flex-col gap-16 px-6 md:gap-20 lg:px-9">
          {GROUPS.map((group) => (
            <section
              key={group.key}
              aria-labelledby={`group-${group.key}`}
              className="grid gap-8 lg:grid-cols-[22rem_minmax(0,1fr)] lg:gap-12"
            >
              <div>
                <span
                  aria-hidden="true"
                  className="block h-1.5 w-12 rounded-full"
                  style={{ background: group.color }}
                />
                <h2
                  id={`group-${group.key}`}
                  className="mt-4 text-[1.875rem] font-black leading-[1.05] tracking-[-0.04em] md:text-[2.375rem]"
                >
                  {t(`groups.${group.key}.title`)}
                </h2>
                <p className="mt-3 max-w-[38ch] text-[1.0625rem] leading-relaxed text-secondary-foreground">
                  {t(`groups.${group.key}.intro`)}
                </p>
              </div>

              <ul className="grid gap-4 sm:grid-cols-2">
                {group.items.map((item) => {
                  const badge = planBadge(item.feature);
                  return (
                    <li key={item.key}>
                      <article
                        className="axs-lift flex h-full flex-col gap-2.5 rounded-hero border border-border bg-card p-6"
                        style={
                          { "--lift-color": group.color } as React.CSSProperties
                        }
                      >
                        <h3 className="text-xl font-black tracking-tight">
                          {t(`groups.${group.key}.items.${item.key}.title`)}
                        </h3>
                        <p className="text-base leading-relaxed text-secondary-foreground">
                          {t(`groups.${group.key}.items.${item.key}.desc`)}
                        </p>
                        {badge && (
                          <p className="mt-auto pt-2">
                            <span className="inline-flex items-center rounded-full bg-primary-soft px-3 py-1 text-sm font-extrabold text-primary">
                              {badge}
                            </span>
                          </p>
                        )}
                      </article>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>

    </MarketingPage>
  );
}
