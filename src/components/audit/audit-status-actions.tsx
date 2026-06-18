"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AuditStatusBadge } from "@/components/audit/audit-status-badge";
import { cn } from "@/lib/utils";
import {
  evaluateTransition,
  type AuditLifecycleSnapshot,
  type AuditStatusErrorCode,
  type TransitionReadiness,
} from "@/lib/audit-status";
import {
  revertAuditStatus,
  transitionAuditStatus,
} from "@/app/(dashboard)/audits/[uuid]/status/actions";
import type { AuditStatus } from "@/types/domain";

export interface AvailableStatusTransition {
  to: AuditStatus;
  ctaKey: string;
}

interface AuditStatusActionsProps {
  auditId: string;
  currentStatus: AuditStatus;
  snapshot: AuditLifecycleSnapshot;
  /** Transitions manuelles autorisées pour le rôle courant. */
  available: AvailableStatusTransition[];
}

export function AuditStatusActions({
  auditId,
  currentStatus,
  snapshot,
  available,
}: AuditStatusActionsProps) {
  const t = useTranslations("audits.statusTransitions");
  const tErr = useTranslations("audits.statusTransitions.errors");
  const tStatus = useTranslations("constants.auditStatus");
  const router = useRouter();
  const [target, setTarget] = useState<AvailableStatusTransition | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Pré-évaluation des conditions pour chaque transition disponible.
  const readinessByTarget = new Map<AuditStatus, TransitionReadiness>(
    available.map((tr) => [
      tr.to,
      evaluateTransition(currentStatus, tr.to, snapshot),
    ]),
  );

  function open(tr: AvailableStatusTransition) {
    setTarget(tr);
    setServerError(null);
  }

  function close() {
    if (pending) return;
    setTarget(null);
    setServerError(null);
  }

  function submit() {
    if (!target) return;
    setServerError(null);
    // On capture le statut courant AVANT l'appel - c'est vers lui qu'on
    // reviendra si l'utilisateur clique « Annuler ». La capture en variable
    // locale évite que la closure du toast lise un currentStatus déjà mis
    // à jour par router.refresh().
    const fromStatus = currentStatus;
    const toStatus = target.to;
    startTransition(async () => {
      const result = await transitionAuditStatus(auditId, toStatus);
      if (!result.ok) {
        const msg = result.errorCode
          ? tErr(result.errorCode, result.context ?? {})
          : (result.message ?? tErr("STATUS_INVALID_TARGET"));
        setServerError(msg);
        return;
      }
      setTarget(null);
      router.refresh();

      // Toast Sonner avec action « Annuler ». 7 s d'affichage - laisse
      // le temps de lire avant de réagir, tout en restant éphémère.
      toast.success(t("undoToast.title", { status: tStatus(toStatus) }), {
        description: t("undoToast.description"),
        duration: 7_000,
        action: {
          label: t("undoToast.undo"),
          onClick: () => {
            startTransition(async () => {
              const revertRes = await revertAuditStatus(
                auditId,
                toStatus,
                fromStatus,
              );
              if (!revertRes.ok) {
                toast.error(
                  t("undoToast.failed", {
                    message:
                      revertRes.errorCode
                        ? tErr(revertRes.errorCode, revertRes.context ?? {})
                        : (revertRes.message ?? ""),
                  }),
                );
                return;
              }
              toast.success(
                t("undoToast.reverted", { status: tStatus(fromStatus) }),
              );
              router.refresh();
            });
          },
        },
      });
    });
  }

  function reasonLabel(code: AuditStatusErrorCode | undefined): string {
    if (!code) return "";
    return tErr(code, {
      filled: snapshot.matrixFilled,
      total: snapshot.matrixTotal,
      percent: snapshot.matrixPercent,
    });
  }

  return (
    <div className="space-y-4">
      {/* Snapshot des conditions clés */}
      <div className="space-y-3 rounded-md border border-border bg-card p-3 text-sm">
        <ConditionRow
          label={t("conditions.sample")}
          ok={snapshot.representativeCount >= 1}
          value={t("conditions.sampleValue", {
            count: snapshot.representativeCount,
          })}
        />
        <ConditionRow
          label={t("conditions.startDate")}
          ok={snapshot.startDateReached}
          value={
            snapshot.startDateSet
              ? snapshot.startDateReached
                ? t("conditions.startDateReached")
                : t("conditions.startDateFuture")
              : t("conditions.startDateMissing")
          }
        />
        <div className="space-y-1.5">
          <ConditionRow
            label={t("conditions.matrix")}
            ok={
              snapshot.matrixTotal > 0 &&
              snapshot.matrixFilled === snapshot.matrixTotal
            }
            value={t("conditions.matrixValue", {
              filled: snapshot.matrixFilled,
              total: snapshot.matrixTotal,
              percent: snapshot.matrixPercent,
            })}
          />
          <Progress
            value={Number(snapshot.matrixPercent)}
            aria-label={t("conditions.matrixAria", {
              percent: snapshot.matrixPercent,
            })}
            className="h-1.5"
          />
        </div>
      </div>

      {/* Boutons de transition */}
      {available.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t("noTransition")}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {available.map((tr) => {
            const readiness = readinessByTarget.get(tr.to);
            const blocked = !readiness?.ready;
            return (
              <Button
                key={tr.to}
                type="button"
                variant={blocked ? "outline" : "default"}
                size="sm"
                className="gap-2"
                onClick={() => open(tr)}
                disabled={pending}
                title={blocked ? reasonLabel(readiness?.errorCode) : undefined}
              >
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                {t(`cta.${tr.ctaKey}`)}
                {blocked && (
                  <XCircle
                    className="h-3.5 w-3.5 text-destructive"
                    aria-hidden="true"
                  />
                )}
              </Button>
            );
          })}
        </div>
      )}

      <Dialog open={target !== null} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {target ? t(`cta.${target.ctaKey}`) : ""}
            </DialogTitle>
            <DialogDescription>
              {target ? (
                <span className="flex flex-wrap items-center gap-2">
                  <AuditStatusBadge status={currentStatus} />
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  <AuditStatusBadge status={target.to} />
                </span>
              ) : null}
            </DialogDescription>
          </DialogHeader>

          {target &&
            (() => {
              const r = readinessByTarget.get(target.to);
              if (r?.ready) {
                return (
                  <p className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">
                    {t("ready")}
                  </p>
                );
              }
              if (r?.errorCode) {
                return (
                  <p
                    role="alert"
                    className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  >
                    {reasonLabel(r.errorCode)}
                  </p>
                );
              }
              return null;
            })()}

          {serverError && (
            <p role="alert" className="text-sm text-destructive">
              {serverError}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={close}
              disabled={pending}
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              onClick={submit}
              disabled={
                pending ||
                !target ||
                !readinessByTarget.get(target.to)?.ready
              }
            >
              {pending && (
                <Loader2
                  className="mr-2 h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              )}
              {t("confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ConditionRow({
  label,
  ok,
  value,
}: {
  label: string;
  ok: boolean;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-muted-foreground">
        {ok ? (
          <CheckCircle2
            className="h-3.5 w-3.5 text-success"
            aria-hidden="true"
          />
        ) : (
          <XCircle
            className="h-3.5 w-3.5 text-muted-foreground"
            aria-hidden="true"
          />
        )}
        {label}
      </span>
      <span
        className={cn(
          "text-right tabular-nums",
          ok ? "font-medium" : "text-muted-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}
