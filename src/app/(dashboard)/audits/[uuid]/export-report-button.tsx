"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ExportReportButtonProps {
  auditId: string;
  projectName: string;
  variant?: "default" | "outline";
  size?: "default" | "sm";
}

type ExportLang = "fr" | "en";

function slugify(value: string): string {
  return (
    value
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "audit"
  );
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ExportReportButton({
  auditId,
  projectName,
  variant = "default",
  size = "default",
}: ExportReportButtonProps) {
  const t = useTranslations("audits.report");
  const locale = useLocale();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentLang: ExportLang = locale === "en" ? "en" : "fr";

  const handleExport = async (lang: ExportLang) => {
    if (pending) return;
    setPending(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/audits/${auditId}/report?lang=${lang}`,
        { method: "GET" },
      );

      if (!response.ok) {
        let message = t("errorPrefix", { status: response.status });
        try {
          const data = (await response.json()) as { error?: string };
          if (data.error) message = data.error;
        } catch {
          // Non-JSON response - keep HTTP code
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `audit-${slugify(projectName)}-${todayIso()}-${lang}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("unknownError");
      setError(message);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col items-stretch gap-1">
      <div className="flex">
        <Button
          type="button"
          variant={variant}
          size={size}
          className="gap-2 rounded-r-none"
          onClick={() => handleExport(currentLang)}
          disabled={pending}
          aria-busy={pending}
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {t("generating")}
            </>
          ) : (
            <>
              <FileDown className="h-4 w-4" aria-hidden="true" />
              {currentLang === "en" ? t("exportPdfEn") : t("exportPdfFr")}
            </>
          )}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant={variant}
              size={size}
              className="rounded-l-none border-l border-l-primary-foreground/20 px-2"
              disabled={pending}
              aria-label={t("chooseLanguage")}
            >
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t("chooseLanguage")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => handleExport("fr")}>
              <FileDown className="h-4 w-4" aria-hidden="true" />
              {t("exportPdfFr")}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleExport("en")}>
              <FileDown className="h-4 w-4" aria-hidden="true" />
              {t("exportPdfEn")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-2 py-1 text-xs text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  );
}
