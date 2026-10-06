import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import {
  FaqList,
  faqJsonLd,
  MarketingHero,
  MarketingPage,
} from "@/components/public/marketing-page";
import { buildPublicMetadata } from "@/lib/public-metadata";
import { SITE } from "@/lib/site";

type FaqCategory = {
  id: string;
  title: string;
  items: { q: string; a: string }[];
};

export async function generateMetadata(): Promise<Metadata> {
  return buildPublicMetadata({ path: "/faq", namespace: "faqPage" });
}

export default async function FaqPage() {
  const t = await getTranslations("faqPage");
  const tm = await getTranslations("marketing");

  const categories = t.raw("categories") as FaqCategory[];
  const allItems = categories.flatMap((category) => category.items);

  return (
    <MarketingPage
      currentHref="/faq"
      pageName={t("title")}
      jsonLd={[faqJsonLd(allItems)]}
    >
      <MarketingHero
        id="faq-page-title"
        kicker={t("kicker")}
        title={t("title")}
        subtitle={t("subtitle")}
      >
        <p className="mt-5 text-base text-secondary-foreground">
          {t("contactLead")}{" "}
          <a
            href={`mailto:${SITE.supportEmail}`}
            className="font-bold text-primary underline decoration-1 underline-offset-4 hover:decoration-2"
          >
            {t("contactLink")}
          </a>
        </p>
      </MarketingHero>

      <div className="bg-background py-16 md:py-20">
        <div className="container mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16 lg:px-9">
          <nav
            aria-labelledby="faq-toc-title"
            className="lg:sticky lg:top-28 lg:self-start"
          >
            <h2 id="faq-toc-title" className="text-base font-extrabold">
              {tm("onThisPage")}
            </h2>
            <ol className="mt-3 flex flex-col gap-2 border-l-2 border-border pl-4">
              {categories.map((category) => (
                <li key={category.id}>
                  <a
                    href={`#${category.id}`}
                    className="rounded text-[0.95rem] text-secondary-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    {category.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="flex min-w-0 max-w-[72ch] flex-col gap-14">
            {categories.map((category) => (
              <section
                key={category.id}
                id={category.id}
                aria-labelledby={`${category.id}-title`}
                className="scroll-mt-28"
              >
                <h2
                  id={`${category.id}-title`}
                  className="text-[1.75rem] font-black leading-[1.08] tracking-[-0.04em] md:text-[2.125rem]"
                >
                  {category.title}
                </h2>
                <div className="mt-5">
                  <FaqList items={category.items} />
                </div>
              </section>
            ))}

            <Link
              href="/pricing#pricing-faq-title"
              className="inline-flex items-center gap-2 self-start text-base font-extrabold text-primary underline decoration-1 underline-offset-4 hover:decoration-2"
            >
              {t("pricingLink")}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </MarketingPage>
  );
}
