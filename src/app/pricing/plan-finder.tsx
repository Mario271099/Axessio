"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, Minus, Plus } from "lucide-react";
import {
  PLAN_ORDER,
  PLANS,
  planLimit,
  type FeatureCode,
  type PlanCode,
} from "@/lib/billing/plans";
import {
  PLAN_NEED_OPTIONS,
  recommendationReason,
  recommendPlan,
  type PlanNeedKey,
} from "@/lib/billing/recommend-plan";
import { usePricingState } from "./pricing-state";

const MIN_COUNT = 1;
const MAX_COUNT = 100;

function clamp(value: number): number {
  return Math.max(MIN_COUNT, Math.min(MAX_COUNT, value));
}

function featureKey(feature: FeatureCode): string {
  return feature.replaceAll(".", "_");
}

interface Props {
  /** Cible du bouton pour chaque plan (même logique que les cartes). */
  ctaHrefs: Readonly<Record<PlanCode, string>>;
}

/** « Quel plan pour vous ? » : volumes + besoins → plan conseillé. */
export function PlanFinder({ ctaHrefs }: Props) {
  const t = useTranslations("pricing");
  const tFeatures = useTranslations("organizations.billing.features");
  const { interval, input, setInput, needs, match } = usePricingState();
  const titleId = useId();

  const plan = PLANS[match];
  const lastPlan = PLAN_ORDER[PLAN_ORDER.length - 1];

  const limitsText = (code: PlanCode) => {
    const audits = planLimit(code, "max_active_audits");
    const members = planLimit(code, "max_members");
    return {
      audits: t("limits.audits", {
        count: audits ?? 0,
        unlimited: audits === null ? "true" : "false",
      }),
      members: t("limits.members", {
        count: members ?? 0,
        unlimited: members === null ? "true" : "false",
      }),
    };
  };

  const reason = recommendationReason(match, needs);
  const reasonText =
    reason.kind === "base"
      ? t("finder.reason.base", { plan: plan.name, ...limitsText(match) })
      : reason.kind === "feature"
        ? t("finder.reason.feature", {
            feature: tFeatures(featureKey(reason.feature)),
            plan: plan.name,
          })
        : t("finder.reason.limits", {
            previous: PLANS[reason.previous].name,
            ...limitsText(reason.previous),
          });

  let priceText: string;
  if (plan.isContactSales || plan.monthlyPriceEur === null) {
    priceText = t("finder.resultPrice.contact");
  } else if (plan.monthlyPriceEur === 0) {
    priceText = t("finder.resultPrice.free");
  } else if (interval === "yearly" && plan.yearlyPriceEur !== null) {
    priceText = t("finder.resultPrice.yearly", {
      amount: Math.round(plan.yearlyPriceEur / 12),
    });
  } else {
    priceText = t("finder.resultPrice.monthly", {
      amount: plan.monthlyPriceEur,
    });
  }

  const ctaLabel = plan.isContactSales
    ? t("cta.contactSales")
    : plan.monthlyPriceEur === 0
      ? t("cta.startFree")
      : t("finder.cta", { plan: plan.name });

  const toggleNeed = (key: PlanNeedKey) => {
    const selected = input.selected.includes(key)
      ? input.selected.filter((k) => k !== key)
      : [...input.selected, key];
    setInput({ ...input, selected });
  };

  return (
    <section
      aria-labelledby={titleId}
      className="grid overflow-hidden rounded-[1.75rem] border border-border bg-card lg:grid-cols-[minmax(0,1fr)_23.75rem]"
    >
      <div className="flex flex-col gap-6 p-6 sm:p-10">
        <div>
          <h2
            id={titleId}
            className="text-[1.75rem] font-black leading-tight tracking-[-0.035em] sm:text-[2.125rem]"
          >
            {t("finder.title")}
          </h2>
          <p className="mt-2 text-base text-secondary-foreground">
            {t("finder.subtitle")}
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Counter
            label={t("finder.audits.label")}
            decreaseLabel={t("finder.audits.decrease")}
            increaseLabel={t("finder.audits.increase")}
            value={input.activeAudits}
            onChange={(activeAudits) => setInput({ ...input, activeAudits })}
          />
          <Counter
            label={t("finder.members.label")}
            decreaseLabel={t("finder.members.decrease")}
            increaseLabel={t("finder.members.increase")}
            value={input.members}
            onChange={(members) => setInput({ ...input, members })}
          />
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2.5 text-[0.9375rem] font-extrabold">
            {t("finder.needsLegend")}
          </legend>
          {PLAN_NEED_OPTIONS.map((option) => {
            const minPlan = recommendPlan({
              activeAudits: MIN_COUNT,
              members: MIN_COUNT,
              features: option.features,
            });
            return (
              <label
                key={option.key}
                className="flex cursor-pointer items-center gap-3 rounded-[0.875rem] border border-border px-3.5 py-3 text-[0.9375rem] font-bold transition-colors duration-150 hover:border-primary hover:bg-primary-softer has-checked:border-primary has-checked:bg-primary-soft"
              >
                <input
                  type="checkbox"
                  checked={input.selected.includes(option.key)}
                  onChange={() => toggleNeed(option.key)}
                  className="size-5 shrink-0 accent-primary"
                />
                <span>
                  {t(`finder.needs.${option.key}`)}
                  <small className="block text-[0.8125rem] font-medium text-muted-foreground">
                    {t("finder.availability", {
                      plan: PLANS[minPlan].name,
                      isLast: minPlan === lastPlan ? "true" : "false",
                    })}
                  </small>
                </span>
              </label>
            );
          })}
        </fieldset>
      </div>

      <div className="bg-cobalt relative flex flex-col gap-3 overflow-hidden p-6 text-cobalt-foreground sm:p-9">
        <svg
          aria-hidden="true"
          width="260"
          height="260"
          viewBox="0 0 260 260"
          className="pointer-events-none absolute -bottom-[4.5rem] -right-[4.5rem] opacity-15"
        >
          <g fill="currentColor">
            <rect x="0" y="0" width="120" height="120" rx="30" />
            <circle cx="200" cy="60" r="60" />
            <rect x="140" y="140" width="120" height="120" rx="30" />
          </g>
        </svg>

        <div aria-live="polite" aria-atomic="true" className="relative flex flex-col gap-3">
          <p className="text-[0.9375rem] font-bold">{t("finder.resultLabel")}</p>
          <p
            key={match}
            className="fade-in-up text-[3.25rem] font-black leading-none tracking-[-0.045em]"
          >
            {plan.name}
          </p>
          <p className="text-xl font-extrabold">{priceText}</p>
          <p className="mt-1.5 max-w-[32ch] text-[0.9375rem] leading-relaxed">
            {reasonText}
          </p>
        </div>

        <a
          href={ctaHrefs[match]}
          className="group/cta relative mt-auto inline-flex h-12 items-center justify-center gap-2 rounded-row bg-card px-5 text-[0.9375rem] font-extrabold text-foreground transition-[box-shadow,transform] duration-150 hover:shadow-[0_14px_26px_-14px_rgb(0_0_0/0.7)] active:scale-[0.97]"
        >
          {ctaLabel}
          <ArrowRight
            aria-hidden="true"
            className="size-[1.0625rem] transition-transform duration-200 group-hover/cta:translate-x-1"
          />
        </a>
      </div>
    </section>
  );
}

function Counter({
  label,
  decreaseLabel,
  increaseLabel,
  value,
  onChange,
}: {
  label: string;
  decreaseLabel: string;
  increaseLabel: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const labelId = useId();
  const button =
    "flex size-11 items-center justify-center rounded-row border-[1.5px] border-border-strong bg-card text-foreground transition-[border-color,background-color,color,transform] duration-150 hover:border-primary hover:bg-primary-soft hover:text-primary active:scale-[0.92]";
  return (
    <div role="group" aria-labelledby={labelId} className="flex flex-col gap-2.5">
      <span id={labelId} className="text-[0.9375rem] font-extrabold">
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label={decreaseLabel}
          onClick={() => onChange(clamp(value - 1))}
          className={button}
        >
          <Minus aria-hidden="true" className="size-5" strokeWidth={2.6} />
        </button>
        <output
          aria-live="polite"
          className="min-w-16 text-center text-[1.75rem] font-black tabular tracking-[-0.02em]"
        >
          {value}
        </output>
        <button
          type="button"
          aria-label={increaseLabel}
          onClick={() => onChange(clamp(value + 1))}
          className={button}
        >
          <Plus aria-hidden="true" className="size-5" strokeWidth={2.6} />
        </button>
      </div>
    </div>
  );
}
