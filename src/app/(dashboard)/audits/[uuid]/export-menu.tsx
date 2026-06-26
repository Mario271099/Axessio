"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  Download,
  FileDown,
  FileSpreadsheet,
  Loader2,
  Table2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  exportConformityMatrixCsv,
  exportConformityMatrixXlsx,
} from "./export-matrix-actions";

interface ExportMenuProps {
  auditId: string;
  projectName: string;
  variant?: "default" | "outline";
  size?: "default" | "sm";
}

type ExportLang = "fr" | "en";

// Identifie l'action en cours pour n'afficher le spinner que sur la bonne ligne.
type ExportJob = "pdf-fr" | "pdf-en" | "csv" | "xlsx";

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

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

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

// Décode le base64 renvoyé par la server action XLSX en octets pour le Blob.
function base64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function ExportMenu({
  auditId,
  projectName,
  variant = "outline",
  size = "default",
}: ExportMenuProps) {
  const t = useTranslations("audits.report");
  const [job, setJob] = useState<ExportJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const pending = job !== null;

  async function exportPdf(lang: ExportLang) {
    setError(null);
    setJob(lang === "en" ? "pdf-en" : "pdf-fr");
    try {
      const response = await fetch(`/api/audits/${auditId}/report?lang=${lang}`, {
        method: "GET",
      });
      if (!response.ok) {
        let message = t("errorPrefix", { status: response.status });
        try {
          const data = (await response.json()) as { error?: string };
          if (data.error) message = data.error;
        } catch {
          // Réponse non-JSON : on garde le code HTTP.
        }
        throw new Error(message);
      }
      const blob = await response.blob();
      triggerDownload(
        blob,
        `audit-${slugify(projectName)}-${todayIso()}-${lang}.pdf`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : t("unknownError"));
    } finally {
      setJob(null);
    }
  }

  function exportCsv() {
    setError(null);
    setJob("csv");
    startTransition(async () => {
      try {
        const result = await exportConformityMatrixCsv(auditId);
        if (result.error) {
          setError(result.error);
          return;
        }
        if (!result.csv || !result.filename) return;
        triggerDownload(
          new Blob([result.csv], { type: "text/csv;charset=utf-8" }),
          result.filename,
        );
      } finally {
        setJob(null);
      }
    });
  }

  function exportXlsx() {
    setError(null);
    setJob("xlsx");
    startTransition(async () => {
      try {
        const result = await exportConformityMatrixXlsx(auditId);
        if (result.error) {
          setError(result.error);
          return;
        }
        if (!result.base64 || !result.filename) return;
        triggerDownload(
          new Blob([base64ToBytes(result.base64)], { type: XLSX_MIME }),
          result.filename,
        );
      } finally {
        setJob(null);
      }
    });
  }

  return (
    <div className="flex flex-col items-stretch gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant={variant}
            size={size}
            className="gap-2 rounded-full"
            disabled={pending}
            aria-busy={pending}
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="h-4 w-4" aria-hidden="true" />
            )}
            {t("exportMenu")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-56">
          <DropdownMenuLabel>{t("groupReport")}</DropdownMenuLabel>
          <DropdownMenuItem
            disabled={pending}
            onSelect={(e) => {
              e.preventDefault();
              void exportPdf("fr");
            }}
          >
            {job === "pdf-fr" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <FileDown className="h-4 w-4" aria-hidden="true" />
            )}
            {t("exportPdfFr")}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={pending}
            onSelect={(e) => {
              e.preventDefault();
              void exportPdf("en");
            }}
          >
            {job === "pdf-en" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <FileDown className="h-4 w-4" aria-hidden="true" />
            )}
            {t("exportPdfEn")}
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>{t("groupMatrix")}</DropdownMenuLabel>
          <DropdownMenuItem
            disabled={pending}
            onSelect={(e) => {
              e.preventDefault();
              exportCsv();
            }}
          >
            {job === "csv" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Table2 className="h-4 w-4" aria-hidden="true" />
            )}
            {t("exportCsv")}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={pending}
            onSelect={(e) => {
              e.preventDefault();
              exportXlsx();
            }}
          >
            {job === "xlsx" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
            )}
            {t("exportXlsx")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
