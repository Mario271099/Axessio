"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PagesSidebar } from "./pages-sidebar";
import { PageMatrixContent } from "./page-matrix-content";
import { NonConformityModal } from "./non-conformity-modal";
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
  canEdit,
  thematics,
  criteria,
  pages,
  initialConformities,
  currentPageId,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Map locale des statuts (clé "pageId:criteriaId" → status)
  const [conformityMap, setConformityMap] = useState<
    Map<string, ConformityStatus>
  >(() => {
    const m = new Map<string, ConformityStatus>();
    for (const c of initialConformities) {
      m.set(conformityKey(c.pageId, c.criteriaId), c.status);
    }
    return m;
  });

  // Statuts précédents (avant édition non sauvegardée) — pour rollback en cas d'erreur
  const previousValuesRef = useRef<Map<string, ConformityStatus | null>>(
    new Map(),
  );

  // Modifications en attente (clé "pageId:criteriaId")
  const [pendingChanges, setPendingChanges] = useState<Set<string>>(
    () => new Set(),
  );

  // Modale NC
  const [ncModalOpen, setNcModalOpen] = useState(false);
  const [ncTarget, setNcTarget] = useState<{
    criterion: Criterion;
    page: AuditPage;
  } | null>(null);

  // Indicateur de sauvegarde
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  // ==========================================================================
  // Optimistic update + tracking de pending
  // ==========================================================================
  const updateLocal = useCallback(
    (pageId: string, criteriaId: string, status: ConformityStatus | null) => {
      const key = conformityKey(pageId, criteriaId);

      // Capture la valeur précédente une seule fois pour rollback
      if (!previousValuesRef.current.has(key)) {
        previousValuesRef.current.set(
          key,
          conformityMap.get(key) ?? null,
        );
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

  // ==========================================================================
  // Flush des modifications pending (une à une, parallèle)
  // ==========================================================================
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
      // Rollback des erreurs
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
      setSaveError(errored[0]?.error ?? "Sauvegarde impossible.");
      return false;
    }

    // Succès : on retire les clés flushées de la pending list
    setPendingChanges((prev) => {
      const next = new Set(prev);
      for (const k of keys) next.delete(k);
      return next;
    });
    previousValuesRef.current.clear();
    setSaveStatus("saved");
    return true;
  }, [auditId, conformityMap, pendingChanges]);

  // ==========================================================================
  // Sauvegarde au changement de page
  // ==========================================================================
  const handlePageChange = useCallback(
    async (pageId: string) => {
      if (pageId === currentPageId) return;
      await flushPending();
      router.push(`/audits/${auditId}/matrix?page=${pageId}`);
    },
    [auditId, currentPageId, flushPending, router],
  );

  // ==========================================================================
  // Sauvegarde au unmount (best effort)
  // ==========================================================================
  const flushPendingRef = useRef(flushPending);
  useEffect(() => {
    flushPendingRef.current = flushPending;
  }, [flushPending]);

  useEffect(() => {
    return () => {
      // Tente une sauvegarde finale à la destruction du composant.
      // Best-effort : pas d'await possible dans cleanup, mais le résultat
      // côté serveur reste cohérent grâce au revalidatePath.
      void flushPendingRef.current();
    };
  }, []);

  // ==========================================================================
  // Actions groupées par thématique (avec optimistic update)
  // ==========================================================================
  const handleBulkThematic = useCallback(
    async (thematicId: string, status: ConformityStatus) => {
      const thematicCriteria = criteria.filter(
        (c) => c.thematicId === thematicId,
      );

      // Optimistic : on définit le statut sur tous les critères qui n'ont pas
      // déjà COMPLIANT ou NON_COMPLIANT
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
          // Rollback
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

      // Retire les pending de cette thématique aussi
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

  // ==========================================================================
  // Click sur "Non conforme" → ouvre la modale
  // ==========================================================================
  const handleNonCompliantClick = useCallback(
    (criterion: Criterion, page: AuditPage) => {
      setNcTarget({ criterion, page });
      setNcModalOpen(true);
    },
    [],
  );

  const handleNCCreated = useCallback(
    (criteriaId: string, pageId: string) => {
      // Le serveur a déjà upsert NON_COMPLIANT, on aligne le state local
      const key = conformityKey(pageId, criteriaId);
      setConformityMap((prev) => {
        const next = new Map(prev);
        next.set(key, "NON_COMPLIANT");
        return next;
      });
      // Retire de pending si on l'avait ajouté
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

  // ==========================================================================
  // Total et page courante
  // ==========================================================================
  const totalCriteria = criteria.length;
  const currentPage = useMemo(
    () => pages.find((p) => p.id === currentPageId) ?? pages[0],
    [pages, currentPageId],
  );

  const indicatorMessage =
    saveStatus === "saving"
      ? "Sauvegarde en cours…"
      : saveStatus === "error"
        ? `Erreur : ${saveError ?? "sauvegarde impossible"}`
        : pendingChanges.size > 0
          ? `${pendingChanges.size} modification${pendingChanges.size > 1 ? "s" : ""} en attente`
          : "Tout est sauvegardé";

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      {/* Breadcrumb / titre ----------------------------------------------- */}
      <div className="border-b border-border bg-card/50 px-6 py-4">
        <Button asChild variant="ghost" size="sm" className="gap-1 -ml-3">
          <Link href={`/audits/${auditId}`}>
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Retour à l&apos;audit
          </Link>
        </Button>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-xl font-semibold tracking-tight">
            Matrice de conformité
          </h1>
          <span className="text-sm text-muted-foreground">
            {clientName ? `${clientName} · ` : ""}
            {auditTitle}
          </span>
        </div>
      </div>

      {/* Layout matrix ---------------------------------------------------- */}
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
                // Auto-save 300ms après la fermeture d'un accordéon
                window.setTimeout(() => {
                  void flushPending();
                }, 300);
              }}
              isProcessing={isPending}
            />
          ) : null}
        </main>
      </div>

      {/* Footer sticky ---------------------------------------------------- */}
      <div className="sticky bottom-0 z-10 border-t border-border bg-background/95 px-4 py-3 backdrop-blur md:px-6">
        <div className="flex items-center justify-between gap-4">
          <p
            aria-live="polite"
            className={
              saveStatus === "error"
                ? "text-sm font-medium text-destructive"
                : pendingChanges.size > 0
                  ? "text-sm font-medium text-warning"
                  : "text-sm text-muted-foreground"
            }
          >
            {indicatorMessage}
          </p>
          <Button
            type="button"
            onClick={() => void flushPending()}
            disabled={pendingChanges.size === 0 || saveStatus === "saving"}
            className="gap-2"
          >
            {saveStatus === "saving" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="h-4 w-4" aria-hidden="true" />
            )}
            Sauvegarder tout
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
