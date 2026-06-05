"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Copy, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { WebhookEventType } from "@/lib/webhooks/server";
import { createWebhookEndpoint } from "./actions";

interface Props {
  organizationId: string;
  events: ReadonlyArray<WebhookEventType>;
}

export function NewEndpointForm({ organizationId, events }: Props) {
  const t = useTranslations("organizations.webhooks");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [newSecret, setNewSecret] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await createWebhookEndpoint(organizationId, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.secret) {
        setNewSecret(result.secret);
      } else {
        setOpen(false);
      }
    });
  }

  if (newSecret) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("secretRevealTitle")}</CardTitle>
          <CardDescription>{t("secretRevealDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 rounded-md border bg-muted px-3 py-2 font-mono text-xs break-all">
            <span className="flex-1">{newSecret}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigator.clipboard.writeText(newSecret)}
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
                setNewSecret(null);
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
            <Label htmlFor="url">{t("urlLabel")}</Label>
            <Input
              id="url"
              name="url"
              type="url"
              required
              placeholder="https://example.com/axessyo-webhook"
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">{t("urlHint")}</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">{t("descriptionLabel")}</Label>
            <Textarea id="description" name="description" rows={2} maxLength={200} />
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">{t("eventsLabel")}</legend>
            <p className="text-xs text-muted-foreground">{t("eventsHint")}</p>
            <div className="grid gap-2">
              {events.map((evt) => (
                <label
                  key={evt}
                  className="flex items-start gap-3 rounded-md border bg-card p-3"
                >
                  <Checkbox name="events" value={evt} className="mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-mono text-xs">{evt}</p>
                    <p className="text-xs text-muted-foreground">
                      {t(`event.${evt.replace(".", "_")}`)}
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
