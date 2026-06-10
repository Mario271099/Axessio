"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertCircle, Check, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  PLAN_ORDER,
  PLANS,
  type FeatureCode,
  type PlanCode,
} from "@/lib/billing/plans";
import { startCheckout } from "@/app/(dashboard)/organizations/[slug]/billing/actions";

interface Props {
  organizationId: string;
  currentPlan: PlanCode;
  stripeReady: boolean;
  yearlySavingsPercent: number | null;
}

type BillingInterval = "monthly" | "yearly";

export function OnboardingPlanSelector({
  organizationId,
  currentPlan,
  stripeReady,
  yearlySavingsPercent,
}: Props) {
  const t = useTranslations("onboarding");
  const tPricing = useTranslations("pricing");
  const tFeatures = useTranslations("organizations.billing.features");
  const router = useRouter();

  const [interval, setInterval] = useState<BillingInterval>("yearly");
  const [pendingPlan, setPendingPlan] = useState<PlanCode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startCheckoutTransition] = useTransition();

  function handleChoosePaid(code: Exclude<PlanCode, "free" | "enterprise">) {
    setError(null);
    setPendingPlan(code);
    startCheckoutTransition(async () => {
      // startCheckout redirige vers Stripe en cas de succès (le router suit le
      // redirect). En cas d'échec, il renvoie un objet { error }.
      const result = await startCheckout(organizationId, code, interval);
      if (result?.error) {
        setError(result.error);
        setPendingPlan(null);
      }
    });
  }

  return (
    <div className="container mx-auto max-w-6xl px-6 py-12 sm:py-16">
      <header className="mx-auto max-w-2xl space-y-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          {t("kicker")}
        </p>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          {t("title")}
        </h1>
        <p className="text-base text-muted-foreground">{t("subtitle")}</p>
      </header>

      {error && (
        <p
          role="alert"
          className="mx-auto mt-8 inline-flex max-w-xl items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}

      {!stripeReady && (
        <p
          role="status"
          className="mx-auto mt-8 max-w-xl rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
        >
          {t("stripeUnavailable")}
        </p>
      )}

      {/* Toggle mensuel/annuel */}
      <div className="mt-10 flex justify-center">
        <div
          role="tablist"
          aria-label={tPricing("toggleAria")}
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
              {tPricing(`interval.${value}`)}
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
                  {tPricing("savingsBadge", { percent: yearlySavingsPercent })}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Grille des plans */}
      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {PLAN_ORDER.map((code) => {
          const plan = PLANS[code];
          const isHighlighted = code === "pro";
          const isCurrent = code === currentPlan;
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
                  {tPricing("recommendedBadge")}
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

              <PlanCta
                code={code}
                isCurrent={isCurrent}
                stripeReady={stripeReady}
                pending={pendingPlan === code}
                anyPending={pendingPlan !== null}
                onChoose={handleChoosePaid}
                onContinueFree={() => router.push("/dashboard")}
              />

              <ul className="mt-6 space-y-2.5 border-t pt-4 text-sm">
                <FeatureItem
                  text={tPricing("limits.members", {
                    count: plan.limits.max_members ?? 0,
                    unlimited:
                      plan.limits.max_members === null ? "true" : "false",
                  })}
                />
                <FeatureItem
                  text={tPricing("limits.clients", {
                    count: plan.limits.max_clients ?? 0,
                    unlimited:
                      plan.limits.max_clients === null ? "true" : "false",
                  })}
                />
                <FeatureItem
                  text={tPricing("limits.audits", {
                    count: plan.limits.max_active_audits ?? 0,
                    unlimited:
                      plan.limits.max_active_audits === null
                        ? "true"
                        : "false",
                  })}
                />
                {plan.features.length === 0 ? (
                  <li className="text-xs text-muted-foreground">
                    {tPricing("noExtraFeatures")}
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

      {/* Skip — l'étape ne doit jamais bloquer l'accès au produit */}
      <div className="mt-10 text-center">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard")}
          disabled={pendingPlan !== null}
        >
          {t("skip")}
        </Button>
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
      <Check
        className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
        aria-hidden="true"
      />
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
  interval: BillingInterval;
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
          0{" "}
          <span className="text-base font-normal text-muted-foreground">€</span>
        </p>
        <p className="text-xs text-muted-foreground">{t("forever")}</p>
      </div>
    );
  }

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

function PlanCta({
  code,
  isCurrent,
  stripeReady,
  pending,
  anyPending,
  onChoose,
  onContinueFree,
}: {
  code: PlanCode;
  isCurrent: boolean;
  stripeReady: boolean;
  pending: boolean;
  anyPending: boolean;
  onChoose: (code: Exclude<PlanCode, "free" | "enterprise">) => void;
  onContinueFree: () => void;
}) {
  const t = useTranslations("onboarding");

  if (code === "free") {
    return (
      <Button
        variant="outline"
        className="w-full"
        onClick={onContinueFree}
        disabled={anyPending}
      >
        {t("continueFree")}
      </Button>
    );
  }

  if (code === "enterprise") {
    return (
      <Button asChild variant="outline" className="w-full">
        <a href="mailto:contact@axessyo.com?subject=Demande%20Enterprise">
          {t("contactSales")}
        </a>
      </Button>
    );
  }

  // Plan payant (Starter / Pro). Désactivé tant que Stripe n'est pas configuré.
  const paidCode = code as Exclude<PlanCode, "free" | "enterprise">;
  return (
    <Button
      variant={code === "pro" ? "default" : "outline"}
      className="w-full"
      onClick={() => onChoose(paidCode)}
      disabled={isCurrent || !stripeReady || anyPending}
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          {t("redirecting")}
        </>
      ) : isCurrent ? (
        t("currentPlan")
      ) : (
        t("choose")
      )}
    </Button>
  );
}
