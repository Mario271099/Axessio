"use client";

import { useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { PAGE_TYPE_LABELS } from "@/lib/constants";
import type { AuditPage, ConformityStatus } from "@/types/domain";

interface Props {
  pages: AuditPage[];
  conformityMap: Map<string, ConformityStatus>;
  totalCriteria: number;
  currentPageId: string;
  onPageChange: (pageId: string) => void;
}

export function PagesSidebar({
  pages,
  conformityMap,
  totalCriteria,
  currentPageId,
  onPageChange,
}: Props) {
  // Calcul du nombre de critères saisis pour chaque page
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
      aria-label="Pages de l'audit"
      className="w-full shrink-0 border-b border-border bg-card/40 lg:w-72 lg:border-b-0 lg:border-r"
    >
      <div className="flex flex-col">
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <h2 className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Pages ({pages.length})
          </h2>
          <ul role="list" className="mt-2 space-y-1">
            {pages.map((page) => {
              const count = pageCounts.get(page.id) ?? 0;
              const percent =
                totalCriteria > 0
                  ? Math.round((count / totalCriteria) * 100)
                  : 0;
              const isActive = page.id === currentPageId;
              const isTransversal = page.pageType === "TRANSVERSAL";
              return (
                <li key={page.id}>
                  <button
                    type="button"
                    onClick={() => onPageChange(page.id)}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "block w-full rounded-md px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-accent/40",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium">{page.name}</span>
                      {isTransversal && (
                        <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                          {PAGE_TYPE_LABELS.TRANSVERSAL}
                        </span>
                      )}
                    </div>
                    <div
                      className={cn(
                        "mt-1 text-xs",
                        isActive
                          ? "text-primary/80"
                          : "text-muted-foreground",
                      )}
                    >
                      {count} / {totalCriteria} critères saisis
                    </div>
                    <Progress
                      value={percent}
                      className="mt-1.5 h-1"
                      aria-label={`Progression de la page ${page.name} : ${percent}%`}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="border-t border-border p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Progression globale
          </p>
          <p className="mt-1 text-sm font-medium">
            {globalCount} / {globalTotal} saisies
            <span className="ml-2 text-muted-foreground">({globalPercent}%)</span>
          </p>
          <Progress
            value={globalPercent}
            className="mt-2 h-1.5"
            aria-label={`Progression globale de l'audit : ${globalPercent}%`}
          />
        </div>
      </div>
    </aside>
  );
}
