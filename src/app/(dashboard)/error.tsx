"use client";

// Error boundary du segment (dashboard) : rendu DANS le layout - la sidebar
// et la topbar restent utilisables, contrairement à global-error.tsx qui
// remplace la page entière. Capture Sentry + retry local via reset().
// Pas de <main> ici : le layout du dashboard en fournit déjà un.

import { useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errorBoundary");

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div role="alert" className="max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button type="button" onClick={reset}>
            {t("retry")}
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">{t("backToDashboard")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
