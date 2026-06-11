"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Table2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportConformityMatrixCsv } from "./export-matrix-actions";

interface Props {
  auditId: string;
  variant?: "default" | "outline";
  size?: "default" | "sm";
}

export function ExportMatrixButton({
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
      const result = await exportConformityMatrixCsv(auditId);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (!result.csv || !result.filename) return;
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8" });
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
            {t("exportingCsv")}
          </>
        ) : (
          <>
            <Table2 className="h-4 w-4" aria-hidden="true" />
            {t("exportCsv")}
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
