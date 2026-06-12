"use client";

// Dialogues d'invitation et d'édition de rôle de la page utilisateurs.
// Extraits de users-list.tsx (découpage des gros composants) — markup et
// comportement inchangés.

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { AlertCircle, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UserRole } from "@/types/domain";
import { inviteUser, updateUserRole } from "./actions";
import type { ClientOption, UserListItem } from "./users-types";

function FormError({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="inline-flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
}

export function InviteUserDialog({
  open,
  onOpenChange,
  clients,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: ClientOption[];
  onSuccess: () => void;
}) {
  const t = useTranslations("users");
  const tCommon = useTranslations("common");
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole>("client");
  const [clientId, setClientId] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  // Les staff plateforme (admin/auditor) ne sont rattachés à aucun client.
  const needsClient = role !== "auditor" && role !== "admin";

  const reset = () => {
    setError(null);
    setRole("client");
    setClientId("");
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    if (!formData.get("email")?.toString().trim()) {
      setError(t("inviteDialog.emailRequired"));
      return;
    }
    if (!formData.get("first_name")?.toString().trim()) {
      setError(t("inviteDialog.firstNameRequired"));
      return;
    }
    if (!formData.get("last_name")?.toString().trim()) {
      setError(t("inviteDialog.lastNameRequired"));
      return;
    }
    if (needsClient && !clientId) {
      setError(t("inviteDialog.clientRequired"));
      return;
    }

    formData.set("role", role);
    formData.set("client_id", needsClient ? clientId : "");
    setError(null);

    startTransition(async () => {
      const result = await inviteUser(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      toast.success(t("inviteDialog.successAlert"));
      form.reset();
      reset();
      onOpenChange(false);
      onSuccess();
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("inviteDialog.title")}</DialogTitle>
          <DialogDescription>{t("inviteDialog.desc")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <FormError message={error} />}

          <div className="space-y-2">
            <Label htmlFor="invite-email">{t("inviteDialog.email")} *</Label>
            <Input
              id="invite-email"
              name="email"
              type="email"
              required
              autoFocus
              placeholder={t("inviteDialog.emailPlaceholder")}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="invite-first-name">
                {t("inviteDialog.firstName")} *
              </Label>
              <Input
                id="invite-first-name"
                name="first_name"
                required
                placeholder={t("inviteDialog.firstNamePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-last-name">
                {t("inviteDialog.lastName")} *
              </Label>
              <Input
                id="invite-last-name"
                name="last_name"
                required
                placeholder={t("inviteDialog.lastNamePlaceholder")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-role">{t("inviteDialog.role")} *</Label>
            <Select
              value={role}
              onValueChange={(v) => {
                setRole(v as UserRole);
                if (v === "auditor" || v === "admin") setClientId("");
              }}
            >
              <SelectTrigger id="invite-role" aria-label={t("inviteDialog.role")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">
                  {t("rolesOption.admin")}
                </SelectItem>
                <SelectItem value="auditor">
                  {t("rolesOption.auditor")}
                </SelectItem>
                <SelectItem value="client_admin">
                  {t("rolesOption.client_admin")}
                </SelectItem>
                <SelectItem value="client">
                  {t("rolesOption.client")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {needsClient && (
            <div className="space-y-2">
              <Label htmlFor="invite-client">
                {t("inviteDialog.client")} *
              </Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger
                  id="invite-client"
                  aria-label={t("inviteDialog.client")}
                >
                  <SelectValue placeholder={t("inviteDialog.clientPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {clients.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      {t("inviteDialog.noClients")}
                    </div>
                  ) : (
                    clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleClose(false)}
              disabled={isPending}
            >
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Plus className="h-4 w-4" aria-hidden="true" />
              )}
              {t("inviteDialog.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EditRoleDialog({
  user,
  clients,
  open,
  onOpenChange,
  onSuccess,
}: {
  user: UserListItem | null;
  clients: ClientOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations("users");
  const tCommon = useTranslations("common");
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole>(user?.role ?? "client");
  const [clientId, setClientId] = useState<string>(user?.clientId ?? "");
  const [isPending, startTransition] = useTransition();

  const userKey = user?.id ?? "";
  const lastKey = useMemoLastKey(userKey, () => {
    setRole(user?.role ?? "client");
    setClientId(user?.clientId ?? "");
    setError(null);
  });
  void lastKey;

  if (!user) return null;
  // Les staff plateforme (admin/auditor) ne sont rattachés à aucun client.
  const needsClient = role !== "auditor" && role !== "admin";

  const handleClose = (next: boolean) => {
    if (!next) setError(null);
    onOpenChange(next);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (needsClient && !clientId) {
      setError(t("inviteDialog.clientRequired"));
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await updateUserRole(
        user.id,
        role,
        needsClient ? clientId : null,
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      toast.success(t("editRoleDialog.successAlert"));
      onOpenChange(false);
      onSuccess();
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("editRoleDialog.title")}</DialogTitle>
          <DialogDescription>{t("editRoleDialog.desc")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <FormError message={error} />}

          <div className="space-y-2">
            <Label>{t("inviteDialog.email")}</Label>
            <Input value={user.email} readOnly disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-role-role">{t("inviteDialog.role")} *</Label>
            <Select
              value={role}
              onValueChange={(v) => {
                setRole(v as UserRole);
                if (v === "auditor" || v === "admin") setClientId("");
              }}
            >
              <SelectTrigger
                id="edit-role-role"
                aria-label={t("inviteDialog.role")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">
                  {t("rolesOption.admin")}
                </SelectItem>
                <SelectItem value="auditor">
                  {t("rolesOption.auditor")}
                </SelectItem>
                <SelectItem value="client_admin">
                  {t("rolesOption.client_admin")}
                </SelectItem>
                <SelectItem value="client">
                  {t("rolesOption.client")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {needsClient && (
            <div className="space-y-2">
              <Label htmlFor="edit-role-client">
                {t("inviteDialog.client")} *
              </Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger
                  id="edit-role-client"
                  aria-label={t("inviteDialog.client")}
                >
                  <SelectValue placeholder={t("inviteDialog.clientPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {clients.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      {t("inviteDialog.noClients")}
                    </div>
                  ) : (
                    clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleClose(false)}
              disabled={isPending}
            >
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              {tCommon("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function useMemoLastKey(key: string, onChange: () => void) {
  const [last, setLast] = useState(key);
  if (last !== key) {
    setLast(key);
    onChange();
  }
  return last;
}
