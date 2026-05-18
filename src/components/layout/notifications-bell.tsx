"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import * as Popover from "@radix-ui/react-popover";
import { Bell, Check, MessageSquare } from "lucide-react";
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
    // Marque comme lu (optimiste) + navigue vers la NC.
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
                            ? "bg-primary/15 text-primary"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="text-sm leading-snug">
                          <span className="font-semibold">
                            {notif.senderName ?? t("unknownSender")}
                          </span>{" "}
                          <span className="text-muted-foreground">
                            {t("replied")}
                          </span>
                        </p>
                        {notif.ncTitle && (
                          <p className="truncate text-xs text-muted-foreground">
                            {notif.ncTitle}
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
