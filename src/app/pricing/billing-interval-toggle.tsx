"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
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
}

export function BillingIntervalToggle({ yearlySavingsPercent }: Props) {
  const t = useTranslations("pricing");
  const tFeatures = useTranslations("organizations.billing.features");
  const [interval, setInterval] = useState<"monthly" | "yearly">("yearly");

  return (
    <div className="space-y-8">
      {/* Toggle mensuel/annuel */}
      <div className="flex justify-center">
        <div
          role="tablist"
          aria-label={t("toggleAria")}
          className="inline-flex items-center gap-1 rounded-full border bg-card p-1 shadow-sm"
        >
          {(["monthly", "yearly"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={interval === value}
              onClick={() => setInterval(value)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                interval === value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(`interval.${value}`)}
              {value === "yearly" && yearlySavingsPercent !== null && (
                <span
                  className={cn(
                    "ml-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    interval === value
                      ? "bg-primary-foreground/20"
                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200",
                  )}
                >
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  {t("savingsBadge", { percent: yearlySavingsPercent })}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Grille des plans */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {PLAN_ORDER.map((code) => {
          const plan = PLANS[code];
          const isHighlighted = code === "pro"; // plan "recommandé"
          return (
            <article
              key={code}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-card p-6 shadow-sm transition-all",
                isHighlighted &&
                  "border-primary shadow-md ring-2 ring-primary/40",
              )}
            >
              {isHighlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                  {t("recommendedBadge")}
                </span>
              )}

              <header className="space-y-1">
                <h2 className="text-xl font-bold tracking-tight">
                  {plan.name}
                </h2>
                <p className="min-h-[2.75em] text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </header>

              <div className="my-6">
                <PriceDisplay
                  code={code}
                  interval={interval}
                  monthlyPrice={plan.monthlyPriceEur}
                  yearlyPrice={plan.yearlyPriceEur}
                  isContactSales={plan.isContactSales}
                />
              </div>

              <PlanCta code={code} />

              <ul className="mt-6 space-y-2.5 border-t pt-4 text-sm">
                <FeatureItem
                  text={t("limits.members", {
                    count: plan.limits.max_members ?? 0,
                    unlimited: plan.limits.max_members === null ? "true" : "false",
                  })}
                />
                <FeatureItem
                  text={t("limits.clients", {
                    count: plan.limits.max_clients ?? 0,
                    unlimited:
                      plan.limits.max_clients === null ? "true" : "false",
                  })}
                />
                <FeatureItem
                  text={t("limits.audits", {
                    count: plan.limits.max_active_audits ?? 0,
                    unlimited:
                      plan.limits.max_active_audits === null ? "true" : "false",
                  })}
                />
                {plan.features.length === 0 ? (
                  <li className="text-xs text-muted-foreground">
                    {t("noExtraFeatures")}
                  </li>
                ) : (
                  plan.features.map((feature) => (
                    <FeatureItem
                      key={feature}
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

function FeatureItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2">
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0z"
          clipRule="evenodd"
        />
      </svg>
      <span>{text}</span>
    </li>
  );
}

function PriceDisplay({
  code,
  interval,
  monthlyPrice,
  yearlyPrice,
  isContactSales,
}: {
  code: PlanCode;
  interval: "monthly" | "yearly";
  monthlyPrice: number | null;
  yearlyPrice: number | null;
  isContactSales: boolean;
}) {
  const t = useTranslations("pricing");

  if (isContactSales) {
    return (
      <div>
        <p className="text-3xl font-bold tracking-tight">
          {t("contactSales")}
        </p>
        <p className="text-xs text-muted-foreground">{t("contactSalesNote")}</p>
      </div>
    );
  }

  if (code === "free" || monthlyPrice === 0) {
    return (
      <div>
        <p className="text-4xl font-bold tracking-tight tabular-nums">
          0 <span className="text-base font-normal text-muted-foreground">€</span>
        </p>
        <p className="text-xs text-muted-foreground">{t("forever")}</p>
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
      <p className="text-4xl font-bold tracking-tight tabular-nums">
        {Math.round(displayed)}
        <span className="ml-1 text-base font-normal text-muted-foreground">
          € {t("perMonth")}
        </span>
      </p>
      <p className="text-xs text-muted-foreground">
        {interval === "monthly"
          ? t("billedMonthly")
          : t("billedYearly", { yearly })}
      </p>
    </div>
  );
}

function PlanCta({ code }: { code: PlanCode }) {
  const t = useTranslations("pricing");
  if (code === "free") {
    return (
      <a
        href="/login"
        className="inline-flex h-10 w-full items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {t("cta.startFree")}
      </a>
    );
  }
  if (code === "enterprise") {
    return (
      <a
        href="mailto:contact@axessyo.com?subject=Demande%20Enterprise"
        className="inline-flex h-10 w-full items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {t("cta.contactSales")}
      </a>
    );
  }
  // Plan payant : on redirige vers la connexion en conservant l'intention
  // (le plan choisi) pour ramener l'utilisateur vers la sélection d'org
  // où finaliser l'abonnement après connexion.
  return (
    <a
      href={`/login?next=${encodeURIComponent(`/organizations?plan=${code}`)}`}
      className={cn(
        "inline-flex h-10 w-full items-center justify-center rounded-md px-4 text-sm font-medium shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        code === "pro"
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "border border-input bg-background hover:bg-accent hover:text-foreground",
      )}
    >
      {t("cta.choosePlan")}
    </a>
  );
}
