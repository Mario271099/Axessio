"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import * as Popover from "@radix-ui/react-popover";
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  MessageSquare,
  Send,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
  type NotificationsResult,
} from "@/app/(dashboard)/notifications/actions";
import { intlLocale } from "@/lib/intl";

const POLL_INTERVAL_MS = 30_000;

interface Props {
  initial: NotificationsResult;
}

function useRelativeTime(locale: string) {
  const intl = intlLocale(locale);
  return useCallback(
    (iso: string): string => {
      const rtf = new Intl.RelativeTimeFormat(intl, { numeric: "auto" });
      const diffMs = Date.now() - new Date(iso).getTime();
      const minutes = Math.round(diffMs / 60_000);
      if (minutes < 1) return rtf.format(-1, "second");
      if (minutes < 60) return rtf.format(-Math.max(1, minutes), "minute");
      const hours = Math.round(minutes / 60);
      if (hours < 24) return rtf.format(-hours, "hour");
      const days = Math.round(hours / 24);
      if (days < 30) return rtf.format(-days, "day");
      const months = Math.round(days / 30);
      return rtf.format(-months, "month");
    },
    [intl],
  );
}

// ------------------------------------------------------------------
// Mapping type → icône. Le label est résolu via i18n côté composant
// (notifications.type.<type>) ; on garde ici uniquement le visuel.
// ------------------------------------------------------------------
const TYPE_ICON: Record<string, React.ElementType> = {
  nc_message: MessageSquare,
  "workflow.in_review_requested": Eye,
  "workflow.request_changes": AlertTriangle,
  "workflow.validated": CheckCircle2,
  "workflow.delivered": Send,
  "workflow.review_reminder": Clock,
  "proofreader.assigned": UserPlus,
};

const TYPE_TONE: Record<string, "primary" | "warning" | "destructive" | "success"> = {
  nc_message: "primary",
  "workflow.in_review_requested": "primary",
  "workflow.request_changes": "destructive",
  "workflow.validated": "warning",
  "workflow.delivered": "success",
  "workflow.review_reminder": "warning",
  "proofreader.assigned": "warning",
};

const TONE_BUBBLE: Record<string, string> = {
  primary: "bg-primary/15 text-primary",
  warning: "bg-warning/15 text-warning",
  destructive: "bg-destructive/15 text-destructive",
  success: "bg-success/15 text-success",
};

export function NotificationsBell({ initial }: Props) {
  const router = useRouter();
  const t = useTranslations("notifications");
  const tTopbar = useTranslations("topbar");
  const locale = useLocale();
  const formatRelative = useRelativeTime(locale);

  const [items, setItems] = useState<NotificationItem[]>(initial.items);
  const [unreadCount, setUnreadCount] = useState<number>(initial.unreadCount);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  // Polling : recharge la liste toutes les 30s tant que le tab est visible.
  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      if (document.visibilityState !== "visible") {
        timeoutId = setTimeout(tick, POLL_INTERVAL_MS);
        return;
      }
      try {
        const result = await fetchNotifications();
        if (!cancelled) {
          setItems(result.items);
          setUnreadCount(result.unreadCount);
        }
      } catch {
        // silencieux : si l'utilisateur perd la session, le prochain tick
        // récupèrera l'état correct.
      } finally {
        if (!cancelled) {
          timeoutId = setTimeout(tick, POLL_INTERVAL_MS);
        }
      }
    };

    timeoutId = setTimeout(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const hasUnread = unreadCount > 0;

  const handleItemClick = (notif: NotificationItem) => {
    // Marque comme lu (optimiste) + navigue vers la cible appropriée :
    //   - notif sur NC (ex. nc_message)        → /audits/{a}/anomalies/{nc}
    //   - notif workflow ou audit générique    → /audits/{a}
    if (!notif.readAt) {
      setItems((prev) =>
        prev.map((n) =>
          n.id === notif.id ? { ...n, readAt: new Date().toISOString() } : n,
        ),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      startTransition(async () => {
        await markNotificationRead(notif.id);
      });
    }
    setOpen(false);
    if (notif.auditId && notif.ncId) {
      router.push(`/audits/${notif.auditId}/anomalies/${notif.ncId}`);
    } else if (notif.auditId) {
      router.push(`/audits/${notif.auditId}`);
    }
  };

  const handleMarkAllRead = () => {
    setItems((prev) =>
      prev.map((n) =>
        n.readAt ? n : { ...n, readAt: new Date().toISOString() },
      ),
    );
    setUnreadCount(0);
    startTransition(async () => {
      await markAllNotificationsRead();
    });
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={
            hasUnread
              ? tTopbar("notificationsWithUnread")
              : tTopbar("notifications")
          }
          title={tTopbar("notifications")}
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
          {hasUnread && (
            <span
              aria-hidden="true"
              className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground ring-2 ring-background"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          {/* Région live invisible : annonce les changements de compteur */}
          {/* sans déplacer le focus.                                    */}
          <span aria-live="polite" aria-atomic="true" className="sr-only">
            {hasUnread
              ? tTopbar("notificationsWithUnread")
              : tTopbar("notifications")}
          </span>
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className={cn(
            "z-50 w-[360px] overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95",
            "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95",
          )}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold">{t("title")}</p>
            {hasUnread && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                onClick={handleMarkAllRead}
              >
                <Check className="h-3 w-3" aria-hidden="true" />
                {t("markAllRead")}
              </Button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <div
                aria-hidden="true"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground"
              >
                <Bell className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium">{t("empty")}</p>
              <p className="text-xs text-muted-foreground">{t("emptyDesc")}</p>
            </div>
          ) : (
            <ul className="max-h-[60vh] divide-y divide-border overflow-y-auto">
              {items.map((notif) => {
                const isUnread = notif.readAt === null;
                const Icon = TYPE_ICON[notif.type] ?? Bell;
                const tone = TYPE_TONE[notif.type] ?? "primary";
                const subtitle =
                  notif.type === "nc_message"
                    ? notif.ncTitle
                    : notif.auditProjectName;
                return (
                  <li key={notif.id}>
                    <button
                      type="button"
                      onClick={() => handleItemClick(notif)}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                        isUnread ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-accent",
                      )}
                    >
                      <div
                        aria-hidden="true"
                        className={cn(
                          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                          isUnread
                            ? TONE_BUBBLE[tone]
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="text-sm leading-snug">
                          <span className="font-semibold">
                            {notif.senderName ?? t("unknownSender")}
                          </span>{" "}
                          <span className="text-muted-foreground">
                            <NotifActionLabel type={notif.type} />
                          </span>
                        </p>
                        {subtitle && (
                          <p className="truncate text-xs text-muted-foreground">
                            {subtitle}
                          </p>
                        )}
                        <p className="text-[11px] text-muted-foreground tabular-nums">
                          {formatRelative(notif.createdAt)}
                        </p>
                      </div>
                      {isUnread && (
                        <span
                          aria-hidden="true"
                          className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary"
                        />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

// Petit sous-composant : libellé d'action selon le type. Toutes les clés
// utilisées ici doivent exister dans messages/{fr,en}.json (sinon next-intl
// remontera une erreur en dev). On centralise dans une fonction pour ne pas
// dupliquer 7 fois la même branche dans le JSX.
function NotifActionLabel({ type }: { type: string }) {
  const t = useTranslations("notifications");
  switch (type) {
    case "nc_message":
      return <>{t("replied")}</>;
    case "workflow.in_review_requested":
      return <>{t("typeInReviewRequested")}</>;
    case "workflow.request_changes":
      return <>{t("typeRequestChanges")}</>;
    case "workflow.validated":
      return <>{t("typeValidated")}</>;
    case "workflow.delivered":
      return <>{t("typeDelivered")}</>;
    case "workflow.review_reminder":
      return <>{t("typeReviewReminder")}</>;
    case "proofreader.assigned":
      return <>{t("typeProofreaderAssigned")}</>;
    default:
      return <>{t("genericAction")}</>;
  }
}
