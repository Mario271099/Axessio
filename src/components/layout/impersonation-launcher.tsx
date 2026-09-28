"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { USER_ROLE_BADGE_VARIANT, USER_ROLE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { enterImpersonation } from "@/app/(dashboard)/admin/impersonation/actions";
import type { UserRole } from "@/types/domain";

interface ImpersonationLauncherProps {
  /** Liste des rôles que l'utilisateur courant peut emprunter. */
  availableRoles: UserRole[];
  /** Variante du bouton déclencheur. */
  triggerVariant?: "default" | "outline" | "ghost";
  /** Texte alternatif du bouton (par défaut : "Voir comme..."). */
  triggerLabel?: string;
}

export function ImpersonationLauncher({
  availableRoles,
  triggerVariant = "outline",
  triggerLabel,
}: ImpersonationLauncherProps) {
  const t = useTranslations("impersonation");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<UserRole | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (availableRoles.length === 0) return null;

  function submit() {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      const result = await enterImpersonation(selected);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      // refresh pour repeindre layout + sidebar avec le nouveau rôle
      router.refresh();
      router.push("/dashboard");
    });
  }

  return (
    <>
      <Button
        type="button"
        variant={triggerVariant}
        size="sm"
        className="gap-2"
        onClick={() => setOpen(true)}
      >
        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
        {triggerLabel ?? t("launcher.cta")}
      </Button>

      <Dialog open={open} onOpenChange={(v) => !pending && setOpen(v)}>
        <DialogContent size="md" closeLabel={tCommon("close")}>
          <DialogHeader icon={<Eye aria-hidden="true" />} tone="ink">
            <DialogTitle>{t("launcher.dialogTitle")}</DialogTitle>
            <DialogDescription>{t("launcher.dialogDesc")}</DialogDescription>
          </DialogHeader>

          <DialogBody>
          <fieldset className="flex flex-col gap-2" disabled={pending}>
            <legend className="sr-only">{t("launcher.legend")}</legend>
            {availableRoles.map((role) => {
              const id = `impersonate-${role}`;
              const isSelected = selected === role;
              return (
                <Label
                  key={role}
                  htmlFor={id}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-[0.875rem] border p-3.5 transition-colors",
                    isSelected
                      ? "border-primary bg-primary-soft shadow-[inset_0_0_0_1px_hsl(var(--primary))]"
                      : "border-border hover:border-primary hover:bg-primary-softer",
                  )}
                  data-selected={isSelected}
                >
                  <input
                    id={id}
                    type="radio"
                    name="impersonation-role"
                    value={role}
                    checked={isSelected}
                    onChange={() => setSelected(role)}
                    className="size-5 accent-[hsl(var(--primary))]"
                  />
                  <span className="flex flex-1 items-center justify-between gap-2">
                    <span className="text-[0.95rem] font-bold">
                      {USER_ROLE_LABELS[role]}
                    </span>
                    <Badge variant={USER_ROLE_BADGE_VARIANT[role]}>
                      {role}
                    </Badge>
                  </span>
                </Label>
              );
            })}
          </fieldset>

          {error && (
            <p
              role="alert"
              className="rounded-[0.875rem] bg-destructive/10 px-4 py-3 text-[0.95rem] text-destructive"
            >
              {error}
            </p>
          )}
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              {t("launcher.cancel")}
            </Button>
            <Button
              type="button"
              onClick={submit}
              disabled={pending || !selected}
            >
              {pending && (
                <Loader2 className="animate-spin" aria-hidden="true" />
              )}
              {t("launcher.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
