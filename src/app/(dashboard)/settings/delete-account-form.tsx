"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { deleteAccount } from "./actions";

interface Props {
  email: string;
}

export function DeleteAccountForm({ email }: Props) {
  const t = useTranslations("settings.dangerZone");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const matches = confirm.trim().toLowerCase() === email.toLowerCase();

  const onConfirm = () => {
    if (!matches) return;
    setError(null);
    const formData = new FormData();
    formData.set("confirm", confirm);
    startTransition(async () => {
      const res = await deleteAccount(formData);
      // En cas de succès, la server action redirige : on n'arrive ici
      // qu'avec une erreur.
      if (res?.error) {
        setError(res.error);
      }
    });
  };

  return (
    <div className="space-y-4 rounded-md border border-destructive/40 bg-destructive/5 p-4">
      <div className="space-y-1">
        <p className="text-sm font-medium text-destructive">{t("title")}</p>
        <p className="text-xs text-destructive/80">{t("description")}</p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={pending}
        className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
        {t("trigger")}
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dialogTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dialogDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="delete-account-confirm">
              {t("confirmLabel", { email })}
            </Label>
            <Input
              id="delete-account-confirm"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              disabled={pending}
              placeholder={email}
            />
          </div>

          {error && (
            <p
              role="alert"
              className="inline-flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
            >
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              <span>{error}</span>
            </p>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(e) => {
                // Le composant Radix ferme automatiquement le dialog sur
                // click - on bloque ça pour pouvoir afficher l'éventuelle
                // erreur dans le même dialog.
                e.preventDefault();
                onConfirm();
              }}
              disabled={!matches || pending}
            >
              {pending ? (
                <Loader2
                  className="h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              )}
              {t("confirmCta")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
