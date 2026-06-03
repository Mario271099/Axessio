"use client";

// Section « Contacts client » sur la page d'un audit.
// Les contacts sont la Porte 2 du modèle d'autorisation : ils peuvent lire
// l'audit, sa matrice et ses NC, écrire dans le fil client, mais jamais
// accéder au fil review interne. RLS garantie par la migration 70.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Mail, Plus, UserMinus, UserPlus, X } from "lucide-react";
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
import {
  inviteContact,
  removeContact,
} from "@/app/(dashboard)/audits/[uuid]/contacts/actions";

export interface ContactEntry {
  profileId: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}

interface AuditContactsProps {
  auditId: string;
  contacts: ContactEntry[];
  canManage: boolean;
}

function fullName(c: ContactEntry): string {
  const name = [c.firstName, c.lastName]
    .filter((v) => v && v.trim().length > 0)
    .join(" ")
    .trim();
  return name || c.email || "—";
}

export function AuditContacts({
  auditId,
  contacts,
  canManage,
}: AuditContactsProps) {
  const t = useTranslations("audits.contacts");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [removeTarget, setRemoveTarget] = useState<ContactEntry | null>(null);

  function submitInvite(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await inviteContact(auditId, formData);
      if (res.error) {
        setError(res.error);
        return;
      }
      setInviteOpen(false);
      router.refresh();
    });
  }

  function confirmRemove() {
    if (!removeTarget) return;
    const target = removeTarget;
    setError(null);
    startTransition(async () => {
      const res = await removeContact(auditId, target.profileId);
      setRemoveTarget(null);
      if (res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {contacts.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="space-y-2">
          {contacts.map((c) => (
            <li
              key={c.profileId}
              className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
                >
                  {fullName(c).slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {fullName(c)}
                  </p>
                  {c.email && (
                    <p className="truncate text-xs text-muted-foreground">
                      {c.email}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <Mail className="h-3 w-3" aria-hidden="true" />
                  {t("badge")}
                </Badge>
                {canManage && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setRemoveTarget(c)}
                    disabled={pending}
                    aria-label={t("removeAria", { name: fullName(c) })}
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      {canManage && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setInviteOpen(true)}
          className="gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          {t("invite")}
        </Button>
      )}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("inviteTitle")}</DialogTitle>
            <DialogDescription>{t("inviteDesc")}</DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitInvite(new FormData(e.currentTarget));
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="contact-first-name">{t("firstName")} *</Label>
                <Input
                  id="contact-first-name"
                  name="first_name"
                  required
                  autoComplete="given-name"
                  disabled={pending}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact-last-name">{t("lastName")} *</Label>
                <Input
                  id="contact-last-name"
                  name="last_name"
                  required
                  autoComplete="family-name"
                  disabled={pending}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contact-email">{t("email")} *</Label>
              <Input
                id="contact-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="contact@exemple.com"
                disabled={pending}
              />
              <p className="text-xs text-muted-foreground">
                {t("emailHint")}
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setInviteOpen(false)}
                disabled={pending}
              >
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={pending} className="gap-1.5">
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <UserPlus className="h-4 w-4" aria-hidden="true" />
                )}
                {t("inviteCta")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={removeTarget !== null}
        onOpenChange={(o) => !o && setRemoveTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("removeTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("removeDesc", {
                name: removeTarget ? fullName(removeTarget) : "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                confirmRemove();
              }}
              disabled={pending}
              className="gap-1.5"
            >
              {pending && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              <UserMinus className="h-4 w-4" aria-hidden="true" />
              {t("removeCta")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
