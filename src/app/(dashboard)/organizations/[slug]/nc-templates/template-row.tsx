"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SeverityBadge } from "@/components/audit/severity-badge";
import { deleteNCTemplate, updateNCTemplate } from "./actions";
import { TemplateForm, type TemplateFormReference } from "./template-form";
import type { NCTemplate } from "@/types/domain";

interface Props {
  organizationId: string;
  template: NCTemplate;
  references: TemplateFormReference[];
}

export function TemplateRow({ organizationId, template, references }: Props) {
  const t = useTranslations("organizations.ncTemplates");
  const [editOpen, setEditOpen] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editPending, startEdit] = useTransition();
  const [deletePending, startDelete] = useTransition();
  const FORM_ID = `edit-nc-template-form-${template.id}`;

  // Trouve la référence associée (si template scopé) pour l'affichage badge.
  const reference = template.referenceId
    ? references.find((r) => r.id === template.referenceId)
    : null;

  function handleEdit(formData: FormData) {
    setEditError(null);
    startEdit(async () => {
      const res = await updateNCTemplate(
        organizationId,
        template.id,
        formData,
      );
      if (res.error) {
        setEditError(res.error);
        return;
      }
      setEditOpen(false);
    });
  }

  function handleDelete() {
    startDelete(async () => {
      await deleteNCTemplate(organizationId, template.id);
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold">{template.label}</h3>
            <SeverityBadge severity={template.severity} />
            {reference ? (
              <Badge variant="outline" className="font-mono text-xs">
                {reference.type} {reference.version}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                {t("badgeAllReferences")}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {template.titleTemplate}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setEditOpen(true)}
            className="gap-1"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            {t("edit")}
          </Button>
          <DeleteConfirm
            label={template.label}
            pending={deletePending}
            onConfirm={handleDelete}
          />
        </div>
      </CardContent>

      <Dialog
        open={editOpen}
        onOpenChange={(o) => {
          setEditOpen(o);
          if (!o) setEditError(null);
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t("editTitle")}</DialogTitle>
            <DialogDescription>{t("editDesc")}</DialogDescription>
          </DialogHeader>
          {editError && (
            <p
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            >
              {editError}
            </p>
          )}
          <TemplateForm
            formId={FORM_ID}
            references={references}
            initial={template}
            onSubmit={handleEdit}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setEditOpen(false)}
              disabled={editPending}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              form={FORM_ID}
              disabled={editPending}
              className="gap-2"
            >
              {editPending && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// DeleteConfirm — petit composant interne pour l'AlertDialog de confirmation.
// Séparé pour garder TemplateRow lisible et permettre un useState propre.
// ---------------------------------------------------------------------------
function DeleteConfirm({
  label,
  pending,
  onConfirm,
}: {
  label: string;
  pending: boolean;
  onConfirm: () => void;
}) {
  const t = useTranslations("organizations.ncTemplates");
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1 text-destructive hover:text-destructive"
        disabled={pending}
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        {t("delete")}
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDesc", { label })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>
              {t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              onClick={() => {
                onConfirm();
                setOpen(false);
              }}
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
