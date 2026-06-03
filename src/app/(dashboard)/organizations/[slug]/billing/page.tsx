import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ChevronLeft, CreditCard, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  PLAN_ORDER,
  PLANS,
  type FeatureCode,
  type LimitCode,
  type PlanCode,
} from "@/lib/billing/plans";
import { getOrgSubscription } from "@/lib/billing/server";
import { getOrgUsageSnapshot } from "@/lib/billing/usage";
import { isStripeReady } from "@/lib/billing/stripe";
import { openCustomerPortal, startCheckout } from "./actions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const t = await getTranslations("organizations.billing");
  const { slug } = await params;
  return { title: t("metaTitle", { slug }) };
}

const LIMIT_CODES: ReadonlyArray<LimitCode> = [
  "max_members",
  "max_clients",
  "max_active_audits",
  "max_audits_per_month",
];

export default async function BillingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ checkout?: string }>;
}) {
  await requireProfile();
  const { slug } = await params;
  const { checkout } = await searchParams;
  const t = await getTranslations("organizations.billing");
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, slug, name")
    .eq("slug", slug)
    .maybeSingle();
  if (!org) notFound();

  // Le user doit être owner ou admin de l'org. Pas membre = on remonte 404
  // pour ne pas révéler l'existence de l'org.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", org.id)
    .eq("user_id", user?.id ?? "")
    .maybeSingle();
  if (!membership) notFound();
  const canManage =
    membership.role === "owner" || membership.role === "admin";

  const subscription = await getOrgSubscription(org.id);
  const currentPlan: PlanCode = subscription?.planCode ?? "free";
  const currentPlanDescriptor = PLANS[currentPlan];
  const stripeReady = isStripeReady();
  const usage = await getOrgUsageSnapshot(org.id);
  const USAGE_BY_LIMIT: Record<LimitCode, number> = {
    max_members: usage.members,
    max_clients: usage.clients,
    max_active_audits: usage.activeAudits,
    max_audits_per_month: usage.auditsThisMonth,
  };
  const intervalLocale = "fr-FR";
  const dateFmt = new Intl.DateTimeFormat(intervalLocale, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const renewDate = subscription?.currentPeriodEnd
    ? dateFmt.format(new Date(subscription.currentPeriodEnd))
    : null;

  return (
    <div className="container mx-auto max-w-5xl space-y-6 p-6 md:p-8">
      <Button asChild variant="ghost" size="sm" className="gap-1 -ml-3">
        <Link href={`/organizations/${org.slug}`}>
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {t("back")}
        </Link>
      </Button>

      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      {checkout === "success" && (
        <div
          role="status"
          className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
        >
          {t("checkoutSuccess")}
        </div>
      )}
      {checkout === "cancel" && (
        <div
          role="status"
          className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
        >
          {t("checkoutCancel")}
        </div>
      )}

      {!canManage && (
        <div
          role="alert"
          className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
        >
          {t("forbidden")}
        </div>
      )}

      {/* Plan actuel */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1">
            <CardDescription>{t("currentPlan")}</CardDescription>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
              {currentPlanDescriptor.name}
            </CardTitle>
            <CardDescription>{currentPlanDescriptor.description}</CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2 text-right text-xs text-muted-foreground">
            <Badge variant={subscription?.status === "active" ? "default" : "secondary"}>
              {t("status.label")} ·{" "}
              {t(
                `status.${(subscription?.status ?? "active") as "active" | "trialing" | "past_due" | "canceled" | "incomplete" | "incomplete_expired" | "unpaid" | "paused"}`,
              )}
            </Badge>
            {subscription?.billingInterval && (
              <span>{t(`interval.${subscription.billingInterval}`)}</span>
            )}
            {renewDate && (
              <span>
                {subscription?.cancelAtPeriodEnd
                  ? t("endsOn", { date: renewDate })
                  : t("renewsOn", { date: renewDate })}
              </span>
            )}
            {subscription?.cancelAtPeriodEnd && (
              <span className="text-amber-600 dark:text-amber-400">
                {t("cancelScheduled")}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <div className="text-sm text-muted-foreground">
            {stripeReady ? (
              subscription?.stripeCustomerId ? null : (
                <span>{t("downgradeNote")}</span>
              )
            ) : (
              <span>{t("stripeUnavailable")}</span>
            )}
          </div>
          {canManage && stripeReady && subscription?.stripeCustomerId && (
            <form
              action={async () => {
                "use server";
                await openCustomerPortal(org.id);
              }}
            >
              <Button type="submit" variant="outline" size="sm" className="gap-2">
                <CreditCard className="h-4 w-4" aria-hidden="true" />
                {t("manage")}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Limites + usage actuel */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">{t("limitsTitle")}</h2>
        <Card>
          <CardContent className="grid gap-4 p-4 md:grid-cols-3">
            {LIMIT_CODES.map((code) => {
              const limit = currentPlanDescriptor.limits[code];
              const used = USAGE_BY_LIMIT[code] ?? 0;
              const isUnlimited = limit === null;
              const ratio = !isUnlimited && limit > 0 ? used / limit : 0;
              const isWarning = !isUnlimited && ratio >= 0.8 && ratio < 1;
              const isExceeded = !isUnlimited && ratio >= 1;
              return (
                <div
                  key={code}
                  className="rounded-md border bg-card p-3 text-sm"
                >
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {t(`limits.${code}`)}
                  </p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">
                    <span
                      className={cn(
                        isExceeded && "text-destructive",
                        isWarning && "text-amber-600 dark:text-amber-400",
                      )}
                    >
                      {used}
                    </span>
                    <span className="mx-1 text-muted-foreground">/</span>
                    <span className="text-muted-foreground">
                      {isUnlimited ? t("unlimited") : limit}
                    </span>
                  </p>
                  {!isUnlimited && (
                    <div
                      className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={limit}
                      aria-valuenow={used}
                      aria-label={t(`limits.${code}`)}
                    >
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          isExceeded
                            ? "bg-destructive"
                            : isWarning
                              ? "bg-amber-500"
                              : "bg-primary",
                        )}
                        style={{
                          width: `${Math.min(100, Math.round(ratio * 100))}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>

      {/* Comparaison de plans */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">{t("compareTitle")}</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {PLAN_ORDER.map((code) => (
            <PlanCard
              key={code}
              code={code}
              isCurrent={code === currentPlan}
              canManage={canManage && stripeReady}
              organizationId={org.id}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

async function PlanCard({
  code,
  isCurrent,
  canManage,
  organizationId,
}: {
  code: PlanCode;
  isCurrent: boolean;
  canManage: boolean;
  organizationId: string;
}) {
  const t = await getTranslations("organizations.billing");
  const plan = PLANS[code];

  const featureKey = (f: FeatureCode): string => f.replace(".", "_");

  return (
    <Card
      className={cn(
        "flex flex-col",
        isCurrent && "ring-2 ring-primary/40",
      )}
    >
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg">{plan.name}</CardTitle>
          {isCurrent && (
            <Badge variant="default" className="text-[10px]">
              {t("currentBadge")}
            </Badge>
          )}
        </div>
        <CardDescription className="min-h-[2.5em]">
          {plan.description}
        </CardDescription>
        <div className="pt-2">
          {plan.isContactSales ? (
            <p className="text-xl font-semibold tracking-tight">
              {t("contactSales")}
            </p>
          ) : (
            <p className="text-xl font-semibold tracking-tight tabular-nums">
              {plan.monthlyPriceEur === 0
                ? "0 €"
                : `${plan.monthlyPriceEur} €`}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                {t("perMonth")}
              </span>
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("featuresIncluded")}
          </p>
          {plan.features.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t("noFeatures")}</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500"
                    aria-hidden="true"
                  />
                  <span>{t(`features.${featureKey(feature)}`)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {!isCurrent && !plan.isContactSales && code !== "free" && canManage && (
          <div className="mt-auto flex flex-col gap-2 border-t pt-3">
            <form
              action={async () => {
                "use server";
                await startCheckout(
                  organizationId,
                  code as Exclude<PlanCode, "free" | "enterprise">,
                  "monthly",
                );
              }}
            >
              <Button type="submit" variant="default" size="sm" className="w-full">
                {t("selectMonthly")}
              </Button>
            </form>
            <form
              action={async () => {
                "use server";
                await startCheckout(
                  organizationId,
                  code as Exclude<PlanCode, "free" | "enterprise">,
                  "yearly",
                );
              }}
            >
              <Button type="submit" variant="outline" size="sm" className="w-full">
                {t("selectYearly")}
              </Button>
            </form>
          </div>
        )}
        {plan.isContactSales && !isCurrent && (
          <div className="mt-auto border-t pt-3">
            <Button asChild variant="outline" size="sm" className="w-full">
              <a href="mailto:contact@axessio.app">{t("contactSales")}</a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export const dynamic = "force-dynamic";
