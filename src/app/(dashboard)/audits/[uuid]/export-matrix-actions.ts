"use server";

import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { orgHasFeature } from "@/lib/billing/server";
import type { ConformityStatus, PageType, WCAGLevel } from "@/types/domain";
import {
  buildMatrixCsv,
  slugify,
  type MatrixCsvConformity,
  type MatrixCsvCriterion,
  type MatrixCsvPage,
} from "./export-matrix-csv";

export interface ExportResult {
  error: string | null;
  csv?: string;
  filename?: string;
}

/**
 * Exporte la matrice de conformité (grille critères × pages) d'un audit en CSV.
 * Mêmes garde-fous que l'export NC / PDF : autorisation par rôle + feature gate
 * `export.pdf` (capacité d'export, Starter+), re-vérifiés ici car une server
 * action peut être appelée hors UI.
 */
export async function exportConformityMatrixCsv(
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

  // 2) Audit → projet → client (autorisation + nom de fichier + référentiel)
  const { data: auditRow, error: auditError } = await supabase
    .from("audits")
    .select(
      `id, reference_id,
       project:projects(name, client:clients(id, name))`,
    )
    .eq("id", auditId)
    .maybeSingle();
  if (auditError) return { error: auditError.message };
  if (!auditRow) return { error: t("forbidden") };

  const project = (
    Array.isArray(auditRow.project) ? auditRow.project[0] : auditRow.project
  ) as { name: string; client: unknown } | null;
  const client = project
    ? ((Array.isArray(project.client)
        ? project.client[0]
        : project.client) as { id: string; name: string } | null)
    : null;

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

  const referenceId = auditRow.reference_id as string;

  // 5) Chargement parallèle : pages, critères (+ thématique), conformités.
  const [
    { data: pageRows, error: pagesError },
    { data: criteriaRows, error: criteriaError },
    { data: conformityRows, error: conformitiesError },
  ] = await Promise.all([
    supabase
      .from("pages")
      .select("id, name, url, page_type, sort_order")
      .eq("audit_id", auditId),
    supabase
      .from("criteria")
      .select(
        "id, identifier, name, level, thematic:thematics!inner(identifier, name, sort_order, reference_id)",
      )
      .eq("thematic.reference_id", referenceId),
    supabase
      .from("page_conformities")
      .select("page_id, criteria_id, status")
      .eq("audit_id", auditId),
  ]);

  const dbError = pagesError ?? criteriaError ?? conformitiesError;
  if (dbError) return { error: dbError.message };

  type ThematicJoin = {
    identifier: string;
    name: string;
    sort_order: number;
  };

  const pages: MatrixCsvPage[] = (pageRows ?? []).map((p) => ({
    id: p.id as string,
    name: p.name as string,
    url: (p.url as string | null) ?? null,
    pageType: p.page_type as PageType,
    sortOrder: (p.sort_order as number) ?? 0,
  }));

  const criteria: MatrixCsvCriterion[] = (criteriaRows ?? []).map((c) => {
    const thematic = (
      Array.isArray(c.thematic) ? c.thematic[0] : c.thematic
    ) as ThematicJoin | null;
    return {
      id: c.id as string,
      identifier: c.identifier as string,
      name: c.name as string,
      level: (c.level as WCAGLevel | null) ?? null,
      thematicIdentifier: thematic?.identifier ?? "",
      thematicName: thematic?.name ?? "",
      thematicSort: thematic?.sort_order ?? 0,
    };
  });

  const conformities: MatrixCsvConformity[] = (conformityRows ?? []).map(
    (c) => ({
      pageId: c.page_id as string,
      criteriaId: c.criteria_id as string,
      status: c.status as ConformityStatus,
    }),
  );

  const csv = buildMatrixCsv({ pages, criteria, conformities });
  const filename = `axessyo-matrice-${slugify(
    client?.name ?? "audit",
  )}-${new Date().toISOString().slice(0, 10)}.csv`;

  return { error: null, csv, filename };
}
