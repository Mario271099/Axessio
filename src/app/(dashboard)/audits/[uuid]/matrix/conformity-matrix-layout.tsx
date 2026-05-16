"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Loader2,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MiniDonut } from "@/components/ui/mini-donut";
import { PagesSidebar } from "./pages-sidebar";
import { PageMatrixContent } from "./page-matrix-content";
import { NonConformityModal } from "./non-conformity-modal";
import { calculateScore } from "@/lib/score";
import { cn } from "@/lib/utils";
import {
  bulkSetThematicConformity,
  clearThematicConformity,
  setConformity,
} from "./actions";
import type {
  AuditPage,
  ConformityStatus,
  Criterion,
  Thematic,
} from "@/types/domain";

export interface MatrixConformity {
  id: string;
  auditId: string;
  pageId: string;
  criteriaId: string;
  status: ConformityStatus;
}

interface Props {
  auditId: string;
  auditTitle: string;
  clientName: string | null;
  referenceName: string;
  canEdit: boolean;
  thematics: Thematic[];
  criteria: Criterion[];
  pages: AuditPage[];
  initialConformities: MatrixConformity[];
  currentPageId: string;
}

const conformityKey = (pageId: string, criteriaId: string) =>
  `${pageId}:${criteriaId}`;

export function ConformityMatrixLayout({
  auditId,
  auditTitle,
  clientName,
  referenceName,
  canEdit,
  thematics,
  criteria,
  pages,
  initialConformities,
  currentPageId,
}: Props) {
  const router = useRouter();
  const t = useTranslations("audits.matrix");
  const tList = useTranslations("audits.list");
  const tSave = useTranslations("audits.matrix.save");
  const [isPending, startTransition] = useTransition();

  const [conformityMap, setConformityMap] = useState<
    Map<string, ConformityStatus>
  >(() => {
    const m = new Map<string, ConformityStatus>();
    for (const c of initialConformities) {
      m.set(conformityKey(c.pageId, c.criteriaId), c.status);
    }
    return m;
  });

  const previousValuesRef = useRef<Map<string, ConformityStatus | null>>(
    new Map(),
  );

  const [pendingChanges, setPendingChanges] = useState<Set<string>>(
    () => new Set(),
  );

  const [ncModalOpen, setNcModalOpen] = useState(false);
  const [ncTarget, setNcTarget] = useState<{
    criterion: Criterion;
    page: AuditPage;
  } | null>(null);

  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  const updateLocal = useCallback(
    (pageId: string, criteriaId: string, status: ConformityStatus | null) => {
      const key = conformityKey(pageId, criteriaId);

      if (!previousValuesRef.current.has(key)) {
        previousValuesRef.current.set(key, conformityMap.get(key) ?? null);
      }

      setConformityMap((prev) => {
        const next = new Map(prev);
        if (status === null) next.delete(key);
        else next.set(key, status);
        return next;
      });

      setPendingChanges((prev) => {
        const next = new Set(prev);
        next.add(key);
        return next;
      });
      setSaveStatus("idle");
    },
    [conformityMap],
  );

  const flushPending = useCallback(async (): Promise<boolean> => {
    if (pendingChanges.size === 0) return true;

    setSaveStatus("saving");
    setSaveError(null);

    const keys = Array.from(pendingChanges);

    const results = await Promise.all(
      keys.map(async (key) => {
        const sep = key.indexOf(":");
        const pageId = key.slice(0, sep);
        const criteriaId = key.slice(sep + 1);
        const status = conformityMap.get(key) ?? null;
        const result = await setConformity(
          auditId,
          pageId,
          criteriaId,
          status,
        );
        return { key, error: result.error };
      }),
    );

    const errored = results.filter((r) => r.error !== null);

    if (errored.length > 0) {
      setConformityMap((prev) => {
        const next = new Map(prev);
        for (const { key } of errored) {
          const prevValue = previousValuesRef.current.get(key);
          if (prevValue === null || prevValue === undefined) next.delete(key);
          else next.set(key, prevValue);
        }
        return next;
      });
      setSaveStatus("error");
      setSaveError(errored[0]?.error ?? tSave("fallbackError"));
      return false;
    }

    setPendingChanges((prev) => {
      const next = new Set(prev);
      for (const k of keys) next.delete(k);
      return next;
    });
    previousValuesRef.current.clear();
    setSaveStatus("saved");
    return true;
  }, [auditId, conformityMap, pendingChanges]);

  const handlePageChange = useCallback(
    async (pageId: string) => {
      if (pageId === currentPageId) return;
      await flushPending();
      router.push(`/audits/${auditId}/matrix?page=${pageId}`);
    },
    [auditId, currentPageId, flushPending, router],
  );

  const flushPendingRef = useRef(flushPending);
  useEffect(() => {
    flushPendingRef.current = flushPending;
  }, [flushPending]);

  useEffect(() => {
    return () => {
      void flushPendingRef.current();
    };
  }, []);

  const handleBulkThematic = useCallback(
    async (thematicId: string, status: ConformityStatus) => {
      const thematicCriteria = criteria.filter(
        (c) => c.thematicId === thematicId,
      );

      const previous = new Map<string, ConformityStatus | null>();
      setConformityMap((prev) => {
        const next = new Map(prev);
        for (const c of thematicCriteria) {
          const key = conformityKey(currentPageId, c.id);
          const existing = next.get(key);
          if (existing === "COMPLIANT" || existing === "NON_COMPLIANT") continue;
          previous.set(key, existing ?? null);
          next.set(key, status);
        }
        return next;
      });

      startTransition(async () => {
        const result = await bulkSetThematicConformity(
          auditId,
          currentPageId,
          thematicId,
          status,
        );
        if (result.error) {
          setConformityMap((prev) => {
            const next = new Map(prev);
            for (const [key, val] of previous.entries()) {
              if (val === null) next.delete(key);
              else next.set(key, val);
            }
            return next;
          });
          setSaveError(result.error);
          setSaveStatus("error");
        }
      });
    },
    [auditId, currentPageId, criteria],
  );

  const handleClearThematic = useCallback(
    async (thematicId: string) => {
      const thematicCriteria = criteria.filter(
        (c) => c.thematicId === thematicId,
      );
      const previous = new Map<string, ConformityStatus>();

      setConformityMap((prev) => {
        const next = new Map(prev);
        for (const c of thematicCriteria) {
          const key = conformityKey(currentPageId, c.id);
          const existing = next.get(key);
          if (existing) {
            previous.set(key, existing);
            next.delete(key);
          }
        }
        return next;
      });

      setPendingChanges((prev) => {
        const next = new Set(prev);
        for (const c of thematicCriteria) {
          next.delete(conformityKey(currentPageId, c.id));
        }
        return next;
      });

      startTransition(async () => {
        const result = await clearThematicConformity(
          auditId,
          currentPageId,
          thematicId,
        );
        if (result.error) {
          setConformityMap((prev) => {
            const next = new Map(prev);
            for (const [key, val] of previous.entries()) next.set(key, val);
            return next;
          });
          setSaveError(result.error);
          setSaveStatus("error");
        }
      });
    },
    [auditId, currentPageId, criteria],
  );

  const handleNonCompliantClick = useCallback(
    (criterion: Criterion, page: AuditPage) => {
      setNcTarget({ criterion, page });
      setNcModalOpen(true);
    },
    [],
  );

  const handleNCCreated = useCallback(
    (criteriaId: string, pageId: string) => {
      const key = conformityKey(pageId, criteriaId);
      setConformityMap((prev) => {
        const next = new Map(prev);
        next.set(key, "NON_COMPLIANT");
        return next;
      });
      setPendingChanges((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      previousValuesRef.current.delete(key);
      setNcModalOpen(false);
      setNcTarget(null);
    },
    [],
  );

  const totalCriteria = criteria.length;
  const currentPage = useMemo(
    () => pages.find((p) => p.id === currentPageId) ?? pages[0],
    [pages, currentPageId],
  );

  // Score global de l'audit : agrégation sur toutes les pages.
  const auditScore = useMemo(() => {
    let compliant = 0;
    let notApplicable = 0;
    for (const page of pages) {
      for (const c of criteria) {
        const status = conformityMap.get(conformityKey(page.id, c.id));
        if (status === "COMPLIANT") compliant += 1;
        else if (status === "NOT_APPLICABLE") notApplicable += 1;
      }
    }
    return calculateScore({
      compliant,
      notApplicable,
      totalCriteria: pages.length * totalCriteria,
    });
  }, [pages, criteria, conformityMap, totalCriteria]);

  const hasAnyEntry = useMemo(() => conformityMap.size > 0, [conformityMap]);

  const indicatorMessage =
    saveStatus === "saving"
      ? tSave("saving")
      : saveStatus === "error"
        ? tSave("errorPrefix", {
            message: saveError ?? tSave("fallbackError"),
          })
        : pendingChanges.size > 0
          ? tSave("pending", { count: pendingChanges.size })
          : tSave("allSaved");

  const hasPending = pendingChanges.size > 0;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      {/* En-tête : breadcrumb + titre + score global -------------------- */}
      <div className="border-b border-border bg-card/50 px-4 py-4 md:px-8">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1 text-xs text-muted-foreground"
        >
          <Link
            href="/audits"
            className="rounded px-1 py-0.5 hover:bg-accent hover:text-foreground"
          >
            {tList("title")}
          </Link>
          <ChevronRight className="h-3 w-3" aria-hidden="true" />
          <Link
            href={`/audits/${auditId}`}
            className="rounded px-1 py-0.5 hover:bg-accent hover:text-foreground"
          >
            {auditTitle}
          </Link>
          <ChevronRight className="h-3 w-3" aria-hidden="true" />
          <span className="rounded px-1 py-0.5 font-medium text-foreground">
            {t("breadcrumbCurrent")}
          </span>
        </nav>

        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {referenceName}
              </span>
              <span aria-hidden="true"> · </span>
              <span>{t("subtitleCriteria", { count: totalCriteria })}</span>
              {clientName && (
                <>
                  <span aria-hidden="true"> · </span>
                  <span>{clientName}</span>
                </>
              )}
            </p>
          </div>

          <Card className="flex items-center gap-3 p-3 shadow-sm">
            <MiniDonut
              value={hasAnyEntry ? auditScore : null}
              size={64}
              tone="score"
              ariaLabel={
                hasAnyEntry
                  ? t("globalScoreAria", { score: Math.round(auditScore) })
                  : t("noScoreAria")
              }
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("globalScore")}
              </p>
              <p className="text-xs text-muted-foreground">
                {hasAnyEntry ? t("auditInProgress") : t("noEntry")}
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Layout matrix --------------------------------------------------- */}
      <div className="flex flex-1 flex-col lg:flex-row">
        <PagesSidebar
          pages={pages}
          conformityMap={conformityMap}
          totalCriteria={totalCriteria}
          currentPageId={currentPageId}
          onPageChange={handlePageChange}
        />

        <main className="min-w-0 flex-1 px-4 pb-24 pt-6 md:px-6 lg:px-8">
          {currentPage ? (
            <PageMatrixContent
              page={currentPage}
              thematics={thematics}
              criteria={criteria}
              conformityMap={conformityMap}
              currentPageId={currentPageId}
              canEdit={canEdit}
              onSetStatus={(criteriaId, status) =>
                updateLocal(currentPageId, criteriaId, status)
              }
              onNonCompliantClick={(criterion) =>
                handleNonCompliantClick(criterion, currentPage)
              }
              onBulkThematic={handleBulkThematic}
              onClearThematic={handleClearThematic}
              onAccordionClose={() => {
                window.setTimeout(() => {
                  void flushPending();
                }, 300);
              }}
              isProcessing={isPending}
            />
          ) : null}
        </main>
      </div>

      {/* Footer sticky --------------------------------------------------- */}
      <div className="sticky bottom-0 z-20 border-t border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/75 md:px-6">
        <div className="flex items-center justify-between gap-4">
          <p
            aria-live="polite"
            className={cn(
              "inline-flex items-center gap-2 text-sm font-medium",
              saveStatus === "error" && "text-destructive",
              saveStatus !== "error" && hasPending && "text-warning",
              saveStatus !== "error" && !hasPending && "text-success",
            )}
          >
            {saveStatus === "saving" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : hasPending || saveStatus === "error" ? (
              <CircleDot
                className="h-4 w-4 animate-pulse"
                aria-hidden="true"
              />
            ) : (
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            )}
            <span>{indicatorMessage}</span>
          </p>
          <Button
            type="button"
            onClick={() => void flushPending()}
            disabled={!hasPending || saveStatus === "saving"}
            className="gap-2"
          >
            {saveStatus === "saving" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="h-4 w-4" aria-hidden="true" />
            )}
            {tSave("saveAll")}
          </Button>
        </div>
      </div>

      {/* Modale NC ------------------------------------------------------- */}
      {ncTarget && (
        <NonConformityModal
          open={ncModalOpen}
          onOpenChange={(open) => {
            setNcModalOpen(open);
            if (!open) setNcTarget(null);
          }}
          auditId={auditId}
          page={ncTarget.page}
          criterion={ncTarget.criterion}
          onCreated={handleNCCreated}
        />
      )}
    </div>
  );
}
