"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Key, Loader2, XCircle } from "lucide-react";
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
import { revokeApiToken } from "./actions";

interface Props {
  organizationId: string;
  token: {
    id: string;
    name: string;
    prefix: string;
    scopes: string[];
    lastUsedAt: string | null;
    expiresAt: string | null;
    revokedAt: string | null;
    createdAt: string;
  };
}

export function TokenRow({ organizationId, token }: Props) {
  const t = useTranslations("organizations.apiTokens");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isRevoked = Boolean(token.revokedAt);
  const isExpired =
    !isRevoked && token.expiresAt && new Date(token.expiresAt) < new Date();

  function handleRevoke() {
    if (!confirm(t("confirmRevoke"))) return;
    setError(null);
    startTransition(async () => {
      const result = await revokeApiToken(organizationId, token.id);
      if (result.error) setError(result.error);
    });
  }

  return (
    <Card className={cn("transition-all", (isRevoked || isExpired) && "opacity-60")}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="flex min-w-0 items-start gap-3">
          <div
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
          >
            <Key className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <CardTitle className="flex flex-wrap items-center gap-2 text-base">
              {token.name}
              {isRevoked && (
                <Badge variant="secondary" className="text-[10px]">
                  {t("revoked")}
                </Badge>
              )}
              {isExpired && (
                <Badge variant="muted" className="text-[10px]">
                  {t("expired")}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1 font-mono text-xs">
              {token.prefix}…
            </CardDescription>
            <div className="mt-2 flex flex-wrap gap-1">
              {token.scopes.map((scope) => (
                <span
                  key={scope}
                  className="rounded bg-muted px-2 py-0.5 font-mono text-[10px]"
                >
                  {scope}
                </span>
              ))}
            </div>
            {error && (
              <p role="alert" className="mt-2 text-xs text-destructive">
                {error}
              </p>
            )}
          </div>
        </div>
        {!isRevoked && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRevoke}
            disabled={pending}
            className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <XCircle className="h-4 w-4" aria-hidden="true" />
            )}
            {t("revokeCta")}
          </Button>
        )}
      </CardHeader>
      <CardContent className="grid gap-2 border-t pt-3 text-xs text-muted-foreground sm:grid-cols-3">
        <div>
          {t("createdAt")} : {new Date(token.createdAt).toLocaleDateString()}
        </div>
        <div>
          {t("lastUsed")} :{" "}
          {token.lastUsedAt
            ? new Date(token.lastUsedAt).toLocaleDateString()
            : t("never")}
        </div>
        <div>
          {t("expiresAt")} :{" "}
          {token.expiresAt
            ? new Date(token.expiresAt).toLocaleDateString()
            : t("never")}
        </div>
      </CardContent>
    </Card>
  );
}
