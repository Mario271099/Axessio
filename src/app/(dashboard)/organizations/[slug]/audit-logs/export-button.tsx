"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportAuditLogsCsv } from "./actions";

interface Props {
  organizationId: string;
  filters: {
    action?: string;
    actorId?: string;
    from?: string;
    to?: string;
  };
  disabled?: boolean;
  disabledReason?: string;
}

export function ExportButton({
  organizationId,
  filters,
  disabled,
  disabledReason,
}: Props) {
  const t = useTranslations("organizations.auditLogs");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleExport() {
    setError(null);
    startTransition(async () => {
      const result = await exportAuditLogsCsv(organizationId, filters);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (!result.csv || !result.filename) return;
      const blob = new Blob([result.csv], {
        type: "text/csv;charset=utf-8",
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
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleExport}
        disabled={disabled || pending}
        title={disabled ? disabledReason : undefined}
        className="gap-2"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Download className="h-4 w-4" aria-hidden="true" />
        )}
        {t("exportCta")}
      </Button>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
      {disabled && disabledReason && (
        <p className="text-xs text-muted-foreground">{disabledReason}</p>
      )}
    </div>
  );
}
