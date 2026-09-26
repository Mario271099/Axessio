"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PLAN_ORDER,
  PLANS,
  type FeatureCode,
  type PlanCode,
} from "@/lib/billing/plans";

interface Props {
  /**
   * Pourcentage d'économie sur l'annuel par rapport au mensuel × 12.
   * Calculé côté serveur et passé en prop pour rester en sync avec les prix.
   */
  yearlySavingsPercent: number | null;
  /**
   * Session active détectée côté serveur. Détermine la cible des CTA :
   * un visiteur connecté va droit au choix de plan (checkout), un prospect
   * passe par l'inscription en conservant le plan choisi.
   */
  isAuthenticated: boolean;
}

export function BillingIntervalToggle({
  yearlySavingsPercent,
  isAuthenticated,
}: Props) {
  const t = useTranslations("pricing");
  const tFeatures = useTranslations("organizations.billing.features");
  const [interval, setInterval] = useState<"monthly" | "yearly">("yearly");

  return (
    <div className="flex flex-col gap-9">
      {/* Bascule mensuel / annuel */}
      <div className="flex justify-center">
        <div
          role="tablist"
          aria-label={t("toggleAria")}
          className="inline-flex items-center gap-1 rounded-[14px] bg-secondary p-1"
        >
          {(["monthly", "yearly"] as const).map((value) => {
            const isActive = interval === value;
            return (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setInterval(value)}
                className={cn(
                  "inline-flex h-10 items-center gap-2 rounded-lg px-4.5 text-[0.9rem] font-extrabold",
                  "transition-colors duration-150",
                  isActive
                    ? "bg-card text-primary shadow-sm"
                    : "text-secondary-foreground hover:text-foreground",
                )}
              >
                {t(`interval.${value}`)}
                {value === "yearly" && yearlySavingsPercent !== null && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-extrabold",
                      isActive
                        ? "bg-primary-muted text-primary"
                        : "bg-success/12 text-success",
                    )}
                  >
                    <Sparkles className="size-3" aria-hidden="true" />
                    {t("savingsBadge", { percent: yearlySavingsPercent })}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grille des plans */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {PLAN_ORDER.map((code) => {
          const plan = PLANS[code];
          // Plan « recommandé » : carte encre, comme dans les maquettes.
          const isHighlighted = code === "pro";
          return (
            <article
              key={code}
              className={cn(
                "axs-lift relative flex flex-col gap-3.5 rounded-hero border p-6",
                isHighlighted
                  ? "border-ink bg-ink text-ink-foreground"
                  : "border-border bg-card",
              )}
            >
              <header className="flex items-start justify-between gap-3">
                <h2 className="text-[1.375rem] font-black tracking-tight">
                  {plan.name}
                </h2>
                {isHighlighted && (
                  <span className="shrink-0 rounded-full bg-highlight px-3 py-1 text-xs font-extrabold text-ink">
                    {t("recommendedBadge")}
                  </span>
                )}
              </header>

              <p
                className={cn(
                  "min-h-[2.75em] text-sm",
                  isHighlighted ? "text-ink-muted" : "text-muted-foreground",
                )}
              >
                {plan.description}
              </p>

              <PriceDisplay
                code={code}
                interval={interval}
                monthlyPrice={plan.monthlyPriceEur}
                yearlyPrice={plan.yearlyPriceEur}
                isContactSales={plan.isContactSales}
                onInk={isHighlighted}
              />

              <PlanCta
                code={code}
                isAuthenticated={isAuthenticated}
                onInk={isHighlighted}
              />

              <ul className="mt-1.5 flex flex-col gap-2.5 text-[0.9rem]">
                <FeatureItem
                  onInk={isHighlighted}
                  text={t("limits.members", {
                    count: plan.limits.max_members ?? 0,
                    unlimited:
                      plan.limits.max_members === null ? "true" : "false",
                  })}
                />
                <FeatureItem
                  onInk={isHighlighted}
                  text={t("limits.clients", {
                    count: plan.limits.max_clients ?? 0,
                    unlimited:
                      plan.limits.max_clients === null ? "true" : "false",
                  })}
                />
                <FeatureItem
                  onInk={isHighlighted}
                  text={t("limits.audits", {
                    count: plan.limits.max_active_audits ?? 0,
                    unlimited:
                      plan.limits.max_active_audits === null ? "true" : "false",
                  })}
                />
                {plan.features.length === 0 ? (
                  <li
                    className={cn(
                      "text-sm",
                      isHighlighted
                        ? "text-ink-muted"
                        : "text-muted-foreground",
                    )}
                  >
                    {t("noExtraFeatures")}
                  </li>
                ) : (
                  plan.features.map((feature) => (
                    <FeatureItem
                      key={feature}
                      onInk={isHighlighted}
                      text={tFeatures(featureKey(feature))}
                    />
                  ))
                )}
              </ul>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function featureKey(f: FeatureCode): string {
  return f.replace(".", "_");
}

function FeatureItem({ text, onInk }: { text: string; onInk: boolean }) {
  return (
    <li className="flex items-start gap-2.5">
      <Check
        aria-hidden="true"
        strokeWidth={3}
        className={cn(
          "mt-0.5 size-4 shrink-0",
          onInk ? "text-ink-positive" : "text-success",
        )}
      />
      <span className="leading-snug">{text}</span>
    </li>
  );
}

function PriceDisplay({
  code,
  interval,
  monthlyPrice,
  yearlyPrice,
  isContactSales,
  onInk,
}: {
  code: PlanCode;
  interval: "monthly" | "yearly";
  monthlyPrice: number | null;
  yearlyPrice: number | null;
  isContactSales: boolean;
  onInk: boolean;
}) {
  const t = useTranslations("pricing");
  const muted = onInk ? "text-ink-muted" : "text-muted-foreground";

  if (isContactSales) {
    return (
      <div>
        <p className="text-[1.75rem] font-black tracking-tight">
          {t("contactSales")}
        </p>
        <p className={cn("text-sm", muted)}>{t("contactSalesNote")}</p>
      </div>
    );
  }

  if (code === "free" || monthlyPrice === 0) {
    return (
      <div>
        <p className="text-[2.5rem] font-black leading-none tabular tracking-tight">
          0 <span className={cn("text-base font-semibold", muted)}>€</span>
        </p>
        <p className={cn("mt-1.5 text-sm", muted)}>{t("forever")}</p>
      </div>
    );
  }

  // Plans payants : affichage selon l'interval
  const monthly = monthlyPrice ?? 0;
  const yearly = yearlyPrice ?? 0;
  const displayed =
    interval === "monthly" ? monthly : Math.round((yearly / 12) * 100) / 100;

  return (
    <div>
      <p className="text-[2.5rem] font-black leading-none tabular tracking-tight">
        {Math.round(displayed)}
        <span className={cn("ml-1 text-base font-semibold", muted)}>
          € {t("perMonth")}
        </span>
      </p>
      <p className={cn("mt-1.5 text-sm", muted)}>
        {interval === "monthly"
          ? t("billedMonthly")
          : t("billedYearly", { yearly })}
      </p>
    </div>
  );
}

function PlanCta({
  code,
  isAuthenticated,
  onInk,
}: {
  code: PlanCode;
  isAuthenticated: boolean;
  onInk: boolean;
}) {
  const t = useTranslations("pricing");

  const base =
    "inline-flex h-11 w-full items-center justify-center rounded-lg px-4 text-base font-bold transition-[background-color,border-color,box-shadow,transform] duration-200 active:scale-[0.97]";
  const outline =
    "border border-border-strong bg-card text-foreground hover:border-primary hover:bg-primary-softer";
  const onInkCta = "bg-card text-foreground hover:bg-ink-muted";

  if (code === "free") {
    // Gratuit : un visiteur connecté file au dashboard, un prospect s'inscrit.
    return (
      <a
        href={isAuthenticated ? "/dashboard" : "/register"}
        className={cn(base, outline)}
      >
        {t("cta.startFree")}
      </a>
    );
  }
  if (code === "enterprise") {
    return (
      <a
        href="mailto:contact@axessyo.com?subject=Demande%20Enterprise"
        className={cn(base, outline)}
      >
        {t("cta.contactSales")}
      </a>
    );
  }
  // Plan payant : on conserve l'intention (le plan choisi) à travers l'auth.
  //  - connecté → page de choix de plan, qui pré-sélectionne le plan et lance
  //    le checkout Stripe ;
  //  - prospect → inscription en portant le plan, l'onboarding reprend ensuite.
  const href = isAuthenticated
    ? `/onboarding/plan?plan=${code}`
    : `/register?plan=${code}`;
  return (
    <a
      href={href}
      className={cn(
        base,
        onInk
          ? onInkCta
          : "bg-primary text-primary-foreground shadow-btn hover:bg-primary-hover hover:shadow-btn-hover",
      )}
    >
      {t("cta.choosePlan")}
    </a>
  );
}
