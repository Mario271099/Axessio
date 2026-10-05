import { useLocale, useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { intlLocale } from "@/lib/intl";
import { SUPPORTED_STANDARDS } from "@/lib/constants";
import {
  COMPARISON_GROUPS,
  planIncludesRow,
  type ComparisonRow,
} from "@/lib/billing/comparison";
import { PLAN_ORDER, PLANS, planLimit, type PlanCode } from "@/lib/billing/plans";
import { ONLY_MONTHLY, ONLY_YEARLY, RECOMMENDED_PLAN } from "./plan-cards";

/**
 * Tableau comparatif. Sur grand écran, l'en-tête reste collé sous l'en-tête
 * public (80 px) au défilement. Sous `lg`, le tableau défile dans son propre
 * conteneur (la page ne défile jamais horizontalement), 1re colonne collante.
 */
export function ComparisonTable() {
  const t = useTranslations("pricing");
  const locale = useLocale();
  const planNames = new Intl.ListFormat(intlLocale(locale), {
    type: "conjunction",
  }).format(PLAN_ORDER.map((code) => PLANS[code].name));
  const columnCount = PLAN_ORDER.length + 1;

  return (
    <section aria-labelledby="pricing-compare-title">
      <h2
        id="pricing-compare-title"
        className="text-[2rem] font-black leading-[1.05] tracking-[-0.04em] md:text-[2.75rem]"
      >
        {t("compare.title")}
      </h2>
      <p className="mt-3 text-[1.0625rem] text-secondary-foreground">
        {t("compare.subtitle")}
      </p>
      <p className="mt-2 text-sm text-muted-foreground lg:hidden">
        {t("compare.scrollHint")}
      </p>

      <div
        role="region"
        aria-labelledby="pricing-compare-title"
        tabIndex={0}
        className="relative mt-7.5 overflow-x-auto rounded-lg lg:overflow-visible"
      >
        <table className="w-full min-w-[46rem] border-separate border-spacing-0 text-[0.9375rem]">
          <caption className="sr-only">
            {t("compare.caption", { plans: planNames })}
          </caption>
          <thead>
            <tr>
              <th
                scope="col"
                className="sticky left-0 z-20 w-[36%] border-b-2 border-foreground bg-card px-4 py-4.5 text-left align-bottom lg:top-20"
              >
                <span className="sr-only">{t("compare.featureColumn")}</span>
              </th>
              {PLAN_ORDER.map((code) => (
                <th
                  key={code}
                  scope="col"
                  className={cn(
                    "border-b-2 border-foreground px-4 py-4.5 text-left align-bottom lg:sticky lg:top-20 lg:z-10",
                    code === RECOMMENDED_PLAN ? "bg-primary-softer" : "bg-card",
                  )}
                >
                  <span className="block text-[1.1875rem] font-black">
                    {PLANS[code].name}
                  </span>
                  <HeaderPrice code={code} />
                </th>
              ))}
            </tr>
          </thead>

          {COMPARISON_GROUPS.map((group) => (
            <tbody key={group.key}>
              <tr>
                <th
                  scope="colgroup"
                  colSpan={columnCount}
                  className="border-b border-border px-4 pb-3 pt-7.5 text-left text-[0.84rem] font-extrabold text-muted-foreground"
                >
                  <span className="sticky left-4">
                    {t(`compare.groups.${group.key}`)}
                  </span>
                </th>
              </tr>
              {group.rows.map((row) => (
                <tr key={row.key} className="group/row">
                  <th
                    scope="row"
                    className="sticky left-0 z-[1] h-13.5 border-b border-secondary bg-card px-4 text-left font-bold transition-colors duration-150 group-hover/row:bg-primary-softer"
                  >
                    {t(`compare.rows.${row.key}`, {
                      standards: SUPPORTED_STANDARDS.join(", "),
                    })}
                  </th>
                  {PLAN_ORDER.map((code) => (
                    <td
                      key={code}
                      className={cn(
                        "h-13.5 border-b border-secondary px-4 font-bold tabular transition-colors duration-150",
                        code === RECOMMENDED_PLAN
                          ? "bg-primary-softer group-hover/row:bg-primary-muted"
                          : "group-hover/row:bg-primary-softer",
                      )}
                    >
                      <Cell code={code} row={row} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </section>
  );
}

function HeaderPrice({ code }: { code: PlanCode }) {
  const t = useTranslations("pricing");
  const plan = PLANS[code];
  const className =
    "mt-0.5 block text-[0.84rem] font-semibold text-muted-foreground";

  if (plan.isContactSales || plan.monthlyPriceEur === null) {
    return <span className={className}>{t("contactSales")}</span>;
  }
  if (plan.monthlyPriceEur === 0 || plan.yearlyPriceEur === null) {
    return (
      <span className={className}>
        {plan.monthlyPriceEur === 0
          ? t("price.amount", { amount: 0 })
          : t("price.short", { amount: plan.monthlyPriceEur })}
      </span>
    );
  }
  return (
    <>
      <span className={cn(className, ONLY_MONTHLY)}>
        {t("price.short", { amount: plan.monthlyPriceEur })}
      </span>
      <span className={cn(className, ONLY_YEARLY)}>
        {t("price.short", { amount: Math.round(plan.yearlyPriceEur / 12) })}
      </span>
    </>
  );
}

function Cell({ code, row }: { code: PlanCode; row: ComparisonRow }) {
  const t = useTranslations("pricing");

  if (row.kind === "limit") {
    return <>{planLimit(code, row.limit) ?? t("unlimited")}</>;
  }

  if (planIncludesRow(code, row)) {
    return (
      <>
        <span
          aria-hidden="true"
          className="inline-flex size-7 items-center justify-center rounded-full bg-success/15 text-success-text transition-transform duration-200 ease-bounce group-hover/row:scale-110"
        >
          <Check className="size-[0.9375rem]" strokeWidth={3} />
        </span>
        <span className="sr-only">{t("compare.included")}</span>
      </>
    );
  }

  return (
    <>
      <span
        aria-hidden="true"
        className="inline-block h-0.5 w-3.5 rounded-full bg-muted-foreground align-middle"
      />
      <span className="sr-only">{t("compare.notIncluded")}</span>
    </>
  );
}
