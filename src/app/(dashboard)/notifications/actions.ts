"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

export interface NotificationItem {
  id: string;
  type: string;
  auditId: string | null;
  ncId: string | null;
  messageId: string | null;
  senderId: string | null;
  senderName: string | null;
  ncTitle: string | null;
  createdAt: string;
  readAt: string | null;
}

export interface NotificationsResult {
  items: NotificationItem[];
  unreadCount: number;
}

const RECENT_LIMIT = 10;

export async function fetchNotifications(): Promise<NotificationsResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { items: [], unreadCount: 0 };

  const [
    { data: rows },
    { count: unreadCount },
  ] = await Promise.all([
    supabase
      .from("notifications")
      .select(
        `id, type, audit_id, nc_id, message_id, sender_id, created_at, read_at,
         sender:profiles!notifications_sender_id_fkey(first_name, last_name),
         nc:non_conformities(title)`,
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(RECENT_LIMIT),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null),
  ]);

  type Row = {
    id: string;
    type: string;
    audit_id: string | null;
    nc_id: string | null;
    message_id: string | null;
    sender_id: string | null;
    created_at: string;
    read_at: string | null;
    sender:
      | { first_name: string | null; last_name: string | null }
      | { first_name: string | null; last_name: string | null }[]
      | null;
    nc: { title: string | null } | { title: string | null }[] | null;
  };

  const items: NotificationItem[] = ((rows ?? []) as Row[]).map((r) => {
    const sender = Array.isArray(r.sender) ? r.sender[0] : r.sender;
    const nc = Array.isArray(r.nc) ? r.nc[0] : r.nc;
    const senderName = sender
      ? `${sender.first_name ?? ""} ${sender.last_name ?? ""}`.trim() || null
      : null;
    return {
      id: r.id,
      type: r.type,
      auditId: r.audit_id,
      ncId: r.nc_id,
      messageId: r.message_id,
      senderId: r.sender_id,
      senderName,
      ncTitle: nc?.title ?? null,
      createdAt: r.created_at,
      readAt: r.read_at,
    };
  });

  return { items, unreadCount: unreadCount ?? 0 };
}

export async function markNotificationRead(
  notificationId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const t = await getTranslations("errors");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: t("notAuthenticated") };

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", user.id)
    .is("read_at", null);

  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { error: null };
}

export async function markAllNotificationsRead(): Promise<{
  error: string | null;
}> {
  const supabase = await createClient();
  const t = await getTranslations("errors");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: t("notAuthenticated") };

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);

  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { error: null };
}
