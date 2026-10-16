import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Mail } from "lucide-react";
import {
  MarketingHero,
  MarketingPage,
} from "@/components/public/marketing-page";
import { textLinkClass } from "@/components/public/marketing-blocks";
import { buildPublicMetadata } from "@/lib/public-metadata";
import { SITE, siteUrl } from "@/lib/site";
import { ContactForm } from "./contact-form";

export async function generateMetadata(): Promise<Metadata> {
  return buildPublicMetadata({ path: "/contact", namespace: "contactPage" });
}

export default async function ContactPage() {
  const t = await getTranslations("contactPage");

  const pageLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: t("metaTitle"),
    description: t("metaDescription"),
    url: siteUrl("/contact"),
    mainEntity: {
      "@type": "Organization",
      name: SITE.name,
      url: SITE.url,
      email: SITE.supportEmail,
    },
  };

  return (
    <MarketingPage
      currentHref="/contact"
      pageName={t("breadcrumb")}
      related={["/features", "/pricing", "/faq"]}
      jsonLd={[pageLd]}
    >
      <MarketingHero
        id="contact-title"
        kicker={t("kicker")}
        title={t("title")}
        subtitle={t("subtitle")}
      />

      <div className="bg-background py-16 md:py-20">
        <div className="container mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-14 lg:px-9">
          <div className="min-w-0">
            <ContactForm />
          </div>

          <aside aria-labelledby="contact-aside-title" className="flex flex-col gap-6">
            <h2 id="contact-aside-title" className="text-xl font-black tracking-tight">
              {t("aside.title")}
            </h2>
            <div>
              <p className="text-sm font-extrabold text-muted-foreground">
                {t("aside.emailLabel")}
              </p>
              <a
                href={`mailto:${SITE.supportEmail}`}
                className={`mt-1 inline-flex items-center gap-2 text-base ${textLinkClass}`}
              >
                <Mail aria-hidden="true" className="size-4.5" />
                {SITE.supportEmail}
              </a>
            </div>
            <p className="text-base leading-relaxed text-secondary-foreground">
              {t("aside.faqLead")}{" "}
              <Link href="/faq" className={textLinkClass}>
                {t("aside.faqLink")}
              </Link>
              .
            </p>
            <p className="text-base leading-relaxed text-secondary-foreground">
              {t("aside.pricingLead")}{" "}
              <Link href="/pricing" className={textLinkClass}>
                {t("aside.pricingLink")}
              </Link>
              .
            </p>
          </aside>
        </div>
      </div>
    </MarketingPage>
  );
}
