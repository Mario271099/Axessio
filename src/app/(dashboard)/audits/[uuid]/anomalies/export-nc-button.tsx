"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportNonConformitiesCsv } from "./export-actions";

interface Props {
  auditId: string;
}

export function ExportNcButton({ auditId }: Props) {
  const t = useTranslations("audits.anomalies");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleExport() {
    setError(null);
    startTransition(async () => {
      const result = await exportNonConformitiesCsv(auditId);
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
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleExport}
        disabled={pending}
        className="gap-2 rounded-full"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Download className="h-4 w-4" aria-hidden="true" />
        )}
        {t("exportCsv")}
      </Button>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
