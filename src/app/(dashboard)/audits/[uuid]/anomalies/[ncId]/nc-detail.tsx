"use client";

// Page de détail d'une NC - composant d'orchestration. Les trois blocs
// autonomes vivent dans leurs propres fichiers :
//   - nc-details-card.tsx     (lecture + édition des champs)
//   - nc-attachments-card.tsx (captures d'écran)
//   - nc-discussion.tsx       (fils client/review)
// Ici : navigation prev/next, header (statut + relecture), critère lié,
// méthodologie, et la composition des sous-composants.

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusDot } from "@/components/ui/status-dot";
import { SeverityBadge } from "@/components/audit/severity-badge";
import { cn, themeColorForIdentifier } from "@/lib/utils";
import { canAny, canChat, type Permission } from "@/lib/permissions";
import type { NCStatus, UserRole } from "@/types/domain";
import { NCReviewBadge } from "@/components/audit/nc-review-badge";
import { NCReviewActions } from "@/components/audit/nc-review-actions";
import { updateNCStatus } from "./actions";
import { NCDetailsCard } from "./nc-details-card";
import { NCAttachmentsCard } from "./nc-attachments-card";
import { NCCriterionAnnex } from "./nc-criterion-annex";
import { NCDiscussion } from "./nc-discussion";
import type {
  AttachmentData,
  MessageData,
  NCData,
  NCSibling,
  PageData,
} from "./nc-detail-types";

// Ré-export pour les consommateurs existants (page.tsx importe NCData ici).
export type { MessageData, NCData, NCSibling } from "./nc-detail-types";

const NC_STATUS_COLOR: Record<string, string> = {
  TO_FIX: "hsl(var(--destructive))",
  IN_PROGRESS: "hsl(var(--primary))",
  FIXED: "hsl(var(--success))",
};

const NEW_STATUSES = ["TO_FIX", "IN_PROGRESS", "FIXED"] as const;

type NewStatus = (typeof NEW_STATUSES)[number];

export interface NCDetailProps {
  nc: NCData;
  pages: PageData[];
  /** Messages tous fils confondus - séparés côté composant via `thread`. */
  messages: MessageData[];
  attachments: AttachmentData[];
  auditId: string;
  auditTitle: string;
  profile: { role: UserRole; id: string };
  /** Permissions atomiques effectives sur l'org active (rendu conditionnel). */
  orgPermissions?: Permission[];
  /**
   * Rôle d'assignment de l'utilisateur sur l'audit parent (auditor /
   * proofreader / admin / none). Utilisé pour afficher les bons boutons
   * d'action de relecture et l'accès au fil 'review'.
   */
  userAssignmentRole: "auditor" | "proofreader" | "admin" | "none";
  /** NC précédente dans l'audit (ordre display_number). null si première. */
  prevNC: NCSibling | null;
  /** NC suivante dans l'audit. null si dernière. */
  nextNC: NCSibling | null;
}

export function NCDetail({
  nc,
  pages,
  messages,
  attachments,
  auditId,
  profile,
  orgPermissions,
  userAssignmentRole,
  prevNC,
  nextNC,
}: NCDetailProps) {
  const router = useRouter();
  const orgPerms = new Set(orgPermissions ?? []);
  const t = useTranslations("audits.ncDetail");
  const tNcStatus = useTranslations("constants.ncStatus");
  const tAnomalies = useTranslations("audits.anomalies");
  // « isAuditor » historique = peut modifier la NC (titre, sévérité, statut).
  const isAuditor = canAny(profile.role, orgPerms, "nc.edit");

  const [status, setStatus] = useState<string>(nc.status);
  // L'annexe est repliée par défaut ; le lien « voir l'annexe » de l'en-tête
  // la déplie en même temps qu'il y amène.
  const [annexOpen, setAnnexOpen] = useState(false);
  const [statusPending, startStatusTransition] = useTransition();
  const [statusError, setStatusError] = useState<string | null>(null);

  const canAccessReviewThread =
    userAssignmentRole === "auditor" ||
    userAssignmentRole === "proofreader" ||
    userAssignmentRole === "admin";

  // Le chat client est ouvert à tous les rôles ayant chat.read.
  const canDiscuss = canChat(profile.role);

  // Upload de captures : tous les rôles avec accès au chat (cohérent avec
  // l'ouverture remédiation/discussion à tout le monde).
  const canUpload = canChat(profile.role);

  const handleStatusChange = (next: string) => {
    const previous = status;
    setStatus(next);
    setStatusError(null);
    startStatusTransition(async () => {
      const result = await updateNCStatus(nc.id, auditId, next as NCStatus);
      if (result.error) {
        setStatusError(result.error);
        setStatus(previous);
        return;
      }
      router.refresh();
    });
  };

  const isLegacyStatus = !NEW_STATUSES.includes(status as NewStatus);
  const statusOptions: string[] = isLegacyStatus
    ? [status, ...NEW_STATUSES]
    : [...NEW_STATUSES];

  // La pastille du critère porte la couleur de sa thématique (« 11.1 » → 11).
  const criterionColor = nc.criterion
    ? themeColorForIdentifier(nc.criterion.identifier.split(".")[0] ?? "")
    : "hsl(var(--muted-foreground))";

  return (
    <div className="container mx-auto max-w-7xl space-y-4 p-4 md:p-6 lg:px-9">
      {/* Navigation entre NC : retour liste + précédente / suivante ------- */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/audits/${auditId}/anomalies`}
          className="inline-flex items-center gap-1.5 rounded-lg text-sm font-bold text-muted-foreground transition-colors hover:text-primary"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          {tAnomalies("breadcrumb")}
        </Link>

        <div className="flex items-center gap-2">
          <Button
            asChild={!!prevNC}
            variant="outline"
            size="sm"
            disabled={!prevNC}
            aria-label={
              prevNC
                ? t("prevAria", { num: prevNC.displayNumber })
                : t("prevDisabled")
            }
          >
            {prevNC ? (
              <Link href={`/audits/${auditId}/anomalies/${prevNC.id}`}>
                <ChevronLeft aria-hidden="true" />
                <span className="tabular">
                  {t("prev", {
                    num: String(prevNC.displayNumber).padStart(3, "0"),
                  })}
                </span>
              </Link>
            ) : (
              <span>
                <ChevronLeft aria-hidden="true" />
                {t("prevDisabled")}
              </span>
            )}
          </Button>
          <Button
            asChild={!!nextNC}
            variant="outline"
            size="sm"
            disabled={!nextNC}
            aria-label={
              nextNC
                ? t("nextAria", { num: nextNC.displayNumber })
                : t("nextDisabled")
            }
          >
            {nextNC ? (
              <Link href={`/audits/${auditId}/anomalies/${nextNC.id}`}>
                <span className="tabular">
                  {t("next", {
                    num: String(nextNC.displayNumber).padStart(3, "0"),
                  })}
                </span>
                <ChevronRight aria-hidden="true" />
              </Link>
            ) : (
              <span>
                {t("nextDisabled")}
                <ChevronRight aria-hidden="true" />
              </span>
            )}
          </Button>
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_330px]">
        {/* Colonne principale : constat, captures, echanges, annexe ------- */}
        <div className="flex min-w-0 flex-col gap-4">
          {/* En-tête de la NC : identité en pastilles, puis le titre ------ */}
          <header>
            <div className="flex flex-wrap items-center gap-2">
              {nc.displayNumber > 0 && (
                <span className="text-sm font-extrabold tabular text-muted-foreground">
                  NC #{String(nc.displayNumber).padStart(3, "0")}
                </span>
              )}
              <SeverityBadge severity={nc.severity} />
              <NCReviewBadge status={nc.reviewStatus} hideWhenNotRequested />
              <Badge variant="secondary" size="sm">
                {nc.page
                  ? t("page") + " " + nc.page.name
                  : t("transversalShort")}
              </Badge>
              {nc.criterion && (
                // Renvoie vers l'annexe en bas de page, ou le critere est
                // detaille : ici on ne garde que son numero.
                <a
                  href="#nc-annex"
                  onClick={() => setAnnexOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-[0.8rem] font-bold text-secondary-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <span
                    aria-hidden="true"
                    className="size-2 rounded-full"
                    style={{ background: criterionColor }}
                  />
                  {t("criterionAnnexLink", {
                    identifier: nc.criterion.identifier,
                  })}
                </a>
              )}
            </div>

            <h1 className="mt-2.5 text-2xl font-black leading-[1.12] tracking-[-0.035em] md:text-[2rem]">
              {nc.title}
            </h1>

            <NCReviewActions
              ncId={nc.id}
              reviewStatus={nc.reviewStatus}
              userRole={userAssignmentRole}
            />
          </header>

          {/* 1. Détails de la non-conformité ------------------------------ */}
          <NCDetailsCard
            nc={nc}
            pages={pages}
            auditId={auditId}
            isAuditor={isAuditor}
          />

          {/* 2. Captures -------------------------------------------------- */}
          <NCAttachmentsCard
            ncId={nc.id}
            auditId={auditId}
            attachments={attachments}
            canUpload={canUpload}
            canDeleteAny={canAny(profile.role, orgPerms, "nc.edit")}
            profileId={profile.id}
          />

          {/* 3. Échanges -------------------------------------------------- */}
          <NCDiscussion
            ncId={nc.id}
            auditId={auditId}
            profileId={profile.id}
            messages={messages}
            canDiscuss={canDiscuss}
            canAccessReviewThread={canAccessReviewThread}
          />

          {/* 4. Annexe, critère lié (repliée) ----------------------------- */}
          {nc.criterion && (
            <NCCriterionAnnex
              criterion={nc.criterion}
              testReference={nc.testReference}
              open={annexOpen}
              onOpenChange={setAnnexOpen}
            />
          )}
        </div>

        {/* Colonne de droite : statut et informations --------------------- */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
          {/* Statut ------------------------------------------------------- */}
          <Card className="p-5">
            <h2 className="text-base font-extrabold" id="nc-status-title">
              {t("statusTitle")}
            </h2>
            {isAuditor ? (
              <fieldset
                className="mt-3 flex flex-col gap-1.5"
                disabled={statusPending}
              >
                <legend className="sr-only">{t("statusAria")}</legend>
                {statusOptions.map((s) => (
                  <label
                    key={s}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-row border px-3 py-2.5 text-sm font-bold",
                      "transition-[background-color,border-color] duration-150",
                      status === s
                        ? "border-primary bg-primary-soft"
                        : "border-border hover:border-primary hover:bg-primary-softer",
                    )}
                  >
                    <input
                      type="radio"
                      name="nc-status"
                      className="size-[18px] accent-primary"
                      checked={status === s}
                      onChange={() => handleStatusChange(s)}
                    />
                    <span className="flex-1">{tNcStatus(s)}</span>
                    <span
                      aria-hidden="true"
                      className="size-2.5 shrink-0 rounded-full"
                      style={{
                        background:
                          NC_STATUS_COLOR[s] ?? "hsl(var(--muted-foreground))",
                      }}
                    />
                  </label>
                ))}
              </fieldset>
            ) : (
              <StatusDot
                className="mt-3"
                color={NC_STATUS_COLOR[status] ?? "hsl(var(--muted-foreground))"}
              >
                {tNcStatus(status)}
              </StatusDot>
            )}
            {statusError && (
              <p
                role="alert"
                className="mt-2 text-sm font-semibold text-destructive"
              >
                {statusError}
              </p>
            )}
          </Card>

          {/* Informations -------------------------------------------------- */}
          <Card className="p-5">
            <h2 className="sr-only">{t("infoTitle")}</h2>
            <dl className="grid grid-cols-[minmax(0,100px)_minmax(0,1fr)] items-center gap-x-2.5 gap-y-3 text-[0.95rem]">
              <dt className="text-muted-foreground">{t("linkedPage")}</dt>
              <dd className="m-0 font-bold">
                {nc.page?.name ?? t("transversalShort")}
              </dd>

              <dt className="text-muted-foreground">{t("severity")}</dt>
              <dd className="m-0">
                <SeverityBadge severity={nc.severity} />
              </dd>

              <dt className="text-muted-foreground">{t("reviewLabel")}</dt>
              <dd className="m-0">
                <NCReviewBadge status={nc.reviewStatus} />
              </dd>

              {nc.testReference && (
                <>
                  <dt className="text-muted-foreground">{t("testLabel")}</dt>
                  <dd className="m-0">
                    <span className="rounded-md bg-primary-muted px-2 py-0.5 text-xs font-extrabold text-primary">
                      {nc.testReference}
                    </span>
                  </dd>
                </>
              )}
            </dl>
          </Card>
        </aside>
      </div>
    </div>
  );
}
