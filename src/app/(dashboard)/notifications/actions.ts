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
  /** Nom du projet de l'audit ciblé (pour le contexte des notifs workflow). */
  auditProjectName: string | null;
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
         nc:non_conformities(title),
         audit:audits(project:projects(name))`,
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

  type ProjectShort = { name: string | null };
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
    audit:
      | { project: ProjectShort | ProjectShort[] | null }
      | { project: ProjectShort | ProjectShort[] | null }[]
      | null;
  };

  const items: NotificationItem[] = ((rows ?? []) as Row[]).map((r) => {
    const sender = Array.isArray(r.sender) ? r.sender[0] : r.sender;
    const nc = Array.isArray(r.nc) ? r.nc[0] : r.nc;
    const audit = Array.isArray(r.audit) ? r.audit[0] : r.audit;
    const project = audit?.project
      ? Array.isArray(audit.project)
        ? audit.project[0]
        : audit.project
      : null;
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
      auditProjectName: project?.name ?? null,
      createdAt: r.created_at,
      readAt: r.read_at,
    };
  });

  return { items, unreadCount: unreadCount ?? 0 };
}

// Borne anti-abus pour les opérations par lot (une notif groupée n'agrège
// jamais plus que la fenêtre RECENT_LIMIT de toute façon).
const MAX_BATCH = 50;

/**
 * Marque un lot de notifications comme lues (cas des notifications groupées
 * dans la cloche : un clic = tout le groupe).
 */
export async function markNotificationsRead(
  notificationIds: string[],
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const t = await getTranslations("errors");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: t("notAuthenticated") };

  const ids = notificationIds.slice(0, MAX_BATCH);
  if (ids.length === 0) return { error: null };

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .in("id", ids)
    .eq("user_id", user.id)
    .is("read_at", null);

  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { error: null };
}

/**
 * Repasse un lot de notifications en non lu — pour « reporter » une notif
 * qu'on veut retrouver plus tard dans le compteur.
 */
export async function markNotificationsUnread(
  notificationIds: string[],
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const t = await getTranslations("errors");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: t("notAuthenticated") };

  const ids = notificationIds.slice(0, MAX_BATCH);
  if (ids.length === 0) return { error: null };

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: null })
    .in("id", ids)
    .eq("user_id", user.id)
    .not("read_at", "is", null);

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
