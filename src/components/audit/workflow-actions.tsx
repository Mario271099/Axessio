"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AUDIT_WORKFLOW_LABELS,
  AUDIT_WORKFLOW_TONE,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { transitionWorkflow } from "@/app/(dashboard)/audits/[uuid]/workflow/actions";
import type { AuditWorkflowStatus, UserRole } from "@/types/domain";

interface AvailableTransition {
  to: AuditWorkflowStatus;
  /** Force la saisie d'un motif (cf. matrice `AUDIT_WORKFLOW_TRANSITIONS`). */
  requireReason?: boolean;
  /**
   * Clé i18n du CTA. Si fournie, on utilise `audits.workflow.<ctaKey>` au
   * lieu de `audits.workflow.transitionCta.<to>`.
   */
  ctaKey?: string;
}

interface WorkflowActionsProps {
  auditId: string;
  current: AuditWorkflowStatus;
  role: UserRole;
  /** Transitions filtrées côté serveur selon l'état courant et le rôle. */
  available: AvailableTransition[];
}

const TONE_PILL: Record<
  "neutral" | "info" | "warning" | "success" | "muted",
  string
> = {
  neutral: "bg-secondary text-secondary-foreground",
  info: "bg-primary/10 text-primary",
  warning: "bg-warning/10 text-warning",
  success: "bg-success/10 text-success",
  muted: "bg-muted text-muted-foreground",
};

export function WorkflowActions({
  auditId,
  current,
  available,
}: WorkflowActionsProps) {
  const t = useTranslations("audits.workflow");
  const [pending, startTransition] = useTransition();
  const [target, setTarget] = useState<AvailableTransition | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function openTransitionDialog(tr: AvailableTransition) {
    setTarget(tr);
    setReason("");
    setError(null);
  }

  function closeDialog() {
    if (pending) return;
    setTarget(null);
    setReason("");
    setError(null);
  }

  function submit() {
    if (!target) return;
    if (target.requireReason && reason.trim().length === 0) {
      setError(t("reasonRequiredError"));
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await transitionWorkflow(
        auditId,
        target.to,
        reason || null,
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      setTarget(null);
      setReason("");
    });
  }

  // Renvoie le libellé du CTA pour une transition, en respectant `ctaKey`
  // s'il est fourni (ex. "Demander des corrections" plutôt que "draft").
  function transitionCta(tr: AvailableTransition): string {
    if (tr.ctaKey) return t(tr.ctaKey);
    return t(`transitionCta.${tr.to}`);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Label className="text-xs text-muted-foreground">{t("currentLabel")}</Label>
        <span
          className={cn(
            "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
            TONE_PILL[AUDIT_WORKFLOW_TONE[current]],
          )}
        >
          {AUDIT_WORKFLOW_LABELS[current]}
        </span>
      </div>

      {available.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {available.map((tr) => (
            <Button
              key={`${tr.to}-${tr.ctaKey ?? ""}`}
              type="button"
              variant={tr.requireReason ? "outline" : "default"}
              size="sm"
              className="gap-2"
              onClick={() => openTransitionDialog(tr)}
              disabled={pending}
            >
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              {transitionCta(tr)}
            </Button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{t("noTransition")}</p>
      )}

      <Dialog open={target !== null} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{target ? transitionCta(target) : ""}</DialogTitle>
            <DialogDescription>
              {target ? (
                <span className="flex flex-wrap items-center gap-2">
                  <Badge variant="muted">{AUDIT_WORKFLOW_LABELS[current]}</Badge>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  <Badge variant="default">
                    {AUDIT_WORKFLOW_LABELS[target.to]}
                  </Badge>
                </span>
              ) : null}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="workflow-reason">
              {target?.requireReason ? t("reasonLabelRequired") : t("reasonLabel")}
            </Label>
            <Textarea
              id="workflow-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("reasonPlaceholder")}
              rows={3}
              maxLength={500}
              disabled={pending}
              required={target?.requireReason}
              aria-required={target?.requireReason ? "true" : "false"}
            />
            <p className="text-xs text-muted-foreground">
              {target?.requireReason ? t("reasonHintRequired") : t("reasonHint")}
            </p>
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={closeDialog}
              disabled={pending}
            >
              {t("cancel")}
            </Button>
            <Button type="button" onClick={submit} disabled={pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              {t("confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
