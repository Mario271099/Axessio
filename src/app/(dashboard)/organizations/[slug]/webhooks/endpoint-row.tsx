"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Copy, Loader2, Pause, Play, RefreshCw, Trash2, Webhook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  deleteWebhookEndpoint,
  rotateWebhookSecret,
  toggleWebhookEndpoint,
} from "./actions";

interface Props {
  organizationId: string;
  endpoint: {
    id: string;
    url: string;
    description: string | null;
    isActive: boolean;
    subscribedEvents: string[];
    consecutiveFailures: number;
    lastSuccessAt: string | null;
    lastFailureAt: string | null;
  };
}

export function EndpointRow({ organizationId, endpoint }: Props) {
  const t = useTranslations("organizations.webhooks");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);

  function handleToggle() {
    setError(null);
    startTransition(async () => {
      const result = await toggleWebhookEndpoint(
        organizationId,
        endpoint.id,
        !endpoint.isActive,
      );
      if (result.error) setError(result.error);
    });
  }

  function handleRotate() {
    setError(null);
    startTransition(async () => {
      const result = await rotateWebhookSecret(organizationId, endpoint.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.secret) setRevealedSecret(result.secret);
    });
  }

  function handleDelete() {
    if (!confirm(t("confirmDelete"))) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteWebhookEndpoint(organizationId, endpoint.id);
      if (result.error) setError(result.error);
    });
  }

  return (
    <Card className={cn("transition-all", !endpoint.isActive && "opacity-60")}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="flex min-w-0 items-start gap-3">
          <div
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
          >
            <Webhook className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="truncate font-mono text-sm">{endpoint.url}</span>
              {endpoint.isActive ? (
                <Badge variant="default" className="text-[10px]">
                  {t("active")}
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px]">
                  {t("paused")}
                </Badge>
              )}
              {endpoint.consecutiveFailures >= 3 && (
                <Badge variant="muted" className="text-[10px]">
                  {t("failing", { n: endpoint.consecutiveFailures })}
                </Badge>
              )}
            </CardTitle>
            {endpoint.description && (
              <CardDescription className="mt-1">
                {endpoint.description}
              </CardDescription>
            )}
            <div className="mt-2 flex flex-wrap gap-1">
              {endpoint.subscribedEvents.map((evt) => (
                <span
                  key={evt}
                  className="rounded bg-muted px-2 py-0.5 font-mono text-[10px]"
                >
                  {evt}
                </span>
              ))}
            </div>
            {error && (
              <p role="alert" className="mt-2 text-xs text-destructive">
                {error}
              </p>
            )}
            {revealedSecret && (
              <div className="mt-3 space-y-1">
                <p className="text-xs font-medium">{t("newSecretLabel")}</p>
                <div className="flex items-center gap-2 rounded-md border bg-muted px-3 py-2 font-mono text-xs break-all">
                  <span className="flex-1">{revealedSecret}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      navigator.clipboard.writeText(revealedSecret)
                    }
                    className="gap-1"
                  >
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    {t("copy")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleToggle}
            disabled={pending}
            aria-label={endpoint.isActive ? t("pauseCta") : t("resumeCta")}
            title={endpoint.isActive ? t("pauseCta") : t("resumeCta")}
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : endpoint.isActive ? (
              <Pause className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Play className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRotate}
            disabled={pending}
            aria-label={t("rotateCta")}
            title={t("rotateCta")}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={pending}
            aria-label={t("deleteCta")}
            title={t("deleteCta")}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-2 border-t pt-3 text-xs text-muted-foreground sm:grid-cols-2">
        <div>
          {t("lastSuccess")} :{" "}
          {endpoint.lastSuccessAt
            ? new Date(endpoint.lastSuccessAt).toLocaleString()
            : "—"}
        </div>
        <div>
          {t("lastFailure")} :{" "}
          {endpoint.lastFailureAt
            ? new Date(endpoint.lastFailureAt).toLocaleString()
            : "—"}
        </div>
      </CardContent>
    </Card>
  );
}
