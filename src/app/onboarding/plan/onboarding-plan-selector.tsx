"use client";

import { useEffect, useRef, useState, useTransition } from "react";
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
  /**
   * Plan choisi sur la page Tarifs et porté jusqu'ici via `?plan=`. On met sa
   * carte en avant (badge + anneau + scroll) pour reprendre l'intention d'achat.
   */
  preselectedPlan: PlanCode | null;
}

type BillingInterval = "monthly" | "yearly";

export function OnboardingPlanSelector({
  organizationId,
  currentPlan,
  stripeReady,
  yearlySavingsPercent,
  preselectedPlan,
}: Props) {
  const t = useTranslations("onboarding");
  const tPricing = useTranslations("pricing");
  const tFeatures = useTranslations("organizations.billing.features");
  const router = useRouter();

  const [interval, setInterval] = useState<BillingInterval>("yearly");
  const [pendingPlan, setPendingPlan] = useState<PlanCode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startCheckoutTransition] = useTransition();

  // Carte du plan pré-sélectionné : on l'amène dans le viewport au montage pour
  // que l'utilisateur retrouve immédiatement le plan choisi sur la page Tarifs.
  const preselectedRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (preselectedPlan && preselectedRef.current) {
      preselectedRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [preselectedPlan]);

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
        <h1 className="text-[2rem] font-black leading-[1.08] tracking-[-0.035em] md:text-[2.5rem]">
          {t("title")}
        </h1>
        <p className="mt-2 text-[1.05rem] text-muted-foreground">
          {t("subtitle")}
        </p>
      </header>

      {error && (
        <p
          role="alert"
          className="mx-auto mt-8 flex max-w-xl items-start gap-2.5 rounded-row bg-severity-critical-bg px-3.5 py-3 text-[0.95rem] leading-snug text-severity-critical"
        >
          <AlertCircle className="mt-0.5 size-[18px] shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}

      {!stripeReady && (
        <p
          role="status"
          className="mx-auto mt-8 max-w-xl rounded-row bg-warning/10 px-4 py-3 text-center text-[0.95rem] font-semibold text-warning"
        >
          {t("stripeUnavailable")}
        </p>
      )}

      {/* Toggle mensuel/annuel */}
      <div className="mt-10 flex justify-center">
        <div
          role="tablist"
          aria-label={tPricing("toggleAria")}
          className="inline-flex items-center gap-1 rounded-[14px] bg-secondary p-1"
        >
          {(["monthly", "yearly"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={interval === value}
              onClick={() => setInterval(value)}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-lg px-4.5 text-[0.9rem] font-extrabold",
                "transition-colors duration-150",
                interval === value
                  ? "bg-card text-primary shadow-sm"
                  : "text-secondary-foreground hover:text-foreground",
              )}
            >
              {tPricing(`interval.${value}`)}
              {value === "yearly" && yearlySavingsPercent !== null && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-extrabold",
                    interval === value
                      ? "bg-primary-muted text-primary"
                      : "bg-success/12 text-success",
                  )}
                >
                  <Sparkles className="size-3" aria-hidden="true" />
                  {tPricing("savingsBadge", { percent: yearlySavingsPercent })}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Grille des plans */}
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {PLAN_ORDER.map((code) => {
          const plan = PLANS[code];
          const isPreselected = code === preselectedPlan;
          // Le plan choisi sur la page Tarifs prime sur le "recommandé" par
          // défaut pour la mise en avant visuelle.
          const isHighlighted = isPreselected || (!preselectedPlan && code === "pro");
          const isCurrent = code === currentPlan;
          return (
            <article
              key={code}
              ref={isPreselected ? preselectedRef : undefined}
              className={cn(
                "axs-lift relative flex flex-col rounded-hero border p-6",
                isHighlighted
                  ? "border-ink bg-ink text-ink-foreground"
                  : "border-border bg-card",
                isPreselected &&
                  "shadow-[0_0_0_4px_hsl(var(--primary-muted))]",
              )}
            >
              {isPreselected ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-extrabold text-primary-foreground">
                  {t("preselectedBadge")}
                </span>
              ) : (
                code === "pro" && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-highlight px-3 py-1 text-xs font-extrabold text-ink">
                    {tPricing("recommendedBadge")}
                  </span>
                )
              )}

              <header className="flex flex-col gap-1">
                <h2 className="text-[1.375rem] font-black tracking-tight">
                  {plan.name}
                </h2>
                <p
                  className={cn(
                    "min-h-[2.75em] text-sm",
                    isHighlighted ? "text-ink-muted" : "text-muted-foreground",
                  )}
                >
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
                  onInk={isHighlighted}
                />
              </div>

              <PlanCta
                code={code}
                isCurrent={isCurrent}
                stripeReady={stripeReady}
                pending={pendingPlan === code}
                anyPending={pendingPlan !== null}
                emphasize={isHighlighted}
                onChoose={handleChoosePaid}
                onContinueFree={() => router.push("/dashboard")}
              />

              <ul
                className={cn(
                  "mt-6 flex flex-col gap-2.5 border-t pt-4 text-sm",
                  isHighlighted ? "border-ink-raised" : "border-border",
                )}
              >
                <FeatureItem
                  onInk={isHighlighted}
                  text={tPricing("limits.members", {
                    count: plan.limits.max_members ?? 0,
                    unlimited:
                      plan.limits.max_members === null ? "true" : "false",
                  })}
                />
                <FeatureItem
                  onInk={isHighlighted}
                  text={tPricing("limits.clients", {
                    count: plan.limits.max_clients ?? 0,
                    unlimited:
                      plan.limits.max_clients === null ? "true" : "false",
                  })}
                />
                <FeatureItem
                  onInk={isHighlighted}
                  text={tPricing("limits.audits", {
                    count: plan.limits.max_active_audits ?? 0,
                    unlimited:
                      plan.limits.max_active_audits === null
                        ? "true"
                        : "false",
                  })}
                />
                {plan.features.length === 0 ? (
                  <li
                    className={cn(
                      "text-sm",
                      isHighlighted ? "text-ink-muted" : "text-muted-foreground",
                    )}
                  >
                    {tPricing("noExtraFeatures")}
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

      {/* Skip - l'étape ne doit jamais bloquer l'accès au produit */}
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
  interval: BillingInterval;
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
  isCurrent,
  stripeReady,
  pending,
  anyPending,
  emphasize,
  onChoose,
  onContinueFree,
}: {
  code: PlanCode;
  isCurrent: boolean;
  stripeReady: boolean;
  pending: boolean;
  anyPending: boolean;
  emphasize: boolean;
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
      variant={emphasize ? "secondary" : "outline"}
      className="w-full"
      onClick={() => onChoose(paidCode)}
      disabled={isCurrent || !stripeReady || anyPending}
    >
      {pending ? (
        <>
          <Loader2 className="animate-spin" aria-hidden="true" />
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
