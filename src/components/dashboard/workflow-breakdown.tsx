import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Pencil, Eye, CheckCircle2, Send, Timer } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AuditWorkflowStatus } from "@/types/domain";

export interface WorkflowBreakdown {
  draft: number;
  in_review: number;
  validated: number;
  delivered: number;
}

interface WorkflowBreakdownCardProps {
  breakdown: WorkflowBreakdown;
  /** Temps moyen passé en `in_review`, en secondes. null = pas assez de data. */
  avgReviewSeconds: number | null;
}

const STATUS_ORDER: AuditWorkflowStatus[] = [
  "draft",
  "in_review",
  "validated",
  "delivered",
];

const STATUS_VISUAL: Record<
  AuditWorkflowStatus,
  { icon: React.ElementType; pill: string }
> = {
  draft: {
    icon: Pencil,
    pill: "bg-secondary text-secondary-foreground",
  },
  in_review: {
    icon: Eye,
    pill: "bg-primary/10 text-primary",
  },
  validated: {
    icon: CheckCircle2,
    pill: "bg-warning/10 text-warning",
  },
  delivered: {
    icon: Send,
    pill: "bg-success/10 text-success",
  },
};

function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h`;
  const days = Math.round(hours / 24);
  return `${days} j`;
}

export async function WorkflowBreakdownCard({
  breakdown,
  avgReviewSeconds,
}: WorkflowBreakdownCardProps) {
  const t = await getTranslations("dashboard.workflowBreakdown");
  const tStatus = await getTranslations("constants.workflowStatus");

  const total =
    breakdown.draft +
    breakdown.in_review +
    breakdown.validated +
    breakdown.delivered;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("title")}</CardTitle>
        <CardDescription>{t("subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {STATUS_ORDER.map((status) => {
            const count = breakdown[status];
            const visual = STATUS_VISUAL[status];
            const Icon = visual.icon;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <li key={status}>
                <Link
                  href={`/audits?workflow=${status}`}
                  className="group flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2 transition-colors hover:bg-accent/40"
                >
                  <div
                    aria-hidden="true"
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                      visual.pill,
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{tStatus(status)}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("share", { count, total, pct })}
                    </p>
                  </div>
                  <span className="text-lg font-semibold tabular-nums">
                    {count}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Mini KPI : temps moyen passé en in_review */}
        <div className="flex items-center justify-between rounded-md border border-dashed border-border px-3 py-2">
          <div className="flex items-center gap-2 text-sm">
            <Timer
              className="h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <span className="text-muted-foreground">{t("avgReviewLabel")}</span>
          </div>
          <span className="text-sm font-semibold tabular-nums">
            {avgReviewSeconds !== null
              ? formatDuration(avgReviewSeconds)
              : "—"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
