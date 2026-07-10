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
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SeverityBadge } from "@/components/audit/severity-badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { canAny, canChat, type Permission } from "@/lib/permissions";
import type { NCStatus, UserRole } from "@/types/domain";
import { NCReviewBadge } from "@/components/audit/nc-review-badge";
import { NCReviewActions } from "@/components/audit/nc-review-actions";
import { updateNCStatus } from "./actions";
import { NCDetailsCard } from "./nc-details-card";
import { NCAttachmentsCard } from "./nc-attachments-card";
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

const STATUS_BADGE_VARIANT: Record<
  string,
  "warning" | "secondary" | "success" | "muted" | "outline"
> = {
  TO_FIX: "warning",
  IN_PROGRESS: "secondary",
  FIXED: "success",
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

  const statusBadgeVariant = STATUS_BADGE_VARIANT[status] ?? "outline";

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      {/* Barre de navigation NC : retour liste + prev/next ----------------- */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/audits/${auditId}/anomalies`}
          className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {tAnomalies("breadcrumb")}
        </Link>

        <div className="flex items-center gap-2">
          <Button
            asChild={!!prevNC}
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={!prevNC}
            aria-label={
              prevNC
                ? t("prevAria", { num: prevNC.displayNumber })
                : t("prevDisabled")
            }
          >
            {prevNC ? (
              <Link href={`/audits/${auditId}/anomalies/${prevNC.id}`}>
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="tabular-nums">
                  {t("prev", { num: String(prevNC.displayNumber).padStart(3, "0") })}
                </span>
              </Link>
            ) : (
              <span>
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
                {t("prevDisabled")}
              </span>
            )}
          </Button>
          <Button
            asChild={!!nextNC}
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={!nextNC}
            aria-label={
              nextNC
                ? t("nextAria", { num: nextNC.displayNumber })
                : t("nextDisabled")
            }
          >
            {nextNC ? (
              <Link href={`/audits/${auditId}/anomalies/${nextNC.id}`}>
                <span className="tabular-nums">
                  {t("next", { num: String(nextNC.displayNumber).padStart(3, "0") })}
                </span>
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            ) : (
              <span>
                {t("nextDisabled")}
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Colonne gauche (2/3) -------------------------------------------- */}
        <div className="space-y-4 lg:col-span-2">
          {/* Header NC ---------------------------------------------------- */}
          <header className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <SeverityBadge severity={nc.severity} className="text-sm" />
              {isAuditor ? (
                <Select
                  value={status}
                  onValueChange={handleStatusChange}
                  disabled={statusPending}
                >
                  <SelectTrigger
                    className="h-8 w-44 text-xs"
                    aria-label={t("statusAria")}
                  >
                    <SelectValue>{tNcStatus(status)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {tNcStatus(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant={statusBadgeVariant} className="text-xs">
                  {tNcStatus(status)}
                </Badge>
              )}
              <NCReviewBadge status={nc.reviewStatus} hideWhenNotRequested />
            </div>
            {statusError && (
              <p role="alert" className="text-xs text-destructive">
                {statusError}
              </p>
            )}
            <h1 className="flex flex-wrap items-baseline gap-2 text-2xl font-bold tracking-tight">
              {nc.displayNumber > 0 && (
                <span className="font-mono text-base font-semibold text-muted-foreground tabular-nums">
                  NC #{String(nc.displayNumber).padStart(3, "0")}
                </span>
              )}
              <span>{nc.title}</span>
            </h1>
            <NCReviewActions
              ncId={nc.id}
              reviewStatus={nc.reviewStatus}
              userRole={userAssignmentRole}
            />
          </header>

          {/* Critère lié -------------------------------------------------- */}
          {nc.criterion && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {t("linkedCriterion")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-muted px-2 py-1 font-mono text-sm font-semibold text-muted-foreground">
                    {nc.criterion.identifier}
                  </span>
                  <span className="font-medium">{nc.criterion.name}</span>
                </div>
                {nc.testReference && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">
                      {t("testLabel")}
                    </span>
                    <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-xs font-semibold text-primary">
                      {nc.testReference}
                    </span>
                  </div>
                )}
                {nc.criterion.url && (
                  <Button
                    asChild
                    variant="link"
                    size="sm"
                    className="h-auto gap-1 p-0"
                  >
                    <a
                      href={nc.criterion.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t("officialDocs")}
                      <ExternalLink
                        className="h-3 w-3"
                        aria-hidden="true"
                      />
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Méthodologie ------------------------------------------------- */}
          <Accordion type="single" collapsible>
            <AccordionItem value="methodology">
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <BookOpen
                    className="h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  {t("methodology")}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                {nc.criterion?.methodology ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {nc.criterion.methodology}
                  </p>
                ) : (
                  <p className="text-sm italic text-muted-foreground">
                    {t("noMethodology")}
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Détails NC --------------------------------------------------- */}
          <NCDetailsCard
            nc={nc}
            pages={pages}
            auditId={auditId}
            isAuditor={isAuditor}
          />

          {/* Captures d'écran -------------------------------------------- */}
          <NCAttachmentsCard
            ncId={nc.id}
            auditId={auditId}
            attachments={attachments}
            canUpload={canUpload}
            canDeleteAny={canAny(profile.role, orgPerms, "nc.edit")}
            profileId={profile.id}
          />
        </div>

        {/* Colonne droite (1/3) - Discussion ------------------------------ */}
        <aside className="lg:col-span-1">
          <NCDiscussion
            ncId={nc.id}
            auditId={auditId}
            profileId={profile.id}
            messages={messages}
            canDiscuss={canDiscuss}
            canAccessReviewThread={canAccessReviewThread}
          />
        </aside>
      </div>
    </div>
  );
}
