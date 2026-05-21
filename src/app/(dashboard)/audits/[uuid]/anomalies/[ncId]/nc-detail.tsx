"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Loader2,
  MessageSquare,
  Pencil,
  Send,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { FileDropZone } from "@/components/ui/file-drop-zone";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { intlLocale } from "@/lib/intl";
import { canChat, canEditNC } from "@/lib/permissions";
import type {
  NCReviewStatus,
  NCSeverity,
  NCStatus,
  UserRole,
} from "@/types/domain";
import { NCReviewBadge } from "@/components/audit/nc-review-badge";
import { NCReviewActions } from "@/components/audit/nc-review-actions";
import {
  addAttachment,
  deleteAttachment,
  deleteMessage,
  sendMessage,
  updateNC,
  updateNCStatus,
} from "./actions";

const MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

const AVATAR_COLORS = [
  "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
];

function avatarColor(authorId: string): string {
  let hash = 0;
  for (let i = 0; i < authorId.length; i++) {
    hash = (hash * 31 + authorId.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] ?? AVATAR_COLORS[0]!;
}

function avatarInitials(
  author: { firstName: string; lastName: string } | null,
): string {
  if (!author) return "?";
  const a = author.firstName.trim()[0] ?? "";
  const b = author.lastName.trim()[0] ?? "";
  const initials = `${a}${b}`.toUpperCase();
  return initials || "?";
}

const STATUS_BADGE_VARIANT: Record<
  string,
  "warning" | "secondary" | "success" | "muted" | "outline"
> = {
  TO_FIX: "warning",
  IN_PROGRESS: "secondary",
  FIXED: "success",
  FALSE_POSITIVE: "muted",
};

const NEW_STATUSES = [
  "TO_FIX",
  "IN_PROGRESS",
  "FIXED",
  "FALSE_POSITIVE",
] as const;

type NewStatus = (typeof NEW_STATUSES)[number];

const SEVERITIES: NCSeverity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const TRANSVERSAL_VALUE = "null";

interface CriterionData {
  id: string;
  identifier: string;
  name: string;
  url: string | null;
  methodology: string | null;
}

interface PageData {
  id: string;
  name: string;
}

export interface MessageData {
  id: string;
  body: string;
  createdAt: string;
  authorId: string;
  author: { firstName: string; lastName: string } | null;
  /** Fil de discussion (migration 34). Défaut 'client' pour rétrocompat. */
  thread?: "client" | "review";
}

interface AttachmentData {
  id: string;
  storagePath: string;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  uploadedBy: string | null;
  createdAt: string;
  signedUrl: string | null;
}

export interface NCData {
  id: string;
  title: string;
  description: string | null;
  actualResult: string | null;
  recommendation: string | null;
  severity: NCSeverity;
  status: string;
  pageId: string | null;
  testReference: string | null;
  criterion: CriterionData | null;
  page: PageData | null;
  /** Statut de relecture (migration 33). */
  reviewStatus: NCReviewStatus;
  /** Numéro séquentiel par audit (migration 41). 0 = legacy non backfillé. */
  displayNumber: number;
}

export interface NCSibling {
  id: string;
  displayNumber: number;
}

export interface NCDetailProps {
  nc: NCData;
  pages: PageData[];
  /** Messages tous fils confondus — séparés côté composant via `thread`. */
  messages: MessageData[];
  attachments: AttachmentData[];
  auditId: string;
  auditTitle: string;
  profile: { role: UserRole; id: string };
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
  auditTitle,
  profile,
  userAssignmentRole,
  prevNC,
  nextNC,
}: NCDetailProps) {
  const router = useRouter();
  const t = useTranslations("audits.ncDetail");
  const tNcStatus = useTranslations("constants.ncStatus");
  const tNcSeverity = useTranslations("constants.ncSeverity");
  const tAnomalies = useTranslations("audits.anomalies");
  const locale = useLocale();
  const intl = intlLocale(locale);
  // « isAuditor » historique = peut modifier la NC (titre, sévérité, statut).
  const isAuditor = canEditNC(profile.role);

  function formatMessageDate(iso: string): string {
    const d = new Date(iso);
    const date = d.toLocaleDateString(intl, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return t("messageDateAt", { date, hh, mm });
  }

  const [status, setStatus] = useState<string>(nc.status);
  const [statusPending, startStatusTransition] = useTransition();
  const [statusError, setStatusError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState(nc.description ?? "");
  const [actualResult, setActualResult] = useState(nc.actualResult ?? "");
  const [recommendation, setRecommendation] = useState(
    nc.recommendation ?? "",
  );
  const [severity, setSeverity] = useState<NCSeverity>(nc.severity);
  const [pageId, setPageId] = useState<string>(nc.pageId ?? TRANSVERSAL_VALUE);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, startSubmitTransition] = useTransition();

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewAttachment, setPreviewAttachment] =
    useState<AttachmentData | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [messageBody, setMessageBody] = useState("");
  const [sending, startSendTransition] = useTransition();
  const [sendError, setSendError] = useState<string | null>(null);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(
    null,
  );
  // Onglet actif du chat : 'client' (remédiation, défaut) | 'review' (relecture).
  const canAccessReviewThread =
    userAssignmentRole === "auditor" ||
    userAssignmentRole === "proofreader" ||
    userAssignmentRole === "admin";
  const [activeThread, setActiveThread] = useState<"client" | "review">(
    "client",
  );

  // Le chat client est ouvert à tous les rôles ayant chat.read.
  const canDiscuss = canChat(profile.role);

  // Messages filtrés par fil actif.
  const visibleMessages = messages.filter(
    (m) => (m.thread ?? "client") === activeThread,
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [visibleMessages.length, activeThread]);

  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const body = messageBody.trim();
    if (!body || sending) return;
    setSendError(null);
    startSendTransition(async () => {
      const result = await sendMessage(nc.id, auditId, body, activeThread);
      if (result.error) {
        setSendError(result.error);
        return;
      }
      setMessageBody("");
      router.refresh();
    });
  };

  const handleMessageKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) form.requestSubmit();
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (deletingMessageId) return;
    if (!window.confirm(t("confirmDeleteMessage"))) return;
    setDeletingMessageId(messageId);
    setSendError(null);
    try {
      const result = await deleteMessage(messageId, nc.id, auditId);
      if (result.error) {
        setSendError(result.error);
        return;
      }
      router.refresh();
    } finally {
      setDeletingMessageId(null);
    }
  };

  // Upload de captures : tous les rôles avec accès au chat (cohérent avec
  // l'ouverture remédiation/discussion à tout le monde).
  const canUpload = canChat(profile.role);

  const handleFilesChange = (selected: File[]) => {
    if (selected.length === 0 || uploading) return;
    setUploadError(null);
    setUploading(true);

    void (async () => {
      const supabase = createClient();
      const failures: string[] = [];

      for (const file of selected) {
        const fallbackExt = MIME_TO_EXT[file.type] ?? "bin";
        const nameExt = file.name.includes(".")
          ? file.name.split(".").pop()!.toLowerCase()
          : null;
        const ext = nameExt && nameExt.length <= 5 ? nameExt : fallbackExt;
        const path = `${auditId}/${nc.id}/${crypto.randomUUID()}.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from("nc-attachments")
          .upload(path, file, { contentType: file.type, upsert: false });

        if (uploadErr) {
          failures.push(`${file.name}: ${uploadErr.message}`);
          continue;
        }

        const result = await addAttachment(
          nc.id,
          auditId,
          path,
          file.name,
          file.size,
          file.type,
        );
        if (result.error) {
          await supabase.storage.from("nc-attachments").remove([path]);
          failures.push(`${file.name}: ${result.error}`);
        }
      }

      if (failures.length > 0) setUploadError(failures.join(" ; "));
      setUploading(false);
      router.refresh();
    })();
  };

  const handleDeleteAttachment = async (attachment: AttachmentData) => {
    if (deletingId) return;
    if (!window.confirm(t("confirmDeleteCapture"))) return;

    setDeletingId(attachment.id);
    setUploadError(null);
    try {
      const result = await deleteAttachment(
        attachment.id,
        nc.id,
        auditId,
        attachment.storagePath,
      );
      if (result.error) {
        setUploadError(result.error);
        return;
      }
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  };

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

  const cancelEdit = () => {
    setDescription(nc.description ?? "");
    setActualResult(nc.actualResult ?? "");
    setRecommendation(nc.recommendation ?? "");
    setSeverity(nc.severity);
    setPageId(nc.pageId ?? TRANSVERSAL_VALUE);
    setSubmitError(null);
    setEditing(false);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    const formData = new FormData();
    formData.set("title", nc.title);
    formData.set("description", description);
    formData.set("actualResult", actualResult);
    formData.set("recommendation", recommendation);
    formData.set("severity", severity);
    formData.set("pageId", pageId);
    startSubmitTransition(async () => {
      const result = await updateNC(nc.id, auditId, formData);
      if (result.error) {
        setSubmitError(result.error);
        return;
      }
      setEditing(false);
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <CardTitle className="text-base">{t("ncDetails")}</CardTitle>
              {isAuditor && !editing && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditing(true)}
                  className="gap-1"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("edit")}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {editing ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {submitError && (
                    <p
                      role="alert"
                      className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
                    >
                      {submitError}
                    </p>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="nc-description">{t("description")}</Label>
                    <Textarea
                      id="nc-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nc-actual-result">{t("actualResult")}</Label>
                    <Textarea
                      id="nc-actual-result"
                      value={actualResult}
                      onChange={(e) => setActualResult(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nc-recommendation">
                      {t("recommendation")}
                    </Label>
                    <Textarea
                      id="nc-recommendation"
                      value={recommendation}
                      onChange={(e) => setRecommendation(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="nc-severity">{t("severity")}</Label>
                      <Select
                        value={severity}
                        onValueChange={(v) => setSeverity(v as NCSeverity)}
                      >
                        <SelectTrigger id="nc-severity">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SEVERITIES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {tNcSeverity(s)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nc-page">{t("linkedPage")}</Label>
                      <Select value={pageId} onValueChange={setPageId}>
                        <SelectTrigger id="nc-page">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={TRANSVERSAL_VALUE}>
                            {t("transversal")}
                          </SelectItem>
                          {pages.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Button type="submit" size="sm" disabled={submitting}>
                      {submitting && (
                        <Loader2
                          className="h-3.5 w-3.5 animate-spin"
                          aria-hidden="true"
                        />
                      )}
                      {t("save")}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={cancelEdit}
                      disabled={submitting}
                      className="gap-1"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                      {t("cancel")}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <ReadField label={t("description")} value={nc.description} />
                  <ReadField label={t("actualResult")} value={nc.actualResult} />
                  <ReadField
                    label={t("recommendation")}
                    value={nc.recommendation}
                  />
                  <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-muted-foreground">
                    <span>
                      {t("page")}{" "}
                      <span className="text-foreground">
                        {nc.page?.name ?? t("transversalShort")}
                      </span>
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Captures d'écran -------------------------------------------- */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <CardTitle className="text-base">{t("screenshots")}</CardTitle>
              <span className="text-xs text-muted-foreground tabular-nums">
                {t("filesCount", { count: attachments.length })}
              </span>
            </CardHeader>
            <CardContent className="space-y-4">
              {uploading && (
                <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2
                    className="h-3.5 w-3.5 animate-spin"
                    aria-hidden="true"
                  />
                  {t("uploading")}
                </p>
              )}

              {uploadError && (
                <p
                  role="alert"
                  className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
                >
                  {uploadError}
                </p>
              )}

              {attachments.length > 0 && (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {attachments.map((att) => {
                    // Auteur de l'upload OU staff plateforme avec droit d'éditer
                    // les NC (admin/auditor). Couvre l'admin qui n'avait pas
                    // accès dans l'ancien check `role === "auditor"`.
                    const canDelete =
                      canEditNC(profile.role) || att.uploadedBy === profile.id;
                    const isImage = !!att.mimeType?.startsWith("image/");
                    const isDeleting = deletingId === att.id;
                    const displayName =
                      att.fileName ??
                      att.storagePath.split("/").pop() ??
                      "fichier";

                    return (
                      <li key={att.id} className="space-y-1.5">
                        <div className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
                          {isImage && att.signedUrl ? (
                            <button
                              type="button"
                              onClick={() => setPreviewAttachment(att)}
                              className="block h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              aria-label={t("enlargeAria", { name: displayName })}
                            >
                              <img
                                src={att.signedUrl}
                                alt={displayName}
                                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                              />
                            </button>
                          ) : att.signedUrl ? (
                            <a
                              href={att.signedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex h-full w-full flex-col items-center justify-center gap-2 p-3 text-center text-xs text-muted-foreground hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              aria-label={t("openAria", { name: displayName })}
                            >
                              <FileText
                                className="h-8 w-8"
                                aria-hidden="true"
                              />
                              <span className="line-clamp-2 break-all">
                                {t("openPdf")}
                              </span>
                            </a>
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                              {t("unavailable")}
                            </div>
                          )}

                          {canDelete && (
                            <Button
                              type="button"
                              size="icon"
                              variant="destructive"
                              className="absolute right-1.5 top-1.5 h-7 w-7 rounded-full opacity-0 shadow transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                              onClick={() => handleDeleteAttachment(att)}
                              disabled={isDeleting}
                              aria-label={t("deleteAria", { name: displayName })}
                            >
                              {isDeleting ? (
                                <Loader2
                                  className="h-3.5 w-3.5 animate-spin"
                                  aria-hidden="true"
                                />
                              ) : (
                                <Trash2
                                  className="h-3.5 w-3.5"
                                  aria-hidden="true"
                                />
                              )}
                            </Button>
                          )}
                        </div>
                        <p
                          className="truncate text-xs text-muted-foreground"
                          title={displayName}
                        >
                          {displayName}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}

              {attachments.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
                  <div
                    aria-hidden="true"
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
                  >
                    <Upload className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-medium">{t("noScreenshots")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("noScreenshotsDesc")}
                  </p>
                </div>
              )}

              {canUpload && (
                <FileDropZone
                  files={[]}
                  onFilesChange={handleFilesChange}
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  maxSizeMB={5}
                  disabled={uploading}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Colonne droite (1/3) — Discussion ------------------------------ */}
        <aside className="lg:col-span-1">
          <Card className="flex flex-col lg:sticky lg:top-20 lg:h-[calc(100vh-12rem)]">
            <CardHeader className="space-y-3 border-b border-border">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare
                  className="h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
                {t("discussion")}
                {visibleMessages.length > 0 && (
                  <Badge variant="secondary" className="ml-1 tabular-nums">
                    {visibleMessages.length}
                  </Badge>
                )}
              </CardTitle>
              {/* Onglets — visibles seulement si l'utilisateur a accès au
                  fil 'review' (staff/proofreader). Sinon, un seul fil 'client'
                  reste actif, on cache le toggle. */}
              {canAccessReviewThread && (
                <div
                  role="tablist"
                  aria-label={t("threadTabsAria")}
                  className="inline-flex rounded-md border border-border bg-muted/40 p-0.5 text-xs"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeThread === "client"}
                    className={cn(
                      "rounded px-2 py-1 transition-colors",
                      activeThread === "client"
                        ? "bg-background font-medium shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    onClick={() => setActiveThread("client")}
                  >
                    {t("threadClient")}
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeThread === "review"}
                    className={cn(
                      "rounded px-2 py-1 transition-colors",
                      activeThread === "review"
                        ? "bg-background font-medium shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    onClick={() => setActiveThread("review")}
                  >
                    {t("threadReview")}
                  </button>
                </div>
              )}
            </CardHeader>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {visibleMessages.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <div
                    aria-hidden="true"
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
                  >
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-medium">{t("noMessages")}</p>
                  <p className="text-xs text-muted-foreground">
                    {activeThread === "review"
                      ? t("noMessagesReviewDesc")
                      : t("noMessagesDesc")}
                  </p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {visibleMessages.map((m) => {
                    const initials = avatarInitials(m.author);
                    const fullName = m.author
                      ? `${m.author.firstName} ${m.author.lastName}`.trim() ||
                        t("user")
                      : t("user");
                    const isMine = m.authorId === profile.id;
                    const isDeleting = deletingMessageId === m.id;

                    return (
                      <li
                        key={m.id}
                        className={cn(
                          "group flex gap-2",
                          isMine ? "flex-row-reverse" : "flex-row",
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                            avatarColor(m.authorId),
                          )}
                          aria-hidden="true"
                          title={fullName}
                        >
                          {initials}
                        </div>
                        <div
                          className={cn(
                            "flex max-w-[80%] flex-col gap-1",
                            isMine ? "items-end" : "items-start",
                          )}
                        >
                          <div
                            className={cn(
                              "rounded-2xl px-3 py-2 text-sm leading-relaxed",
                              isMine
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-foreground",
                            )}
                          >
                            <p className="whitespace-pre-wrap break-words">
                              {m.body}
                            </p>
                          </div>
                          <div
                            className={cn(
                              "flex items-center gap-1.5 text-[11px] text-muted-foreground",
                              isMine ? "flex-row-reverse" : "flex-row",
                            )}
                          >
                            <span className="font-medium">{fullName}</span>
                            <span aria-hidden="true">·</span>
                            <time dateTime={m.createdAt}>
                              {formatMessageDate(m.createdAt)}
                            </time>
                            {isMine && (
                              <button
                                type="button"
                                className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-md opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                                onClick={() => handleDeleteMessage(m.id)}
                                disabled={isDeleting}
                                aria-label={t("deleteMessageAria")}
                              >
                                {isDeleting ? (
                                  <Loader2
                                    className="h-3 w-3 animate-spin"
                                    aria-hidden="true"
                                  />
                                ) : (
                                  <Trash2
                                    className="h-3 w-3"
                                    aria-hidden="true"
                                  />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              <div ref={messagesEndRef} />
            </div>

            {sendError && (
              <p
                role="alert"
                className="mx-3 rounded-md bg-destructive/10 p-2 text-xs text-destructive"
              >
                {sendError}
              </p>
            )}

            {canDiscuss ? (
              <form
                onSubmit={handleSendMessage}
                className="border-t border-border bg-background/95 p-3 backdrop-blur"
              >
                <Label htmlFor="nc-message" className="sr-only">
                  {t("newMessageLabel")}
                </Label>
                <div className="flex items-end gap-2">
                  <Textarea
                    id="nc-message"
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    onKeyDown={handleMessageKeyDown}
                    rows={2}
                    placeholder={t("messagePlaceholder")}
                    disabled={sending}
                    className="min-h-9 resize-none"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={sending || !messageBody.trim()}
                    aria-label={t("sendAria")}
                  >
                    {sending ? (
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <Send className="h-4 w-4" aria-hidden="true" />
                    )}
                  </Button>
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {t("messageHint")}
                </p>
              </form>
            ) : (
              <p className="m-3 rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
                {t("canDiscussNotice")}
              </p>
            )}
          </Card>
        </aside>
      </div>

      <Dialog
        open={previewAttachment !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewAttachment(null);
        }}
      >
        <DialogContent className="max-w-5xl gap-2 p-3 sm:p-4">
          <DialogTitle className="sr-only">
            {previewAttachment?.fileName ?? t("previewTitle")}
          </DialogTitle>
          {previewAttachment?.signedUrl && (
            <img
              src={previewAttachment.signedUrl}
              alt={previewAttachment.fileName ?? t("previewTitle")}
              className="mx-auto max-h-[80vh] w-auto rounded-md object-contain"
            />
          )}
          {previewAttachment?.fileName && (
            <p className="text-center text-xs text-muted-foreground">
              {previewAttachment.fileName}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReadField({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  const t = useTranslations("audits.ncDetail");
  return (
    <div className="space-y-1">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      {value ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{value}</p>
      ) : (
        <p className="text-sm italic text-muted-foreground">{t("notFilled")}</p>
      )}
    </div>
  );
}
