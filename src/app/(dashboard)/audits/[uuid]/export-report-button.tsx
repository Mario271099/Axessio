"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExportReportButtonProps {
  auditId: string;
  projectName: string;
  /** Variante du bouton — utile pour discrétion dans une sous-page. */
  variant?: "default" | "outline";
  /** Taille du bouton. */
  size?: "default" | "sm";
}

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
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (pending) return;
    setPending(true);
    setError(null);

    try {
      const response = await fetch(`/api/audits/${auditId}/report`, {
        method: "GET",
      });

      if (!response.ok) {
        // L'API renvoie un JSON d'erreur sur le chemin d'échec.
        let message = `Erreur ${response.status}`;
        try {
          const data = (await response.json()) as { error?: string };
          if (data.error) message = data.error;
        } catch {
          // Réponse non-JSON — on garde le code HTTP
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `audit-${slugify(projectName)}-${todayIso()}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      // Libère la mémoire associée à l'Object URL après le déclenchement
      // (Safari a parfois besoin d'un tick avant de pouvoir révoquer).
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur inconnue lors de l'export.";
      setError(message);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col items-stretch gap-1">
      <Button
        type="button"
        variant={variant}
        size={size}
        className="gap-2"
        onClick={handleClick}
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Génération en cours…
          </>
        ) : (
          <>
            <FileDown className="h-4 w-4" aria-hidden="true" />
            Exporter le rapport PDF
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
