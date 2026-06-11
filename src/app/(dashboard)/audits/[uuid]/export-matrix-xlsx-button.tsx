"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportConformityMatrixXlsx } from "./export-matrix-actions";

interface Props {
  auditId: string;
  variant?: "default" | "outline";
  size?: "default" | "sm";
}

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

// Décode le base64 renvoyé par la server action en octets pour le Blob.
// Adossé explicitement à un ArrayBuffer (pas ArrayBufferLike) pour satisfaire
// le type BlobPart en TS strict.
function base64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function ExportMatrixXlsxButton({
  auditId,
  variant = "outline",
  size = "default",
}: Props) {
  const t = useTranslations("audits.report");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleExport() {
    setError(null);
    startTransition(async () => {
      const result = await exportConformityMatrixXlsx(auditId);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (!result.base64 || !result.filename) return;
      const blob = new Blob([base64ToBytes(result.base64)], {
        type: XLSX_MIME,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <div className="flex flex-col items-stretch gap-1">
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={handleExport}
        disabled={pending}
        aria-busy={pending}
        className="gap-2 rounded-full"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            {t("exportingXlsx")}
          </>
        ) : (
          <>
            <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
            {t("exportXlsx")}
          </>
        )}
      </Button>
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
