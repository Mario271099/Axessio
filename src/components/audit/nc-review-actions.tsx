"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertTriangle, CheckCircle2, Eye, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  approveNCReview,
  cancelNCReview,
  requestNCChanges,
  requestNCReview,
} from "@/app/(dashboard)/audits/[uuid]/anomalies/[ncId]/review-actions";
import type { NCReviewStatus } from "@/types/domain";

interface NCReviewActionsProps {
  ncId: string;
  reviewStatus: NCReviewStatus;
  /** Rôle d'assignment de l'utilisateur sur l'audit parent. */
  userRole: "auditor" | "proofreader" | "admin" | "none";
}

type DialogMode = "request" | "changes" | "approve" | "cancel" | null;

export function NCReviewActions({
  ncId,
  reviewStatus,
  userRole,
}: NCReviewActionsProps) {
  const t = useTranslations("audits.ncReview");
  const tErr = useTranslations("audits.ncReview.errors");
  const router = useRouter();
  const [mode, setMode] = useState<DialogMode>(null);
  const [reason, setReason] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isAuditor = userRole === "auditor" || userRole === "admin";
  const isProofreader = userRole === "proofreader" || userRole === "admin";

  // Cas par cas, quels boutons l'utilisateur peut voir selon état + rôle.
  const showRequest =
    isAuditor &&
    (reviewStatus === "not_requested" ||
      reviewStatus === "changes_requested" ||
      reviewStatus === "approved");
  const showCancel =
    isAuditor && (reviewStatus === "pending" || reviewStatus === "under_review");
  const showApprove =
    isProofreader &&
    (reviewStatus === "pending" || reviewStatus === "under_review");
  const showChanges = showApprove; // mêmes conditions, action distincte

  function close() {
    if (pending) return;
    setMode(null);
    setReason("");
    setServerError(null);
  }

  function runAction(handler: () => Promise<{ ok: boolean; errorCode?: string; message?: string }>) {
    setServerError(null);
    startTransition(async () => {
      const result = await handler();
      if (!result.ok) {
        const msg = result.errorCode
          ? tErr(result.errorCode as Parameters<typeof tErr>[0])
          : (result.message ?? tErr("NC_REVIEW_INVALID_STATE"));
        setServerError(msg);
        return;
      }
      close();
      router.refresh();
    });
  }

  // Pas de bouton à afficher = composant invisible
  if (!showRequest && !showCancel && !showApprove && !showChanges) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {showRequest && (
        <Button
          type="button"
          variant="default"
          size="sm"
          className="gap-2"
          onClick={() => setMode("request")}
          disabled={pending}
        >
          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
          {t("cta.request")}
        </Button>
      )}
      {showCancel && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => setMode("cancel")}
          disabled={pending}
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          {t("cta.cancel")}
        </Button>
      )}
      {showChanges && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setMode("changes")}
          disabled={pending}
        >
          <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
          {t("cta.requestChanges")}
        </Button>
      )}
      {showApprove && (
        <Button
          type="button"
          variant="default"
          size="sm"
          className="gap-2"
          onClick={() => setMode("approve")}
          disabled={pending}
        >
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
          {t("cta.approve")}
        </Button>
      )}

      <Dialog open={mode !== null} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {mode === "request" && t("dialog.requestTitle")}
              {mode === "changes" && t("dialog.changesTitle")}
              {mode === "approve" && t("dialog.approveTitle")}
              {mode === "cancel" && t("dialog.cancelTitle")}
            </DialogTitle>
            <DialogDescription>
              {mode === "request" && t("dialog.requestDesc")}
              {mode === "changes" && t("dialog.changesDesc")}
              {mode === "approve" && t("dialog.approveDesc")}
              {mode === "cancel" && t("dialog.cancelDesc")}
            </DialogDescription>
          </DialogHeader>

          {mode === "changes" && (
            <div className="space-y-2">
              <Label htmlFor="nc-review-reason">{t("dialog.reasonLabel")}</Label>
              <Textarea
                id="nc-review-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("dialog.reasonPlaceholder")}
                rows={4}
                maxLength={2000}
                disabled={pending}
                required
              />
              <p className="text-xs text-muted-foreground">
                {t("dialog.reasonHint")}
              </p>
            </div>
          )}

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
              {t("dialog.dismiss")}
            </Button>
            <Button
              type="button"
              disabled={
                pending || (mode === "changes" && reason.trim().length === 0)
              }
              onClick={() => {
                if (mode === "request") runAction(() => requestNCReview(ncId));
                else if (mode === "cancel") runAction(() => cancelNCReview(ncId));
                else if (mode === "changes")
                  runAction(() => requestNCChanges(ncId, reason));
                else if (mode === "approve")
                  runAction(() => approveNCReview(ncId));
              }}
            >
              {pending && (
                <Loader2
                  className="mr-2 h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              )}
              {t("dialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
