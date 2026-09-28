"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Archive,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  ChevronRight,
  Loader2,
  Trash2,
  X,
} from "lucide-react";
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
import { LifecycleSteps } from "@/components/ui/lifecycle-steps";
import { ScoreRing } from "@/components/ui/score-ring";
import {
  cn,
  formatDate,
  formatScore,
  monogram,
  themeColorVar,
} from "@/lib/utils";
import { REFERENCE_TYPE_LABELS } from "@/lib/constants";
import { computeAuditLifecycle } from "@/lib/audit-lifecycle";
import type { AuditStatus, PlatformType, ReferenceType } from "@/types/domain";
import { bulkArchiveAudits, bulkDeleteAudits } from "./actions";

export type SortColumn = "updated_at" | "status" | "final_score";

/** Affichage de la liste : tableau dense ou cartes. */
export type AuditsView = "list" | "cards";

export interface AuditTableRow {
  id: string;
  status: AuditStatus;
  platform: PlatformType;
  initial_score: number | null;
  final_score: number | null;
  updated_at: string;
  site_name: string | null;
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
  view: AuditsView;
}

type FeedbackKind = "success" | "error";

export function AuditsTable({
  audits,
  sortColumn,
  sortDir,
  baseParamsStr,
  canEditAudits,
  canDeleteAudits,
  view,
}: AuditsTableProps) {
  const t = useTranslations("audits.list");
  const tPlatform = useTranslations("constants.platform");
  const tBulk = useTranslations("audits.list.bulk");
  const tCommon = useTranslations("common");
  const tLifecycle = useTranslations("audits.lifecycle");
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
  // Les actions en masse s'appuient sur les cases à cocher du tableau : en
  // vue cartes, la sélection n'a pas de support visuel, on la neutralise.
  const showSelectColumn = canBulk && view === "list";

  /** Parcours dérivé du statut : les dates ne sont pas chargées ici. */
  const lifecycleOf = (status: AuditStatus) =>
    computeAuditLifecycle({
      status,
      createdAt: null,
      expectedStartAt: null,
      expectedEndAt: null,
      restitutionAt: null,
      counterAuditAt: null,
      deliveredAt: null,
      onlineAt: null,
    });

  const titleOf = (a: AuditTableRow) =>
    a.site_name?.trim() || a.project?.name || "—";
  const clientOf = (a: AuditTableRow) => a.project?.client?.name ?? "—";
  const referenceOf = (a: AuditTableRow) =>
    a.reference
      ? `${REFERENCE_TYPE_LABELS[a.reference.type]} ${a.reference.version}`
      : "—";

  return (
    <div className="space-y-3">
      {feedback && (
        <div
          role={feedback.kind === "error" ? "alert" : "status"}
          className={cn(
            "rounded-row border px-4 py-3 text-sm font-semibold",
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
              className="rounded-md p-1 hover:bg-foreground/10"
              aria-label={tBulk("dismiss")}
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {view === "cards" ? (
        <ul
          aria-label={t("caption")}
          className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3"
        >
          {audits.map((a) => {
            const score = a.final_score ?? a.initial_score;
            const lifecycle = lifecycleOf(a.status);
            const client = clientOf(a);
            return (
              <li key={a.id}>
                <Link
                  href={`/audits/${a.id}`}
                  className="axs-lift group flex h-full flex-col gap-3.5 rounded-card border border-border bg-card p-4"
                  style={
                    { "--lift-color": themeColorVar(client) } as React.CSSProperties
                  }
                >
                  <span className="flex items-start justify-between gap-3">
                    <span
                      aria-hidden="true"
                      className="axs-mono flex size-10 items-center justify-center rounded-row text-sm font-extrabold text-white"
                      style={{ background: themeColorVar(client) }}
                    >
                      {monogram(client)}
                    </span>
                    <span
                      aria-hidden="true"
                      className="flex size-[30px] items-center justify-center rounded-full bg-secondary text-foreground transition-transform duration-200 group-hover:-rotate-45"
                    >
                      <ArrowRight className="size-[15px]" />
                    </span>
                  </span>

                  <span className="min-w-0">
                    <span className="block truncate font-bold">
                      {titleOf(a)}
                    </span>
                    <span className="block truncate text-sm text-muted-foreground">
                      {client} · {referenceOf(a)}
                    </span>
                  </span>

                  <span className="mt-auto flex flex-col gap-2">
                    <span className="flex items-center justify-between gap-2">
                      <AuditStatusBadge status={a.status} />
                      <span className="text-sm text-muted-foreground">
                        {formatDate(a.updated_at)}
                      </span>
                    </span>
                    <LifecycleSteps
                      currentStep={lifecycle.currentStep}
                      totalSteps={lifecycle.totalSteps}
                      label={tLifecycle("stepIndicator", {
                        step: lifecycle.currentStep,
                        total: lifecycle.totalSteps,
                      })}
                    />
                  </span>

                  <span className="flex items-center gap-2.5 border-t border-border pt-3">
                    <ScoreRing value={score} size={34} hideValue ariaLabel="" />
                    <span className="text-lg font-black tabular">
                      {formatScore(score)}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <caption className="sr-only">{t("caption")}</caption>
            <thead className="border-b border-border">
              <tr className="text-left text-xs font-bold text-muted-foreground">
                {showSelectColumn && (
                  <th scope="col" className="w-10 px-3 py-2">
                    <Checkbox
                      checked={masterChecked}
                      onCheckedChange={toggleAllVisible}
                      aria-label={tBulk("selectAllAria")}
                    />
                  </th>
                )}
                <th scope="col" className="px-3 py-2">
                  {t("columns.project")}
                </th>
                <th scope="col" className="px-3 py-2">
                  {t("columns.reference")}
                </th>
                <th scope="col" className="px-3 py-2">
                  <SortHeader
                    href={buildSortHref("status")}
                    label={t("columns.status")}
                    active={sortColumn === "status"}
                    dir={sortDir}
                    sortLabel={t("sortBy", { column: t("columns.status") })}
                  />
                </th>
                <th scope="col" className="px-3 py-2">
                  <SortHeader
                    href={buildSortHref("final_score")}
                    label={t("columns.score")}
                    active={sortColumn === "final_score"}
                    dir={sortDir}
                    sortLabel={t("sortBy", { column: t("columns.score") })}
                  />
                </th>
                <th scope="col" className="px-3 py-2">
                  <SortHeader
                    href={buildSortHref("updated_at")}
                    label={t("columns.updated")}
                    active={sortColumn === "updated_at"}
                    dir={sortDir}
                    sortLabel={t("sortBy", { column: t("columns.updated") })}
                  />
                </th>
                <th scope="col" className="px-3 py-2">
                  <span className="sr-only">{t("columns.action")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {audits.map((a) => {
                const score = a.final_score ?? a.initial_score;
                const isSelected = selected.has(a.id);
                const lifecycle = lifecycleOf(a.status);
                const client = clientOf(a);
                return (
                  <tr
                    key={a.id}
                    className={cn(
                      "group border-b border-border last:border-0",
                      isSelected ? "bg-primary-soft" : "axs-row",
                    )}
                  >
                    {showSelectColumn && (
                      <td className="px-3 py-2.5">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleOne(a.id)}
                          aria-label={tBulk("selectRowAria", {
                            name: a.project?.name ?? "",
                          })}
                        />
                      </td>
                    )}
                    <td className="px-3 py-2.5">
                      <Link
                        href={`/audits/${a.id}`}
                        className="flex min-w-0 items-center gap-3"
                      >
                        <span
                          aria-hidden="true"
                          className="axs-mono flex size-10 shrink-0 items-center justify-center rounded-row text-sm font-extrabold text-white"
                          style={{ background: themeColorVar(client) }}
                        >
                          {monogram(client)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-bold">
                            {titleOf(a)}
                          </span>
                          <span className="block truncate text-sm text-muted-foreground">
                            {client}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="block text-sm font-semibold">
                        {referenceOf(a)}
                      </span>
                      <span className="block text-sm text-muted-foreground">
                        {tPlatform(a.platform)}
                      </span>
                    </td>
                    <td className="w-40 px-3 py-2.5">
                      <AuditStatusBadge status={a.status} />
                      <LifecycleSteps
                        currentStep={lifecycle.currentStep}
                        totalSteps={lifecycle.totalSteps}
                        label={tLifecycle("stepIndicator", {
                          step: lifecycle.currentStep,
                          total: lifecycle.totalSteps,
                        })}
                        className="mt-1.5"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="flex items-center gap-2">
                        <ScoreRing
                          value={score}
                          size={34}
                          hideValue
                          ariaLabel=""
                        />
                        <span className="font-bold tabular">
                          {formatScore(score)}
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-sm text-muted-foreground">
                      {formatDate(a.updated_at)}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <Link
                        href={`/audits/${a.id}`}
                        aria-label={t("viewAudit", {
                          name: a.project?.name ?? "",
                        })}
                        className="inline-flex size-9 items-center justify-center rounded-lg text-primary opacity-0 transition-opacity duration-150 focus-visible:opacity-100 group-hover:opacity-100"
                      >
                        <ChevronRight className="size-[18px]" aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Barre flottante d'actions en masse (bas de l'écran). */}
      {showSelectColumn && selected.size > 0 && (
        <div
          role="region"
          aria-label={tBulk("applyAria")}
          className="fixed bottom-4 left-1/2 z-40 w-full max-w-2xl -translate-x-1/2 px-4"
        >
          <div className="axs-bulk flex flex-wrap items-center justify-between gap-3 rounded-[14px] bg-ink px-4 py-2.5 text-ink-foreground shadow-float">
            <div className="flex items-center gap-3">
              {isPending ? (
                <Loader2
                  className="size-4 animate-spin text-ink-muted"
                  aria-hidden="true"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="flex h-7 min-w-7 items-center justify-center rounded-full bg-primary px-2 text-xs font-extrabold tabular text-primary-foreground"
                >
                  {selected.size}
                </span>
              )}
              <p className="text-sm font-bold">
                {tBulk("selected", { count: selected.size })}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <BulkButton
                onClick={() => setArchiveOpen(true)}
                disabled={isPending}
              >
                <Archive className="size-3.5" aria-hidden="true" />
                {tBulk("archive")}
              </BulkButton>

              {canDeleteAudits && (
                <BulkButton
                  onClick={() => setDeleteOpen(true)}
                  disabled={isPending}
                  tone="destructive"
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                  {tBulk("delete")}
                </BulkButton>
              )}

              <BulkButton onClick={clearSelection} disabled={isPending}>
                {tBulk("cancel")}
              </BulkButton>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader
            icon={<Archive aria-hidden="true" />}
            tone="warning"
          >
            <AlertDialogTitle>{tCommon("confirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tBulk("archiveConfirm", { count: ids.length })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction variant="dark" onClick={handleBulkArchive}>
              {tBulk("archive")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader icon={<Trash2 aria-hidden="true" />}>
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
// Bouton de la barre d'actions en masse (sur fond encre).
// ---------------------------------------------------------------------------
function BulkButton({
  onClick,
  disabled,
  tone = "default",
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  tone?: "default" | "destructive";
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3.5 text-sm font-bold",
        "transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50",
        tone === "destructive"
          ? "border-transparent text-destructive hover:bg-destructive/15"
          : "border-ink-raised text-ink-foreground hover:bg-ink-raised",
      )}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// SortHeader - <th> cliquable, toggle de direction de tri.
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
        "inline-flex items-center gap-1.5 rounded-md transition-colors hover:text-foreground",
        active ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {label}
      <Arrow
        className={cn("size-3", active ? "opacity-100" : "opacity-40")}
        aria-hidden="true"
      />
    </Link>
  );
}
