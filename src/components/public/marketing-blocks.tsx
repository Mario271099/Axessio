import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import {
  minPlanForFeature,
  PLAN_ORDER,
  PLANS,
  type FeatureCode,
} from "@/lib/billing/plans";

/**
 * Briques de contenu des pages marketing longues (référentiels, sécurité,
 * à propos). Composants serveur, sans état : la mise en forme reste
 * identique d'une page à l'autre.
 */

export type ArticleSection = {
  /** Ancre de la section (cible du sommaire). */
  id: string;
  title: string;
  content: React.ReactNode;
};

/**
 * Article en deux colonnes : sommaire « Sur cette page » (collant sur grand
 * écran) et sections titrées en H2. Chaque section est une région nommée par
 * son titre.
 */
export function ArticleLayout({ sections }: { sections: ArticleSection[] }) {
  const t = useTranslations("marketing");
  return (
    <div className="bg-background py-16 md:py-20">
      <div className="container mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16 lg:px-9">
        <nav
          aria-labelledby="toc-title"
          className="lg:sticky lg:top-28 lg:self-start"
        >
          <h2 id="toc-title" className="text-base font-extrabold">
            {t("onThisPage")}
          </h2>
          <ol className="mt-3 flex flex-col gap-2 border-l-2 border-border pl-4">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="rounded text-[0.95rem] text-secondary-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="flex min-w-0 max-w-[72ch] flex-col gap-16">
          {sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              aria-labelledby={`${section.id}-title`}
              className="scroll-mt-28"
            >
              <h2
                id={`${section.id}-title`}
                className="text-[1.75rem] font-black leading-[1.08] tracking-[-0.04em] md:text-[2.25rem]"
              >
                {section.title}
              </h2>
              <div className="mt-5">{section.content}</div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Suite de paragraphes de lecture longue. */
export function Paragraphs({ items }: { items: ReadonlyArray<string> }) {
  return (
    <div className="flex flex-col gap-4">
      {items.map((text) => (
        <p
          key={text}
          className="text-[1.0625rem] leading-relaxed text-secondary-foreground"
        >
          {text}
        </p>
      ))}
    </div>
  );
}

/** Intertitre H3 à l'intérieur d'une section. */
export function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mt-8 text-xl font-black tracking-tight first:mt-0">
      {children}
    </h3>
  );
}

/** Liste à puces cochées (obligations, garanties). */
export function CheckList({ items }: { items: ReadonlyArray<string> }) {
  return (
    <ul className="mt-4 flex flex-col gap-3">
      {items.map((text) => (
        <li key={text} className="flex gap-3 text-base leading-relaxed">
          <Check
            aria-hidden="true"
            strokeWidth={2.6}
            className="mt-1 size-4.5 shrink-0 text-success-text"
          />
          {text}
        </li>
      ))}
    </ul>
  );
}

/** Liste numérotée en grille (thématiques d'un référentiel). */
export function NumberedGrid({ items }: { items: ReadonlyArray<string> }) {
  return (
    <ol className="mt-4 grid gap-2.5 sm:grid-cols-2">
      {items.map((label, index) => (
        <li
          key={label}
          className="flex items-center gap-3 rounded-card border border-border bg-card px-4 py-3 text-base font-bold"
        >
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-sm font-black tabular-nums text-primary"
          >
            {index + 1}
          </span>
          {label}
        </li>
      ))}
    </ol>
  );
}

/** Cartes titre + texte (principes, engagements, mesures de sécurité). */
export function CardGrid({
  items,
}: {
  items: ReadonlyArray<{ title: string; desc: string; tag?: string }>;
}) {
  return (
    <ul className="mt-4 grid gap-3.5 sm:grid-cols-2">
      {items.map((item) => (
        <li
          key={item.title}
          className="flex flex-col gap-1.5 rounded-card border border-border bg-card p-5"
        >
          <h3 className="text-lg font-black tracking-tight">
            {item.title}
            {item.tag && (
              <span className="ml-2 inline-flex rounded-full bg-primary-soft px-2.5 py-0.5 align-middle text-sm font-extrabold text-primary">
                {item.tag}
              </span>
            )}
          </h3>
          <p className="text-base leading-relaxed text-secondary-foreground">
            {item.desc}
          </p>
        </li>
      ))}
    </ul>
  );
}

/** Étapes numérotées (déroulé d'un audit). */
export function StepList({
  items,
}: {
  items: ReadonlyArray<{ title: string; desc: string }>;
}) {
  return (
    <ol className="flex flex-col gap-4">
      {items.map((step, index) => (
        <li
          key={step.title}
          className="flex gap-4 rounded-hero border border-border bg-card p-5"
        >
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-primary text-lg font-black text-primary-foreground"
          >
            {index + 1}
          </span>
          <div>
            <h3 className="text-lg font-black tracking-tight">{step.title}</h3>
            <p className="mt-1 text-base leading-relaxed text-secondary-foreground">
              {step.desc}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Note de source en petit, avec lien externe vers le texte officiel. */
export function SourceNote({ children }: { children: React.ReactNode }) {
  return <p className="mt-6 text-sm text-muted-foreground">{children}</p>;
}

/** Lien de texte souligné, pour les liens insérés via `t.rich`. */
export const textLinkClass =
  "font-bold text-primary underline decoration-1 underline-offset-4 hover:decoration-2";

/**
 * Libellé « Plan X et supérieurs » d'une fonctionnalité payante, dérivé du
 * catalogue de plans (suit donc tout changement d'offre). null si la
 * fonctionnalité est incluse dans tous les plans.
 */
export function planBadgeLabel(
  feature: FeatureCode | undefined,
  t: (key: "availableOn" | "availableFrom", values: { plan: string }) => string,
): string | null {
  if (!feature) return null;
  const plan = minPlanForFeature(feature);
  if (!plan || plan === "free") return null;
  // Le plan le plus haut n'a pas de « supérieurs ».
  const isTopPlan = plan === PLAN_ORDER[PLAN_ORDER.length - 1];
  return t(isTopPlan ? "availableOn" : "availableFrom", {
    plan: PLANS[plan].name,
  });
}
