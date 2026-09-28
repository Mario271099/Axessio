"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { ScoreRing } from "@/components/ui/score-ring";
import { cn } from "@/lib/utils";
import type { AuditPage, ConformityStatus } from "@/types/domain";

interface Props {
  pages: AuditPage[];
  conformityMap: Map<string, ConformityStatus>;
  totalCriteria: number;
  currentPageId: string;
  onPageChange: (pageId: string) => void;
  /** Score de conformité de l'audit entier. */
  auditScore: number;
  /** false quand aucune saisie n'existe encore : le score n'a pas de sens. */
  hasAnyEntry: boolean;
}

/**
 * Colonne de gauche de la matrice : l'échantillon, page par page, avec sa
 * part de critères saisis. La page ouverte passe en cobalt plein.
 */
export function PagesSidebar({
  pages,
  conformityMap,
  totalCriteria,
  currentPageId,
  onPageChange,
  auditScore,
  hasAnyEntry,
}: Props) {
  const t = useTranslations("audits.matrix.sidebar");
  const tMatrix = useTranslations("audits.matrix");

  const pageCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const page of pages) counts.set(page.id, 0);
    for (const key of conformityMap.keys()) {
      const sep = key.indexOf(":");
      const pageId = sep === -1 ? key : key.slice(0, sep);
      counts.set(pageId, (counts.get(pageId) ?? 0) + 1);
    }
    return counts;
  }, [pages, conformityMap]);

  const fullySaisiCount = useMemo(() => {
    let n = 0;
    for (const page of pages) {
      const c = pageCounts.get(page.id) ?? 0;
      if (c >= totalCriteria && totalCriteria > 0) n += 1;
    }
    return n;
  }, [pages, pageCounts, totalCriteria]);

  const globalCount = useMemo(() => {
    let total = 0;
    for (const c of pageCounts.values()) total += c;
    return total;
  }, [pageCounts]);

  const globalTotal = pages.length * totalCriteria;
  const globalPercent =
    globalTotal > 0 ? Math.round((globalCount / globalTotal) * 100) : 0;

  return (
    <aside
      aria-label={t("aria")}
      className="w-full shrink-0 px-4 py-4 lg:sticky lg:top-0 lg:max-h-screen lg:w-[264px] lg:overflow-y-auto"
    >
      <Card className="flex flex-col p-2.5">
        <div className="px-2 pb-2 pt-1">
          <h2 className="text-base font-extrabold">{t("title")}</h2>
          <p className="mt-0.5 text-sm tabular text-muted-foreground">
            {t("pagesSaisi", { filled: fullySaisiCount, total: pages.length })}
          </p>
        </div>

        <ul role="list" className="flex flex-1 flex-col gap-0.5">
          {pages.map((page) => {
            const count = pageCounts.get(page.id) ?? 0;
            const percent =
              totalCriteria > 0 ? Math.round((count / totalCriteria) * 100) : 0;
            const isActive = page.id === currentPageId;
            return (
              <li key={page.id}>
                <button
                  type="button"
                  onClick={() => onPageChange(page.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex w-full flex-col items-stretch gap-1.5 rounded-lg px-2.5 py-2 text-left",
                    "transition-colors duration-150",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-primary-soft",
                  )}
                >
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-bold">
                      {page.name}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 text-xs font-semibold tabular",
                        isActive
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground",
                      )}
                    >
                      {percent}%
                    </span>
                  </span>
                  <span
                    className={cn(
                      "h-1 overflow-hidden rounded-full",
                      isActive ? "bg-primary-foreground/25" : "bg-border",
                    )}
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={percent}
                    aria-label={t("progressAria", { percent })}
                  >
                    <span
                      className={cn(
                        "block h-full rounded-full transition-[width] duration-300 ease-out",
                        isActive ? "bg-primary-foreground" : "bg-primary",
                      )}
                      style={{ width: `${percent}%` }}
                    />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-2 flex flex-col gap-3 rounded-row bg-secondary p-3">
          <div className="flex items-center gap-3">
            <ScoreRing
              value={globalPercent}
              size={48}
              tone="primary"
              trackColor="hsl(var(--card))"
              ariaLabel={t("globalAria", { percent: globalPercent })}
            />
            <div className="min-w-0">
              <p className="text-sm font-bold">{t("globalProgress")}</p>
              <p className="mt-0.5 truncate text-sm tabular text-muted-foreground">
                {t("criteriaCount", { filled: globalCount, total: globalTotal })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 border-t border-border pt-3">
            <ScoreRing
              value={hasAnyEntry ? auditScore : null}
              size={48}
              trackColor="hsl(var(--card))"
              ariaLabel={
                hasAnyEntry
                  ? tMatrix("globalScoreAria", {
                      score: Math.round(auditScore),
                    })
                  : tMatrix("noScoreAria")
              }
            />
            <div className="min-w-0">
              <p className="text-sm font-bold">{tMatrix("globalScore")}</p>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {hasAnyEntry ? tMatrix("auditInProgress") : tMatrix("noEntry")}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </aside>
  );
}
