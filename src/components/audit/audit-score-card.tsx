import { Fragment } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/card";
import { ScoreRing } from "@/components/ui/score-ring";
import { getConformityLevel } from "@/lib/score";
import { cn } from "@/lib/utils";

interface AuditScoreCardProps {
  /** Score de conformité 0-100. */
  score: number;
  /** Critères évalués dans la matrice / total attendu. */
  matrixFilled: number;
  matrixTotal: number;
  /** Non-conformités ouvertes, dont critiques. */
  openNcCount: number;
  criticalNcCount: number;
  /** Nombre de pages de l'échantillon. */
  sampleCount: number;
  /** Lien vers le simulateur de remédiation (masqué si absent). */
  simulatorHref?: string;
}

const VERDICT_KEY = {
  "non-compliant": "nonCompliant",
  partial: "partial",
  full: "full",
} as const;

/**
 * Carte « taux de conformité » de la vue d'ensemble : l'anneau officiel, le
 * verdict, puis les compteurs qui expliquent le chiffre (critères évalués,
 * non-conformités ouvertes, pages auditées).
 */
export async function AuditScoreCard({
  score,
  matrixFilled,
  matrixTotal,
  openNcCount,
  criticalNcCount,
  sampleCount,
  simulatorHref,
}: AuditScoreCardProps) {
  const t = await getTranslations("audits.detail");
  const tKpi = await getTranslations("audits.kpiBar");
  const tConformity = await getTranslations("constants.conformityLevel");
  const level = getConformityLevel(score);

  const rows: Array<{ label: string; value: string; className?: string }> = [
    {
      label: tKpi("criteriaEvaluated"),
      value: matrixTotal > 0 ? `${matrixFilled} / ${matrixTotal}` : "—",
    },
    {
      label: tKpi("openNc"),
      value: String(openNcCount),
      className: openNcCount > 0 ? "text-warning-text" : "text-success-text",
    },
    {
      label: tKpi("criticalNc"),
      value: String(criticalNcCount),
      className: criticalNcCount > 0 ? "text-destructive" : "text-success-text",
    },
    { label: tKpi("sample"), value: String(sampleCount) },
  ];

  return (
    <Card className="flex flex-col gap-4 p-5">
      <h2 className="text-lg font-extrabold">{t("conformityRate")}</h2>

      <div className="flex flex-wrap items-center gap-5">
        <ScoreRing
          value={score}
          size={120}
          ariaLabel={t("conformityAria", { score: Math.round(score) })}
        />
        <dl className="grid min-w-0 flex-1 grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 text-sm">
          {rows.map((row) => (
            <Fragment key={row.label}>
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd
                className={cn(
                  "m-0 text-right font-extrabold tabular",
                  row.className,
                )}
              >
                {row.value}
              </dd>
            </Fragment>
          ))}
          <dt className="border-t border-border pt-1.5 text-muted-foreground">
            {t("verdict")}
          </dt>
          <dd
            className={cn(
              "m-0 border-t border-border pt-1.5 text-right font-extrabold",
              level === "non-compliant" && "text-score-non-compliant",
              level === "partial" && "text-score-partial",
              level === "full" && "text-score-compliant",
            )}
          >
            {tConformity(VERDICT_KEY[level])}
          </dd>
        </dl>
      </div>

      {simulatorHref && (
        <Link
          href={simulatorHref}
          className="axs-btn group flex items-center justify-between gap-3 rounded-row bg-primary-softer px-4 py-3 text-sm font-bold transition-colors duration-150 hover:bg-primary-soft"
        >
          {t("openSimulator")}
          <ArrowRight
            data-anim="go"
            className="size-4 shrink-0 text-primary"
            aria-hidden="true"
          />
        </Link>
      )}
    </Card>
  );
}
