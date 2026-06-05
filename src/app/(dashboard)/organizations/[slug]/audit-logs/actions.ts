"use server";

import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { orgHasFeature } from "@/lib/billing/server";

export interface ExportResult {
  error: string | null;
  csv?: string;
  filename?: string;
}

// Lignes max exportées en CSV. On garde un cap pour éviter de générer
// des fichiers monstrueux dans la mémoire serveur.
const MAX_EXPORT_ROWS = 10_000;

interface LogRow {
  id: string;
  created_at: string;
  audit_id: string | null;
  actor_id: string | null;
  actor_role: string | null;
  action: string;
  payload: unknown;
}

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = typeof value === "string" ? value : JSON.stringify(value);
  if (str.includes('"') || str.includes(",") || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function exportAuditLogsCsv(
  organizationId: string,
  filters: {
    action?: string;
    actorId?: string;
    from?: string; // ISO date
    to?: string;   // ISO date
  } = {},
): Promise<ExportResult> {
  const supabase = await createClient();
  const t = await getTranslations("errors");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: t("notAuthenticated") };

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return { error: t("forbidden") };
  }

  const enabled = await orgHasFeature("audit_logs.export");
  if (!enabled) return { error: t("planUpgradeRequired") };

  let query = supabase
    .from("audit_logs")
    .select("id, created_at, audit_id, actor_id, actor_role, action, payload")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(MAX_EXPORT_ROWS);

  if (filters.action) query = query.eq("action", filters.action);
  if (filters.actorId) query = query.eq("actor_id", filters.actorId);
  if (filters.from) query = query.gte("created_at", filters.from);
  if (filters.to) query = query.lte("created_at", filters.to);

  const { data, error } = await query;
  if (error) return { error: error.message };

  const rows = (data ?? []) as LogRow[];

  const header = [
    "id",
    "created_at",
    "audit_id",
    "actor_id",
    "actor_role",
    "action",
    "payload",
  ];
  const lines = [
    header.join(","),
    ...rows.map((row) =>
      [
        escapeCsv(row.id),
        escapeCsv(row.created_at),
        escapeCsv(row.audit_id),
        escapeCsv(row.actor_id),
        escapeCsv(row.actor_role),
        escapeCsv(row.action),
        escapeCsv(row.payload),
      ].join(","),
    ),
  ];

  const csv = lines.join("\n");
  const filename = `axessyo-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
  return { error: null, csv, filename };
}
