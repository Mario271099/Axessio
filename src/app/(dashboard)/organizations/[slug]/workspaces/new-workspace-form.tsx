"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createWorkspace } from "./actions";

interface Props {
  organizationId: string;
}

export function NewWorkspaceForm({ organizationId }: Props) {
  const t = useTranslations("organizations.workspaces");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    const form = event.currentTarget;
    startTransition(async () => {
      const result = await createWorkspace(organizationId, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      form.reset();
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" aria-hidden="true" />
        {t("newCta")}
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("newTitle")}</CardTitle>
        <CardDescription>{t("newDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-2 text-sm text-destructive"
            >
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="name">{t("nameLabel")}</Label>
            <Input
              id="name"
              name="name"
              required
              maxLength={100}
              autoComplete="off"
              placeholder={t("namePlaceholder")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slug">{t("slugLabel")}</Label>
            <Input
              id="slug"
              name="slug"
              maxLength={50}
              autoComplete="off"
              pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
              placeholder={t("slugPlaceholder")}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">{t("slugHint")}</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">{t("descriptionLabel")}</Label>
            <Textarea
              id="description"
              name="description"
              rows={2}
              maxLength={300}
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setOpen(false);
                setError(null);
              }}
              disabled={pending}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={pending} className="gap-2">
              {pending && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              {t("create")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
