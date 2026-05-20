import { getTranslations } from "next-intl/server";
import {
  Pencil,
  Eye,
  CheckCircle2,
  Send,
  Activity,
  UserCircle2,
  MessagesSquare,
  AlertTriangle,
  UserPlus,
  UserMinus,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, cn } from "@/lib/utils";
import { AUDIT_WORKFLOW_LABELS } from "@/lib/constants";
import type { AuditWorkflowStatus } from "@/types/domain";

interface WorkflowTimelineProps {
  auditId: string;
  /** Limite d'entrées affichées (par défaut 20). */
  limit?: number;
}

type AuditLogRow = {
  id: string;
  action: string;
  actor_id: string | null;
  actor_role: string | null;
  payload: Record<string, unknown>;
  created_at: string;
};

type ProfileBrief = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
};

const TRANSITION_ICON: Record<AuditWorkflowStatus, React.ElementType> = {
  draft: Pencil,
  in_review: Eye,
  validated: CheckCircle2,
  delivered: Send,
};

function formatActor(profile: ProfileBrief | undefined): string {
  if (!profile) return "—";
  const name = [profile.first_name, profile.last_name]
    .filter((p) => p && p.trim().length > 0)
    .join(" ")
    .trim();
  return name || profile.email || "—";
}

export async function WorkflowTimeline({
  auditId,
  limit = 20,
}: WorkflowTimelineProps) {
  const supabase = await createClient();
  const t = await getTranslations("audits.workflow.timeline");

  const { data: logs } = await supabase
    .from("audit_logs")
    .select("id, action, actor_id, actor_role, payload, created_at")
    .eq("audit_id", auditId)
    .order("created_at", { ascending: false })
    .limit(limit);

  const rows = (logs ?? []) as AuditLogRow[];

  // Récupération en bulk des profils des acteurs (peu d'utilisateurs distincts).
  const actorIds = Array.from(
    new Set(rows.map((r) => r.actor_id).filter((v): v is string => Boolean(v))),
  );
  let actorMap = new Map<string, ProfileBrief>();
  if (actorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email")
      .in("id", actorIds);
    actorMap = new Map((profiles ?? []).map((p) => [p.id, p as ProfileBrief]));
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        {t("empty")}
      </div>
    );
  }

  return (
    <ol className="space-y-3" aria-label={t("ariaLabel")}>
      {rows.map((row) => {
        const actor = row.actor_id ? actorMap.get(row.actor_id) : undefined;
        const payload = row.payload ?? {};
        const isTransition = row.action === "workflow.transition";
        const isNote = row.action === "workflow.note";
        const isComment = row.action === "workflow.comment";
        const isRequestChanges = row.action === "workflow.request_changes";
        const isProofreaderAdded = row.action === "proofreader.assigned";
        const isProofreaderRemoved = row.action === "proofreader.removed";
        const to = (payload.to as AuditWorkflowStatus | undefined) ?? null;
        const from = (payload.from as AuditWorkflowStatus | undefined) ?? null;
        const reason = (payload.reason as string | undefined) ?? null;
        const body = (payload.body as string | undefined) ?? null;
        const Icon = isTransition && to
          ? TRANSITION_ICON[to]
          : isRequestChanges
            ? AlertTriangle
            : isComment
              ? MessagesSquare
              : isProofreaderAdded
                ? UserPlus
                : isProofreaderRemoved
                  ? UserMinus
                  : isNote
                    ? MessagesSquare
                    : Activity;

        return (
          <li
            key={row.id}
            className="relative flex gap-3 rounded-lg border border-border bg-card p-3"
          >
            <div
              aria-hidden="true"
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                isRequestChanges
                  ? "bg-destructive/10 text-destructive"
                  : isComment
                    ? "bg-primary/10 text-primary"
                    : isProofreaderAdded
                      ? "bg-warning/10 text-warning"
                      : isProofreaderRemoved
                        ? "bg-muted text-muted-foreground"
                        : to === "delivered"
                          ? "bg-success/10 text-success"
                          : to === "validated"
                            ? "bg-warning/10 text-warning"
                            : to === "in_review"
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-medium">
                  {isRequestChanges
                    ? t("requestChangesLabel")
                    : isComment
                      ? t("commentLabel")
                      : isProofreaderAdded
                        ? t("proofreaderAddedLabel")
                        : isProofreaderRemoved
                          ? t("proofreaderRemovedLabel")
                          : isTransition && from && to
                            ? t("transitionLabel", {
                                from: AUDIT_WORKFLOW_LABELS[from],
                                to: AUDIT_WORKFLOW_LABELS[to],
                              })
                            : isNote
                              ? t("noteLabel")
                              : row.action}
                </p>
                <time
                  dateTime={row.created_at}
                  className="text-xs text-muted-foreground tabular-nums"
                >
                  {formatDateTime(row.created_at)}
                </time>
              </div>
              <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                <UserCircle2 className="h-3 w-3" aria-hidden="true" />
                <span>{formatActor(actor)}</span>
                {row.actor_role && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">{row.actor_role}</span>
                  </>
                )}
              </div>
              {(body || reason) && (
                <p
                  className={cn(
                    "mt-1 whitespace-pre-wrap rounded-md px-3 py-2 text-sm",
                    isRequestChanges
                      ? "bg-destructive/10 text-destructive-foreground"
                      : "bg-muted/50",
                  )}
                >
                  {body ?? reason}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
