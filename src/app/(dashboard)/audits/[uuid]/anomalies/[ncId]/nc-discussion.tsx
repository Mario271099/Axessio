"use client";

// Colonne discussion de la page NC : fils client/review, envoi et suppression
// de messages. Extrait de nc-detail.tsx (découpage des gros composants) —
// markup et comportement inchangés.

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, MessageSquare, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";
import { intlLocale } from "@/lib/intl";
import { deleteMessage, sendMessage } from "./actions";
import type { MessageData } from "./nc-detail-types";

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

interface NCDiscussionProps {
  ncId: string;
  auditId: string;
  profileId: string;
  /** Messages tous fils confondus — séparés ici via `thread`. */
  messages: MessageData[];
  canDiscuss: boolean;
  canAccessReviewThread: boolean;
}

export function NCDiscussion({
  ncId,
  auditId,
  profileId,
  messages,
  canDiscuss,
  canAccessReviewThread,
}: NCDiscussionProps) {
  const router = useRouter();
  const t = useTranslations("audits.ncDetail");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const intl = intlLocale(locale);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [messageBody, setMessageBody] = useState("");
  const [sending, startSendTransition] = useTransition();
  const [sendError, setSendError] = useState<string | null>(null);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(
    null,
  );
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  // Onglet actif du chat : 'client' (remédiation, défaut) | 'review' (relecture).
  const [activeThread, setActiveThread] = useState<"client" | "review">(
    "client",
  );

  // Messages filtrés par fil actif.
  const visibleMessages = messages.filter(
    (m) => (m.thread ?? "client") === activeThread,
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [visibleMessages.length, activeThread]);

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

  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const body = messageBody.trim();
    if (!body || sending) return;
    setSendError(null);
    startSendTransition(async () => {
      const result = await sendMessage(ncId, auditId, body, activeThread);
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
    setMessageToDelete(null);
    setDeletingMessageId(messageId);
    setSendError(null);
    try {
      const result = await deleteMessage(messageId, ncId, auditId);
      if (result.error) {
        setSendError(result.error);
        return;
      }
      router.refresh();
    } finally {
      setDeletingMessageId(null);
    }
  };

  return (
    <>
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
                const isMine = m.authorId === profileId;
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
                            onClick={() => setMessageToDelete(m.id)}
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

      {/* Confirmation suppression message */}
      <AlertDialog
        open={messageToDelete !== null}
        onOpenChange={(o) => !o && setMessageToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tCommon("confirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("confirmDeleteMessage")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (messageToDelete) void handleDeleteMessage(messageToDelete);
              }}
            >
              {tCommon("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
