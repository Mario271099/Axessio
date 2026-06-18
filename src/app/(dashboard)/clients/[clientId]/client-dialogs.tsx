"use client";

// Dialogues de la page client : édition du client, création et édition de
// projet. Extraits de client-detail.tsx (découpage des gros composants) -
// markup et comportement inchangés.

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Loader2 } from "lucide-react";
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
import { createProject, updateClient, updateProject } from "../actions";
import type { ClientData, ProjectItem } from "./client-detail-types";

export function FormError({ message }: { message: string }) {
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

export function EditClientDialog({
  client,
  open,
  onOpenChange,
  onSuccess,
}: {
  client: ClientData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations("clientDetail");
  const tClients = useTranslations("clients");
  const tCommon = useTranslations("common");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleClose = (next: boolean) => {
    if (!next) setError(null);
    onOpenChange(next);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = formData.get("name")?.toString().trim();
    if (!name) {
      setError(t("editClient.nameRequired"));
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await updateClient(client.id, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      onOpenChange(false);
      onSuccess();
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("editClient.title")}</DialogTitle>
          <DialogDescription>{t("editClient.desc")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <FormError message={error} />}

          <div className="space-y-2">
            <Label htmlFor="edit-client-name">{tClients("dialog.name")} *</Label>
            <Input
              id="edit-client-name"
              name="name"
              required
              autoFocus
              defaultValue={client.name}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-client-website">
              {tClients("dialog.website")}
            </Label>
            <Input
              id="edit-client-website"
              name="website"
              type="url"
              defaultValue={client.website ?? ""}
              placeholder={tClients("dialog.websitePlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-client-contact-name">
              {tClients("dialog.contactName")}
            </Label>
            <Input
              id="edit-client-contact-name"
              name="contact_name"
              defaultValue={client.contactName ?? ""}
              placeholder={tClients("dialog.contactNamePlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-client-contact-email">
              {tClients("dialog.contactEmail")}
            </Label>
            <Input
              id="edit-client-contact-email"
              name="contact_email"
              type="email"
              defaultValue={client.contactEmail ?? ""}
              placeholder={tClients("dialog.contactEmailPlaceholder")}
            />
          </div>

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

export function CreateProjectDialog({
  clientId,
  open,
  onOpenChange,
  onSuccess,
}: {
  clientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations("clientDetail");
  const tCommon = useTranslations("common");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleClose = (next: boolean) => {
    if (!next) setError(null);
    onOpenChange(next);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = formData.get("name")?.toString().trim();
    if (!name) {
      setError(t("createProject.nameRequired"));
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await createProject(clientId, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      form.reset();
      onOpenChange(false);
      onSuccess();
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("createProject.title")}</DialogTitle>
          <DialogDescription>{t("createProject.desc")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <FormError message={error} />}

          <div className="space-y-2">
            <Label htmlFor="create-project-name">
              {t("createProject.name")} *
            </Label>
            <Input
              id="create-project-name"
              name="name"
              required
              autoFocus
              placeholder={t("createProject.namePlaceholder")}
            />
            <p className="text-xs text-muted-foreground">
              {t("createProject.urlMovedToAudit")}
            </p>
          </div>

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
              {t("createProject.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EditProjectDialog({
  project,
  clientId,
  open,
  onOpenChange,
  onSuccess,
}: {
  project: ProjectItem | null;
  clientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations("clientDetail");
  const tCommon = useTranslations("common");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleClose = (next: boolean) => {
    if (!next) setError(null);
    onOpenChange(next);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!project) return;
    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = formData.get("name")?.toString().trim();
    if (!name) {
      setError(t("createProject.nameRequired"));
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await updateProject(project.id, clientId, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      onOpenChange(false);
      onSuccess();
    });
  };

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("editProject.title")}</DialogTitle>
          <DialogDescription>{t("editProject.desc")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <FormError message={error} />}

          <div className="space-y-2">
            <Label htmlFor="edit-project-name">
              {t("createProject.name")} *
            </Label>
            <Input
              id="edit-project-name"
              name="name"
              required
              autoFocus
              defaultValue={project.name}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-project-url">{t("createProject.url")}</Label>
            <Input
              id="edit-project-url"
              name="url"
              type="url"
              defaultValue={project.url ?? ""}
              placeholder={t("createProject.urlPlaceholder")}
            />
          </div>

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
