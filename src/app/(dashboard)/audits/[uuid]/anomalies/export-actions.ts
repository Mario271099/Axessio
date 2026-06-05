"use server";

import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { orgHasFeature } from "@/lib/billing/server";
import {
  NC_SEVERITY_LABELS,
  NC_STATUS_LABELS,
} from "@/lib/constants";
import type { NCSeverity, NCStatus } from "@/types/domain";

export interface ExportResult {
  error: string | null;
  csv?: string;
  filename?: string;
}

// Échappement CSV (RFC 4180) : on guillemet dès qu'un séparateur, un guillemet
// ou un saut de ligne apparaît, et on double les guillemets internes.
function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

interface NcRow {
  display_number: number | null;
  title: string | null;
  description: string | null;
  actual_result: string | null;
  recommendation: string | null;
  severity: string;
  status: string;
  test_reference: string | null;
  created_at: string;
  criterion: { identifier: string; name: string } | { identifier: string; name: string }[] | null;
  page: { name: string } | { name: string }[] | null;
}

function one<T>(v: T | T[] | null): T | null {
  if (v === null) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

/**
 * Exporte les non-conformités d'un audit en CSV. Réservé aux utilisateurs
 * pouvant consulter l'audit (admin/auditeur, ou client_admin du client).
 * Gated par la feature `export.pdf` (capacité d'export, Starter+) — re-vérifié
 * ici car une server action peut être appelée hors UI.
 */
export async function exportNonConformitiesCsv(
  auditId: string,
): Promise<ExportResult> {
  const supabase = await createClient();
  const t = await getTranslations("errors");

  // 1) Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: t("notAuthenticated") };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, client_id, is_active, is_platform_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || profile.is_active === false) {
    return { error: t("forbidden") };
  }

  // 2) Charge l'audit → projet → client (pour l'autorisation + le nom de fichier)
  const { data: auditRow, error: auditError } = await supabase
    .from("audits")
    .select(
      `id, project:projects(name, client:clients(id, name))`,
    )
    .eq("id", auditId)
    .maybeSingle();
  if (auditError) return { error: auditError.message };
  if (!auditRow) return { error: t("forbidden") };

  const project = one(auditRow.project as never) as
    | { name: string; client: unknown }
    | null;
  const client = project ? (one(project.client as never) as { id: string; name: string } | null) : null;

  // 3) Autorisation : super-admin/auditor OU client_admin du client de l'audit.
  const isAuthorized =
    profile.is_platform_admin === true ||
    profile.role === "admin" ||
    profile.role === "auditor" ||
    (profile.role === "client_admin" && client?.id === profile.client_id);
  if (!isAuthorized) return { error: t("forbidden") };

  // 4) Feature gate (doublé serveur/UI).
  const enabled = await orgHasFeature("export.pdf");
  if (!enabled) return { error: t("planUpgradeRequired") };

  // 5) Chargement des NC
  const { data, error } = await supabase
    .from("non_conformities")
    .select(
      `display_number, title, description, actual_result, recommendation,
       severity, status, test_reference, created_at,
       criterion:criteria!inner(identifier, name),
       page:pages(name)`,
    )
    .eq("audit_id", auditId)
    .order("display_number", { ascending: true });

  if (error) return { error: error.message };

  const rows = (data ?? []) as NcRow[];

  // 6) Construction du CSV (en-têtes FR, libellés sévérité/statut traduits).
  const header = [
    "N°",
    "Page",
    "Critère",
    "Intitulé du critère",
    "Sévérité",
    "Statut",
    "Titre",
    "Description",
    "Résultat constaté",
    "Recommandation",
    "Référence de test",
    "Date de création",
  ];

  const lines = [
    header.join(","),
    ...rows.map((nc) => {
      const criterion = one(nc.criterion);
      const page = one(nc.page);
      const severity =
        NC_SEVERITY_LABELS[nc.severity as NCSeverity] ?? nc.severity;
      const status = NC_STATUS_LABELS[nc.status as NCStatus] ?? nc.status;
      return [
        escapeCsv(nc.display_number),
        escapeCsv(page?.name),
        escapeCsv(criterion?.identifier),
        escapeCsv(criterion?.name),
        escapeCsv(severity),
        escapeCsv(status),
        escapeCsv(nc.title),
        escapeCsv(nc.description),
        escapeCsv(nc.actual_result),
        escapeCsv(nc.recommendation),
        escapeCsv(nc.test_reference),
        escapeCsv(nc.created_at),
      ].join(",");
    }),
  ];

  // BOM UTF-8 pour qu'Excel ouvre correctement les accents.
  const csv = "﻿" + lines.join("\r\n");
  const safeName = (client?.name ?? "audit")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "audit";
  const filename = `axessyo-nc-${safeName}-${new Date().toISOString().slice(0, 10)}.csv`;

  return { error: null, csv, filename };
}
