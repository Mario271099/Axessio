"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Archive,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronRight,
  Loader2,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AuditStatusBadge } from "@/components/audit/audit-status-badge";
import { cn, formatDate, formatScore } from "@/lib/utils";
import { REFERENCE_TYPE_LABELS } from "@/lib/constants";
import type { AuditStatus, PlatformType, ReferenceType } from "@/types/domain";
import { bulkArchiveAudits, bulkDeleteAudits } from "./actions";

export type SortColumn = "updated_at" | "status" | "final_score";

export interface AuditTableRow {
  id: string;
  status: AuditStatus;
  platform: PlatformType;
  initial_score: number | null;
  final_score: number | null;
  updated_at: string;
  reference: { type: ReferenceType; version: string } | null;
  project: { name: string; client: { name: string } | null } | null;
}

interface AuditsTableProps {
  audits: AuditTableRow[];
  sortColumn: SortColumn;
  sortDir: "asc" | "desc";
  /** URLSearchParams.toString() pour préserver les autres filtres dans les liens. */
  baseParamsStr: string;
  canEditAudits: boolean;
  canDeleteAudits: boolean;
}

type FeedbackKind = "success" | "error";

export function AuditsTable({
  audits,
  sortColumn,
  sortDir,
  baseParamsStr,
  canEditAudits,
  canDeleteAudits,
}: AuditsTableProps) {
  const t = useTranslations("audits.list");
  const tPlatform = useTranslations("constants.platform");
  const tBulk = useTranslations("audits.list.bulk");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [feedback, setFeedback] = useState<{
    kind: FeedbackKind;
    message: string;
  } | null>(null);

  const allVisibleSelected =
    audits.length > 0 && audits.every((a) => selected.has(a.id));
  const someVisibleSelected =
    audits.some((a) => selected.has(a.id)) && !allVisibleSelected;
  const masterChecked: boolean | "indeterminate" = allVisibleSelected
    ? true
    : someVisibleSelected
      ? "indeterminate"
      : false;

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        for (const a of audits) next.delete(a.id);
      } else {
        for (const a of audits) next.add(a.id);
      }
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const ids = useMemo(() => Array.from(selected), [selected]);

  function buildSortHref(col: SortColumn): string {
    const params = new URLSearchParams(baseParamsStr);
    const isActive = col === sortColumn;
    const nextDir: "asc" | "desc" = isActive
      ? sortDir === "asc"
        ? "desc"
        : "asc"
      : "desc";
    if (col === "updated_at") params.delete("sort");
    else params.set("sort", col);
    if (nextDir === "desc") params.delete("dir");
    else params.set("dir", "asc");
    params.delete("page");
    const qs = params.toString();
    return qs ? `/audits?${qs}` : "/audits";
  }

  const handleBulkArchive = () => {
    if (ids.length === 0) return;
    setArchiveOpen(false);
    setFeedback(null);
    startTransition(async () => {
      const res = await bulkArchiveAudits(ids);
      if (res.error) {
        setFeedback({ kind: "error", message: res.error });
        return;
      }
      setFeedback({
        kind: "success",
        message: tBulk("successArchive", { count: res.count ?? ids.length }),
      });
      clearSelection();
      router.refresh();
    });
  };

  const handleBulkDelete = () => {
    if (ids.length === 0) return;
    setDeleteOpen(false);
    setFeedback(null);
    startTransition(async () => {
      const res = await bulkDeleteAudits(ids);
      if (res.error) {
        setFeedback({ kind: "error", message: res.error });
        return;
      }
      setFeedback({
        kind: "success",
        message: tBulk("successDelete", { count: res.count ?? ids.length }),
      });
      clearSelection();
      router.refresh();
    });
  };

  const canBulk = canEditAudits;
  const showSelectColumn = canBulk;

  return (
    <div className="space-y-3">
      {feedback && (
        <div
          role={feedback.kind === "error" ? "alert" : "status"}
          className={cn(
            "mx-4 mt-4 rounded-md border px-4 py-3 text-sm",
            feedback.kind === "error"
              ? "border-destructive/40 bg-destructive/5 text-destructive"
              : "border-success/40 bg-success/5 text-success",
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <span>{feedback.message}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="rounded p-1 hover:bg-foreground/10"
              aria-label={tBulk("dismiss")}
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <caption className="sr-only">{t("caption")}</caption>
          <thead className="border-b border-border bg-muted/40">
            <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              {showSelectColumn && (
                <th scope="col" className="w-10 px-4 py-2">
                  <Checkbox
                    checked={masterChecked}
                    onCheckedChange={toggleAllVisible}
                    aria-label={tBulk("selectAllAria")}
                  />
                </th>
              )}
              <th scope="col" className="px-4 py-2 font-medium">
                {t("columns.project")}
              </th>
              <th scope="col" className="px-4 py-2 font-medium">
                {t("columns.client")}
              </th>
              <th scope="col" className="px-4 py-2 font-medium">
                {t("columns.reference")}
              </th>
              <th scope="col" className="px-4 py-2 font-medium">
                {t("columns.platform")}
              </th>
              <th scope="col" className="px-4 py-2 font-medium">
                <SortHeader
                  href={buildSortHref("status")}
                  label={t("columns.status")}
                  active={sortColumn === "status"}
                  dir={sortDir}
                  sortLabel={t("sortBy", { column: t("columns.status") })}
                />
              </th>
              <th scope="col" className="px-4 py-2 font-medium tabular-nums">
                <SortHeader
                  href={buildSortHref("final_score")}
                  label={t("columns.score")}
                  active={sortColumn === "final_score"}
                  dir={sortDir}
                  sortLabel={t("sortBy", { column: t("columns.score") })}
                />
              </th>
              <th scope="col" className="px-4 py-2 font-medium">
                <SortHeader
                  href={buildSortHref("updated_at")}
                  label={t("columns.updated")}
                  active={sortColumn === "updated_at"}
                  dir={sortDir}
                  sortLabel={t("sortBy", { column: t("columns.updated") })}
                />
              </th>
              <th scope="col" className="px-4 py-2">
                <span className="sr-only">{t("columns.action")}</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {audits.map((a) => {
              const score = a.final_score ?? a.initial_score;
              const isSelected = selected.has(a.id);
              return (
                <tr
                  key={a.id}
                  className={cn(
                    "text-sm",
                    isSelected ? "bg-primary/5" : "hover:bg-accent/30",
                  )}
                >
                  {showSelectColumn && (
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleOne(a.id)}
                        aria-label={tBulk("selectRowAria", {
                          name: a.project?.name ?? "",
                        })}
                      />
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <Link
                      href={`/audits/${a.id}`}
                      className="font-medium hover:underline focus-visible:outline-none focus-visible:underline"
                    >
                      {a.project?.name ?? "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {a.project?.client?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {a.reference ? (
                      <span>
                        {REFERENCE_TYPE_LABELS[a.reference.type]}{" "}
                        <span className="text-muted-foreground">
                          {a.reference.version}
                        </span>
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {tPlatform(a.platform)}
                  </td>
                  <td className="px-4 py-3">
                    <AuditStatusBadge status={a.status} />
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {formatScore(score)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(a.updated_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/audits/${a.id}`}
                      aria-label={t("viewAudit", {
                        name: a.project?.name ?? "",
                      })}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Barre flottante d'actions en masse (bas de l'écran). */}
      {canBulk && selected.size > 0 && (
        <div
          role="region"
          aria-label={tBulk("applyAria")}
          className="fixed bottom-4 left-1/2 z-40 w-full max-w-2xl -translate-x-1/2 px-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-popover/95 px-4 py-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-popover/80">
            <div className="flex items-center gap-3">
              {isPending ? (
                <Loader2
                  className="h-4 w-4 animate-spin text-muted-foreground"
                  aria-hidden="true"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="flex h-7 min-w-7 items-center justify-center rounded-full bg-primary px-2 text-xs font-semibold text-primary-foreground tabular-nums"
                >
                  {selected.size}
                </span>
              )}
              <p className="text-sm font-medium">
                {tBulk("selected", { count: selected.size })}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setArchiveOpen(true)}
                disabled={isPending}
                className="gap-1.5"
              >
                <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                {tBulk("archive")}
              </Button>

              {canDeleteAudits && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteOpen(true)}
                  disabled={isPending}
                  className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {tBulk("delete")}
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                disabled={isPending}
              >
                {tBulk("cancel")}
              </Button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tCommon("confirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tBulk("archiveConfirm", { count: ids.length })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkArchive}>
              {tBulk("archive")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tCommon("confirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tBulk("deleteConfirm", { count: ids.length })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleBulkDelete}
            >
              {tCommon("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SortHeader — <th> cliquable, toggle de direction de tri.
// ---------------------------------------------------------------------------
function SortHeader({
  href,
  label,
  active,
  dir,
  sortLabel,
}: {
  href: string;
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  sortLabel: string;
}) {
  const Arrow = active ? (dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <Link
      href={href}
      aria-label={sortLabel}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        active ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {label}
      <Arrow
        className={cn("h-3 w-3", active ? "opacity-100" : "opacity-40")}
        aria-hidden="true"
      />
    </Link>
  );
}
