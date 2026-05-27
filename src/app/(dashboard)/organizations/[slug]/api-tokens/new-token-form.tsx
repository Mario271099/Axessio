"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Copy, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ApiScope } from "@/lib/api-tokens/server";
import { createApiToken } from "./actions";

interface Props {
  organizationId: string;
  scopes: ReadonlyArray<ApiScope>;
}

export function NewTokenForm({ organizationId, scopes }: Props) {
  const t = useTranslations("organizations.apiTokens");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await createApiToken(organizationId, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.plaintext) setRevealed(result.plaintext);
    });
  }

  if (revealed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("revealTitle")}</CardTitle>
          <CardDescription>{t("revealDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 rounded-md border bg-muted px-3 py-2 font-mono text-xs break-all">
            <span className="flex-1">{revealed}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigator.clipboard.writeText(revealed)}
              className="gap-1"
            >
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              {t("copy")}
            </Button>
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={() => {
                setRevealed(null);
                setOpen(false);
              }}
            >
              {t("close")}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
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
              placeholder={t("namePlaceholder")}
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">{t("nameHint")}</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="expiresInDays">{t("expiresLabel")}</Label>
            <select
              id="expiresInDays"
              name="expiresInDays"
              defaultValue="90"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
            >
              <option value="30">{t("expires.30")}</option>
              <option value="90">{t("expires.90")}</option>
              <option value="365">{t("expires.365")}</option>
              <option value="0">{t("expires.never")}</option>
            </select>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">{t("scopesLabel")}</legend>
            <p className="text-xs text-muted-foreground">{t("scopesHint")}</p>
            <div className="grid gap-2">
              {scopes.map((scope) => (
                <label
                  key={scope}
                  className="flex items-start gap-3 rounded-md border bg-card p-3"
                >
                  <Checkbox name="scopes" value={scope} className="mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-mono text-xs">{scope}</p>
                    <p className="text-xs text-muted-foreground">
                      {t(`scope.${scope.replace(":", "_")}`)}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </fieldset>

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
