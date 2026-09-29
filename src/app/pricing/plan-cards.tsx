import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { SUPPORTED_STANDARDS } from "@/lib/constants";
import { rowsAddedByPlan } from "@/lib/billing/comparison";
import {
  PLAN_ORDER,
  PLANS,
  planLimit,
  previousPlan,
  type LimitCode,
  type PlanCode,
} from "@/lib/billing/plans";

/** Plan mis en avant (carte encre + badge « Recommandé »). */
export const RECOMMENDED_PLAN: PlanCode = "pro";

/** Couleur d'accent de chaque carte (survol, pastille), tokens de thème. */
const PLAN_COLORS: Record<PlanCode, { accent: string; dot: string }> = {
  free: { accent: "var(--theme-13)", dot: "var(--theme-13)" },
  starter: { accent: "var(--theme-5)", dot: "var(--theme-5)" },
  pro: { accent: "hsl(var(--primary))", dot: "hsl(var(--highlight))" },
  enterprise: { accent: "var(--theme-2)", dot: "var(--theme-2)" },
};

// Classes statiques (Tailwind ne lit que des chaînes littérales) : la carte
// qui correspond au plan conseillé, lu dans `data-match` du conteneur client.
const MATCH_CLASSES: Record<PlanCode, { card: string; tag: string }> = {
  free: {
    card: "group-data-[match=free]/pricing:outline-primary",
    tag: "group-data-[match=free]/pricing:inline-flex",
  },
  starter: {
    card: "group-data-[match=starter]/pricing:outline-primary",
    tag: "group-data-[match=starter]/pricing:inline-flex",
  },
  pro: {
    card: "group-data-[match=pro]/pricing:outline-primary",
    tag: "group-data-[match=pro]/pricing:inline-flex",
  },
  enterprise: {
    card: "group-data-[match=enterprise]/pricing:outline-primary",
    tag: "group-data-[match=enterprise]/pricing:inline-flex",
  },
};

/** Ordre des tuiles de limites, comme la maquette. */
const LIMIT_TILES: ReadonlyArray<LimitCode> = [
  "max_active_audits",
  "max_members",
  "max_clients",
  "max_audits_per_month",
];

/** Visible seulement pour la période choisie (cf. PricingStateProvider). */
export const ONLY_MONTHLY = "group-data-[interval=yearly]/pricing:hidden";
export const ONLY_YEARLY = "group-data-[interval=monthly]/pricing:hidden";

export function PlanCards({
  ctaHrefs,
}: {
  ctaHrefs: Readonly<Record<PlanCode, string>>;
}) {
  return (
    <ul className="grid items-stretch gap-x-4.5 gap-y-8 sm:grid-cols-2 xl:grid-cols-4">
      {PLAN_ORDER.map((code) => (
        <PlanCard
          key={code}
          code={code}
          previous={previousPlan(code)}
          href={ctaHrefs[code]}
        />
      ))}
    </ul>
  );
}

function PlanCard({
  code,
  previous,
  href,
}: {
  code: PlanCode;
  previous: PlanCode | null;
  href: string;
}) {
  const t = useTranslations("pricing");
  const plan = PLANS[code];
  const onInk = code === RECOMMENDED_PLAN;
  const muted = onInk ? "text-ink-muted" : "text-muted-foreground";
  const colors = PLAN_COLORS[code];
  const features = rowsAddedByPlan(code);

  const ctaLabel = plan.isContactSales
    ? t("cta.contactSales")
    : plan.monthlyPriceEur === 0
      ? t("cta.startFree")
      : t("cta.choosePlan");

  return (
    <li
      id={code}
      style={{ "--plan-color": colors.accent } as CSSProperties}
      className={cn(
        "group/card relative flex flex-col gap-4 rounded-3xl border px-6.5 pb-6.5 pt-7",
        "outline-3 outline-offset-4 outline-transparent",
        "transition-[transform,box-shadow,border-color,outline-color] duration-300 ease-lift",
        "hover:-translate-y-[5px] hover:border-(--plan-color) hover:shadow-[0_30px_50px_-32px_var(--plan-color)]",
        onInk
          ? "bg-ink border-ink text-ink-foreground"
          : "border-border bg-card",
        MATCH_CLASSES[code].card,
      )}
    >
      <span
        className={cn(
          "fade-in-up absolute -top-[0.9375rem] left-6 hidden h-7.5 items-center gap-1.5 rounded-full bg-primary px-3 text-[0.8125rem] font-extrabold text-primary-foreground shadow-btn",
          MATCH_CLASSES[code].tag,
        )}
      >
        <Check aria-hidden="true" className="size-[0.9375rem]" strokeWidth={3} />
        {t("matchBadge")}
      </span>

      <div className="flex items-center justify-between gap-2.5">
        <h3 className="flex items-center gap-2.5 text-[1.4375rem] font-black tracking-[-0.02em]">
          <span
            aria-hidden="true"
            style={{ background: colors.dot }}
            className="size-3 shrink-0 rounded-[4px] transition-[transform,border-radius] duration-300 ease-bounce group-hover/card:rotate-45 group-hover/card:rounded-full"
          />
          {plan.name}
        </h3>
        {onInk && (
          <span className="inline-flex h-6.5 items-center rounded-full bg-highlight px-3 text-[0.78rem] font-extrabold text-ink">
            {t("recommendedBadge")}
          </span>
        )}
      </div>
      <p className={cn("-mt-2 text-[0.9rem]", muted)}>{plan.description}</p>

      <PlanPrice code={code} muted={muted} />

      <a
        href={href}
        className={cn(
          "group/cta inline-flex h-12 items-center justify-center gap-2 rounded-row px-4 text-[0.9375rem] font-extrabold transition-[transform,background-color,box-shadow,color,border-color] duration-150 active:scale-[0.97]",
          onInk
            ? "bg-card text-foreground hover:shadow-[0_14px_26px_-14px_rgb(0_0_0/0.7)]"
            : "border-[1.5px] border-border-strong bg-card text-foreground hover:border-primary hover:text-primary",
        )}
      >
        {ctaLabel}
        <ArrowRight
          aria-hidden="true"
          className="size-[1.0625rem] transition-transform duration-200 group-hover/cta:translate-x-1"
        />
      </a>

      <ul className="grid grid-cols-2 gap-2">
        {LIMIT_TILES.map((limitCode) => {
          const value = planLimit(code, limitCode);
          return (
            <li
              key={limitCode}
              className={cn(
                "flex flex-col gap-px rounded-[0.875rem] px-3 py-2.5 transition-colors duration-200",
                onInk
                  ? "bg-ink-raised"
                  : "bg-background group-hover/card:bg-primary-soft",
              )}
            >
              <b className="text-[1.1875rem] font-black tracking-[-0.02em] tabular">
                {value ?? t("unlimited")}
              </b>
              <span className={cn("text-[0.78rem]", muted)}>
                {t(`limitTiles.${limitCode}`, { count: value ?? 2 })}
              </span>
            </li>
          );
        })}
      </ul>

      <ul className="flex flex-col gap-2.5">
        {previous && (
          <FeatureItem onInk={onInk}>
            {t("everythingIn", { plan: PLANS[previous].name })}
          </FeatureItem>
        )}
        {features.map((row) => (
          <FeatureItem key={row.key} onInk={onInk}>
            {t(`compare.rows.${row.key}`, {
              standards: SUPPORTED_STANDARDS.join(", "),
            })}
          </FeatureItem>
        ))}
      </ul>
    </li>
  );
}

function FeatureItem({
  onInk,
  children,
}: {
  onInk: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-2.5 text-[0.9rem] leading-snug">
      <Check
        aria-hidden="true"
        strokeWidth={2.6}
        className={cn(
          "mt-px size-4.5 shrink-0",
          onInk ? "text-ink-positive" : "text-success",
        )}
      />
      <span>{children}</span>
    </li>
  );
}

function PlanPrice({
  code,
  muted,
}: {
  code: PlanCode;
  muted: string;
}) {
  const t = useTranslations("pricing");
  const plan = PLANS[code];
  const amount = "text-[2.875rem] font-black leading-none tracking-[-0.04em] tabular";
  const unit = cn("text-[0.9375rem] font-semibold", muted);
  const note = cn("mt-1 text-sm", muted);

  if (plan.isContactSales || plan.monthlyPriceEur === null) {
    return (
      <div>
        <p className={amount}>{t("contactSales")}</p>
        <p className={note}>{t("contactSalesNote")}</p>
      </div>
    );
  }

  if (plan.monthlyPriceEur === 0) {
    return (
      <div>
        <p className={amount}>{t("price.amount", { amount: 0 })}</p>
        <p className={note}>{t("forever")}</p>
      </div>
    );
  }

  const yearly = plan.yearlyPriceEur;
  return (
    <div>
      <div className={yearly !== null ? ONLY_MONTHLY : undefined}>
        <p className="flex flex-wrap items-baseline gap-1.5">
          <span className={amount}>
            {t("price.amount", { amount: plan.monthlyPriceEur })}
          </span>
          <span className={unit}>{t("price.unit")}</span>
        </p>
        <p className={note}>{t("price.monthlyNote")}</p>
      </div>
      {yearly !== null && (
        <div className={ONLY_YEARLY}>
          <p className="flex flex-wrap items-baseline gap-1.5">
            <span className={amount}>
              {t("price.amount", { amount: Math.round(yearly / 12) })}
            </span>
            <span className={unit}>{t("price.unit")}</span>
          </p>
          <p className={note}>{t("price.yearlyNote", { amount: yearly })}</p>
        </div>
      )}
    </div>
  );
}
