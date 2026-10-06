import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, ChevronDown, ChevronRight } from "lucide-react";
import { PublicHeader } from "@/components/public/public-header";
import { PublicFooter } from "@/components/public/public-footer";
import { siteUrl } from "@/lib/site";

/** Pages marketing reliées entre elles par le bloc « Pour aller plus loin ». */
const RELATED_PAGES = [
  { href: "/features", key: "features" },
  { href: "/rgaa", key: "rgaa" },
  { href: "/pricing", key: "pricing" },
  { href: "/faq", key: "faq" },
] as const;

type MarketingHref = (typeof RELATED_PAGES)[number]["href"];

/** Données structurées injectées telles quelles dans un script JSON-LD. */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * Coque d'une page marketing indexable : en-tête, fil d'Ariane (visible et en
 * JSON-LD), contenu, maillage vers les autres pages marketing, appel à
 * l'inscription, pied de page.
 */
export function MarketingPage({
  currentHref,
  pageName,
  jsonLd = [],
  children,
}: {
  currentHref: MarketingHref;
  /** Libellé court de la page, dernier maillon du fil d'Ariane. */
  pageName: string;
  jsonLd?: object[];
  children: React.ReactNode;
}) {
  const t = useTranslations("marketing");

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: t("breadcrumbHome"),
        item: siteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: pageName,
        item: siteUrl(currentHref),
      },
    ],
  };

  return (
    <div className="flex min-h-screen flex-col bg-card">
      <PublicHeader currentHref={currentHref} />

      <main id="main" tabIndex={-1} className="flex-1">
        <div className="container mx-auto max-w-7xl px-6 pt-8 lg:px-9">
          <nav aria-label={t("breadcrumbLabel")}>
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              <li className="inline-flex items-center gap-1.5">
                <Link
                  href="/"
                  className="rounded font-bold underline decoration-1 underline-offset-4 hover:text-foreground hover:decoration-2"
                >
                  {t("breadcrumbHome")}
                </Link>
                <ChevronRight aria-hidden="true" className="size-3.5" />
              </li>
              <li aria-current="page" className="font-bold text-foreground">
                {pageName}
              </li>
            </ol>
          </nav>
        </div>

        {children}

        <RelatedPages currentHref={currentHref} />
        <SignupCta />
      </main>

      <PublicFooter currentHref={currentHref} />

      <JsonLd data={breadcrumbLd} />
      {jsonLd.map((data, index) => (
        <JsonLd key={index} data={data} />
      ))}
    </div>
  );
}

/** En-tête de page : surtitre, titre H1 et chapeau. */
export function MarketingHero({
  id,
  kicker,
  title,
  subtitle,
  children,
}: {
  id: string;
  kicker: string;
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="container relative mx-auto max-w-7xl px-6 pb-14 pt-10 lg:px-9 lg:pb-16 lg:pt-14"
    >
      <svg
        aria-hidden="true"
        width="420"
        height="220"
        viewBox="0 0 420 220"
        className="pointer-events-none absolute right-9 top-4 hidden lg:block"
      >
        <rect x="0" y="20" width="120" height="120" rx="32" fill="hsl(var(--primary-soft))" />
        <circle cx="210" cy="80" r="60" fill="var(--highlight-wash)" />
        <rect x="300" y="20" width="120" height="120" rx="32" fill="hsl(var(--primary-soft))" />
      </svg>
      <div className="relative">
        <p className="text-base font-extrabold text-primary">{kicker}</p>
        <h1
          id={id}
          className="mt-3 max-w-[20ch] text-[2.5rem] font-black leading-[1.02] tracking-[-0.045em] sm:text-[3.25rem] lg:text-[3.75rem]"
        >
          {title}
        </h1>
        <p className="mt-5 max-w-[58ch] text-lg leading-relaxed text-secondary-foreground sm:text-[1.1875rem]">
          {subtitle}
        </p>
        {children}
      </div>
    </section>
  );
}

/**
 * Questions / réponses en `<details>` natifs : les réponses restent dans le
 * HTML servi (lisibles par les moteurs et par la recherche du navigateur),
 * fonctionnent sans JavaScript et sont annoncées nativement comme
 * dépliables par les lecteurs d'écran.
 */
export function FaqList({
  items,
}: {
  items: ReadonlyArray<{ q: string; a: string }>;
}) {
  return (
    <ul className="border-t border-border">
      {items.map((item) => (
        <li key={item.q} className="border-b border-border">
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-5 rounded px-1 py-5 text-[1.09rem] font-extrabold transition-colors hover:text-primary [&::-webkit-details-marker]:hidden">
              {item.q}
              <ChevronDown
                aria-hidden="true"
                className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
              />
            </summary>
            <p className="max-w-[65ch] px-1 pb-5 text-base leading-relaxed text-secondary-foreground">
              {item.a}
            </p>
          </details>
        </li>
      ))}
    </ul>
  );
}

/** JSON-LD FAQPage à partir des mêmes questions que celles affichées. */
export function faqJsonLd(items: ReadonlyArray<{ q: string; a: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

function RelatedPages({ currentHref }: { currentHref: MarketingHref }) {
  const t = useTranslations("marketing.related");
  const pages = RELATED_PAGES.filter((page) => page.href !== currentHref);
  return (
    <section
      aria-labelledby="related-title"
      className="container mx-auto max-w-7xl px-6 py-16 md:py-20 lg:px-9"
    >
      <h2
        id="related-title"
        className="text-[1.75rem] font-black leading-[1.05] tracking-[-0.04em] md:text-[2.25rem]"
      >
        {t("title")}
      </h2>
      <ul className="mt-7 grid gap-4 md:grid-cols-3">
        {pages.map((page) => (
          <li key={page.href}>
            <Link
              href={page.href}
              className="group flex h-full flex-col gap-1.5 rounded-hero border border-border bg-card p-6 transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-md"
            >
              <span className="inline-flex items-center gap-2 text-xl font-black tracking-tight group-hover:text-primary">
                {t(`${page.key}.title`)}
                <ArrowRight
                  aria-hidden="true"
                  className="size-4.5 transition-transform duration-200 group-hover:translate-x-1"
                />
              </span>
              <span className="text-base text-secondary-foreground">
                {t(`${page.key}.desc`)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Bloc cobalt d'appel à l'inscription, partagé avec la page d'accueil. */
export function SignupCta() {
  const t = useTranslations("home");
  return (
    <section
      aria-labelledby="cta-title"
      className="container mx-auto max-w-7xl px-6 pb-16 md:pb-20 lg:px-9"
    >
      <div className="relative flex flex-wrap items-center justify-between gap-8 overflow-hidden rounded-[2rem] bg-cobalt p-8 text-cobalt-foreground md:p-14">
        <svg
          aria-hidden="true"
          viewBox="0 0 420 420"
          className="pointer-events-none absolute -right-16 -top-20 h-[420px] w-[420px] opacity-[0.14]"
        >
          <g fill="currentColor">
            <rect x="0" y="0" width="190" height="190" rx="46" />
            <circle cx="325" cy="95" r="95" />
            <rect x="0" y="230" width="190" height="190" rx="46" />
          </g>
        </svg>

        <div className="relative min-w-0">
          <h2
            id="cta-title"
            className="max-w-[20ch] text-[1.875rem] font-black leading-[1.05] tracking-[-0.04em] md:text-[2.75rem]"
          >
            {t("cta.title")}
          </h2>
          <p className="mt-3.5 max-w-[46ch] text-lg text-cobalt-foreground/85">
            {t("cta.subtitle")}
          </p>
        </div>

        <Link
          href="/register"
          className="group relative inline-flex h-[54px] items-center gap-2.5 rounded-[14px] bg-card px-6 text-[1.05rem] font-extrabold text-foreground transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-float"
        >
          {t("cta.button")}
          <ArrowRight
            className="size-[18px] transition-transform duration-200 group-hover:translate-x-1"
            aria-hidden="true"
          />
        </Link>
      </div>
    </section>
  );
}
