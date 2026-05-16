"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MiniDonut } from "@/components/ui/mini-donut";
import { cn } from "@/lib/utils";
import type { AuditPage, ConformityStatus, PageType } from "@/types/domain";

interface Props {
  pages: AuditPage[];
  conformityMap: Map<string, ConformityStatus>;
  totalCriteria: number;
  currentPageId: string;
  onPageChange: (pageId: string) => void;
}

const PAGE_TYPE_BADGE: Record<PageType, "secondary" | "muted" | "outline"> = {
  MANDATORY: "secondary",
  REPRESENTATIVE: "outline",
  TRANSVERSAL: "muted",
};

export function PagesSidebar({
  pages,
  conformityMap,
  totalCriteria,
  currentPageId,
  onPageChange,
}: Props) {
  const t = useTranslations("audits.matrix.sidebar");
  const tPageType = useTranslations("constants.pageType");

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
      className="w-full shrink-0 px-4 py-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:w-72 lg:overflow-y-auto"
    >
      <Card className="flex flex-col shadow-sm">
        <div className="border-b border-border p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("title")}
          </h2>
          <p className="mt-1 text-sm font-medium tabular-nums">
            {t("pagesSaisi", { filled: fullySaisiCount, total: pages.length })}
          </p>
        </div>

        <ul role="list" className="flex-1 space-y-1 p-2">
          {pages.map((page) => {
            const count = pageCounts.get(page.id) ?? 0;
            const percent =
              totalCriteria > 0
                ? Math.round((count / totalCriteria) * 100)
                : 0;
            const isActive = page.id === currentPageId;
            return (
              <li key={page.id}>
                <button
                  type="button"
                  onClick={() => onPageChange(page.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative flex w-full flex-col items-start gap-2 rounded-md p-3 text-left transition-colors duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isActive
                      ? "bg-primary/10 text-foreground"
                      : "hover:bg-accent",
                  )}
                >
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-primary"
                    />
                  )}
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">
                      {page.name}
                    </span>
                    <Badge
                      variant={PAGE_TYPE_BADGE[page.pageType]}
                      className="shrink-0 text-[10px]"
                    >
                      {tPageType(page.pageType)}
                    </Badge>
                  </div>
                  <div
                    className="h-1.5 w-full overflow-hidden rounded-full bg-secondary"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={percent}
                    aria-label={t("progressAria", { percent })}
                  >
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {t("criteriaCount", { filled: count, total: totalCriteria })}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="border-t border-border p-4">
          <Card className="flex items-center gap-3 bg-secondary/40 p-3 shadow-none">
            <MiniDonut
              value={globalPercent}
              size={48}
              tone="primary"
              ariaLabel={t("globalAria", { percent: globalPercent })}
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("globalProgress")}
              </p>
              <p className="mt-0.5 truncate text-sm font-medium tabular-nums">
                {t("criteriaCount", { filled: globalCount, total: globalTotal })}
              </p>
            </div>
          </Card>
        </div>
      </Card>
    </aside>
  );
}
