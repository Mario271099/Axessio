"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  evaluateTransition,
  type AuditLifecycleSnapshot,
} from "@/lib/audit-status";
import {
  revertAuditStatus,
  transitionAuditStatus,
} from "@/app/(dashboard)/audits/[uuid]/status/actions";
import type { AuditStatus } from "@/types/domain";
import type { AvailableStatusTransition } from "@/components/audit/audit-status-actions";

interface AuditNextStepButtonProps {
  auditId: string;
  currentStatus: AuditStatus;
  snapshot: AuditLifecycleSnapshot;
  /** Transitions manuelles disponibles pour le rôle (forward-only). */
  available: AvailableStatusTransition[];
  /** L'utilisateur peut-il agir sur le cycle de vie. */
  canAct: boolean;
}

/**
 * Bouton unique « Passer à l'étape suivante ». Remplace l'ancien bloc de
 * transitions + conditions : on déclenche directement la prochaine transition
 * manuelle du cycle de vie. La sécurité repose sur :
 *   - la pré-évaluation des conditions (bouton désactivé + raison si bloqué) ;
 *   - le toast « Annuler » (fenêtre de 7 s) plutôt qu'une modale de confirmation.
 *
 * Le serveur reste l'autorité : `transitionAuditStatus` re-vérifie permission,
 * matrice et conditions avant d'écrire.
 */
export function AuditNextStepButton({
  auditId,
  currentStatus,
  snapshot,
  available,
  canAct,
}: AuditNextStepButtonProps) {
  const t = useTranslations("audits.statusTransitions");
  const tErr = useTranslations("audits.statusTransitions.errors");
  const tStatus = useTranslations("constants.auditStatus");
  const tLifecycle = useTranslations("audits.lifecycle");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Une seule transition manuelle forward par statut dans la matrice ; on
  // prend la première disponible.
  const next = available[0];
  if (!canAct || !next) return null;

  const targetStatus = next.to;
  const readiness = evaluateTransition(currentStatus, targetStatus, snapshot);
  const blocked = !readiness.ready;
  const reason =
    blocked && readiness.errorCode
      ? tErr(readiness.errorCode, {
          filled: snapshot.matrixFilled,
          total: snapshot.matrixTotal,
          percent: snapshot.matrixPercent,
        })
      : null;

  function advance() {
    if (blocked) return;
    const fromStatus = currentStatus;
    const toStatus = targetStatus;
    startTransition(async () => {
      const result = await transitionAuditStatus(auditId, toStatus);
      if (!result.ok) {
        toast.error(
          result.errorCode
            ? tErr(result.errorCode, result.context ?? {})
            : (result.message ?? tErr("STATUS_INVALID_TARGET")),
        );
        return;
      }
      router.refresh();

      // Toast avec action « Annuler » (7 s) - filet de sécurité sans modale.
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
                    message: revertRes.errorCode
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

  return (
    <div className="space-y-2">
      <Button
        type="button"
        onClick={advance}
        disabled={pending || blocked}
        title={reason ?? undefined}
        className="gap-2"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        )}
        {tLifecycle("nextStep")}
      </Button>
      {reason && (
        <p className="text-xs text-muted-foreground">{reason}</p>
      )}
    </div>
  );
}
