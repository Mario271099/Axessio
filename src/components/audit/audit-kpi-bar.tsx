import { FileSearch, ListChecks, ClipboardCheck, AlertOctagon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";

interface AuditKpiBarProps {
  sampleCount: number;
  matrixFilled: number;
  matrixTotal: number;
  openNcCount: number;
  criticalNcCount: number;
}

/**
 * Bandeau de 4 KPIs au format compact, alignés horizontalement. À lire en
 * un coup d'œil pour comprendre la santé opérationnelle de l'audit (taille
 * échantillon, complétion matrice, charge NC).
 */
export async function AuditKpiBar({
  sampleCount,
  matrixFilled,
  matrixTotal,
  openNcCount,
  criticalNcCount,
}: AuditKpiBarProps) {
  const t = await getTranslations("audits.kpiBar");
  const matrixPct =
    matrixTotal > 0 ? Math.round((matrixFilled / matrixTotal) * 100) : 0;

  const items: Array<{
    icon: React.ElementType;
    label: string;
    value: string;
    sublabel?: string;
    tone: "primary" | "success" | "warning" | "destructive";
  }> = [
    {
      icon: FileSearch,
      label: t("sample"),
      value: sampleCount.toString(),
      tone: "primary",
    },
    {
      icon: ClipboardCheck,
      label: t("matrix"),
      value: `${matrixPct}%`,
      sublabel: `${matrixFilled} / ${matrixTotal}`,
      tone: matrixPct >= 100 ? "success" : matrixPct >= 50 ? "warning" : "primary",
    },
    {
      icon: ListChecks,
      label: t("openNc"),
      value: openNcCount.toString(),
      tone: openNcCount > 0 ? "warning" : "success",
    },
    {
      icon: AlertOctagon,
      label: t("criticalNc"),
      value: criticalNcCount.toString(),
      tone: criticalNcCount > 0 ? "destructive" : "success",
    },
  ];

  const toneClasses = {
    primary: { bg: "bg-primary/10", text: "text-primary" },
    success: { bg: "bg-success/10", text: "text-success" },
    warning: { bg: "bg-warning/10", text: "text-warning" },
    destructive: { bg: "bg-destructive/10", text: "text-destructive" },
  } as const;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => {
        const styles = toneClasses[item.tone];
        return (
          <div
            key={item.label}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
          >
            <div
              aria-hidden="true"
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
                styles.bg,
                styles.text,
              )}
            >
              <item.icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground leading-tight">
                {item.label}
              </p>
              <p className="flex items-baseline gap-1.5 text-xl font-bold leading-tight tabular-nums">
                {item.value}
                {item.sublabel && (
                  <span className="text-[10px] font-normal text-muted-foreground">
                    {item.sublabel}
                  </span>
                )}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
