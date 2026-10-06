import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingHero } from "@/components/public/marketing-page";
import { SITE, siteUrl } from "@/lib/site";

/**
 * Pages des référentiels, dans l'ordre d'usage. La clé est celle de
 * marketing.related (titre + description de la carte).
 */
const STANDARD_PAGES = [
  { href: "/rgaa", key: "rgaa" },
  { href: "/wcag", key: "wcag" },
  { href: "/raweb", key: "raweb" },
  { href: "/raam", key: "raam" },
] as const;

type StandardHref = (typeof STANDARD_PAGES)[number]["href"];

/** En-tête d'une page de référentiel, avec ses deux appels à l'action. */
export function StandardHero({
  id,
  kicker,
  title,
  subtitle,
}: {
  id: string;
  kicker: string;
  title: string;
  subtitle: string;
}) {
  const tHome = useTranslations("home");
  const tRgaa = useTranslations("rgaaPage");
  return (
    <MarketingHero id={id} kicker={kicker} title={title} subtitle={subtitle}>
      <div className="mt-7 flex flex-wrap items-center gap-3">
        <Button asChild size="lg">
          <Link href="/register">
            {tHome("hero.primaryCta")}
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/features">{tRgaa("how.cta")}</Link>
        </Button>
      </div>
    </MarketingHero>
  );
}

/** Cartes vers les autres référentiels (maillage interne entre standards). */
export function OtherStandards({ current }: { current: StandardHref }) {
  const t = useTranslations("marketing.related");
  return (
    <ul className="mt-4 grid gap-3 sm:grid-cols-3">
      {STANDARD_PAGES.filter((page) => page.href !== current).map((page) => (
        <li key={page.href}>
          <Link
            href={page.href}
            className="group flex h-full flex-col gap-1 rounded-card border border-border bg-card p-4 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="inline-flex items-center gap-1.5 text-base font-black group-hover:text-primary">
              {t(`${page.key}.title`)}
              <ArrowRight
                aria-hidden="true"
                className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </span>
            <span className="text-sm text-secondary-foreground">
              {t(`${page.key}.desc`)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** JSON-LD WebPage d'une page de référentiel, reliée au texte officiel. */
export function standardPageLd({
  path,
  name,
  description,
  about,
  aboutUrl,
}: {
  path: StandardHref;
  name: string;
  description: string;
  about: string;
  aboutUrl: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    description,
    url: siteUrl(path),
    about: { "@type": "Thing", name: about, sameAs: aboutUrl },
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
  };
}
