"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { canEditMatrix } from "@/lib/permissions";
import type { ConformityStatus, NCSeverity, UserRole } from "@/types/domain";

export interface ActionResult {
  error: string | null;
  success?: boolean;
}

export interface CreateNCResult extends ActionResult {
  ncId?: string;
}

async function requireAuditor(): Promise<{ userId: string } | { error: string }> {
  const supabase = await createClient();
  const t = await getTranslations("errors");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: t("notAuthenticated") };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.role || !canEditMatrix(profile.role as UserRole)) {
    return { error: t("forbidden") };
  }
  return { userId: user.id };
}

function revalidateMatrix(auditId: string) {
  revalidatePath(`/audits/${auditId}/matrix`);
  revalidatePath(`/audits/${auditId}`);
}

// ============================================================================
// 1) Définir / effacer le statut d'un critère pour une page
// ============================================================================
export async function setConformity(
  auditId: string,
  pageId: string,
  criteriaId: string,
  status: ConformityStatus | null,
): Promise<ActionResult> {
  const auth = await requireAuditor();
  if ("error" in auth) return { error: auth.error };

  const supabase = await createClient();

  if (status === null) {
    const { error } = await supabase
      .from("page_conformities")
      .delete()
      .eq("page_id", pageId)
      .eq("criteria_id", criteriaId);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("page_conformities")
      .upsert(
        {
          audit_id: auditId,
          page_id: pageId,
          criteria_id: criteriaId,
          status,
        },
        { onConflict: "page_id,criteria_id" },
      );
    if (error) return { error: error.message };
  }

  revalidateMatrix(auditId);
  return { error: null, success: true };
}

// ============================================================================
// 2) Appliquer un statut à toute une thématique pour une page
//    (sans écraser les COMPLIANT / NON_COMPLIANT existants)
// ============================================================================
export async function bulkSetThematicConformity(
  auditId: string,
  pageId: string,
  thematicId: string,
  status: ConformityStatus,
): Promise<ActionResult> {
  const auth = await requireAuditor();
  if ("error" in auth) return { error: auth.error };

  const supabase = await createClient();

  // Tous les critères de la thématique
  const { data: criteria, error: critError } = await supabase
    .from("criteria")
    .select("id")
    .eq("thematic_id", thematicId);
  if (critError) return { error: critError.message };
  if (!criteria || criteria.length === 0) return { error: null, success: true };

  // Statuts existants pour cette page
  const { data: existing, error: existingError } = await supabase
    .from("page_conformities")
    .select("criteria_id, status")
    .eq("page_id", pageId)
    .in(
      "criteria_id",
      criteria.map((c) => c.id),
    );
  if (existingError) return { error: existingError.message };

  const protectedIds = new Set(
    (existing ?? [])
      .filter(
        (row) => row.status === "COMPLIANT" || row.status === "NON_COMPLIANT",
      )
      .map((row) => row.criteria_id),
  );

  const rows = criteria
    .filter((c) => !protectedIds.has(c.id))
    .map((c) => ({
      audit_id: auditId,
      page_id: pageId,
      criteria_id: c.id,
      status,
    }));

  if (rows.length > 0) {
    const { error } = await supabase
      .from("page_conformities")
      .upsert(rows, { onConflict: "page_id,criteria_id" });
    if (error) return { error: error.message };
  }

  revalidateMatrix(auditId);
  return { error: null, success: true };
}

// ============================================================================
// 3) Effacer tous les statuts d'une thématique pour une page
// ============================================================================
export async function clearThematicConformity(
  auditId: string,
  pageId: string,
  thematicId: string,
): Promise<ActionResult> {
  const auth = await requireAuditor();
  if ("error" in auth) return { error: auth.error };

  const supabase = await createClient();

  const { data: criteria, error: critError } = await supabase
    .from("criteria")
    .select("id")
    .eq("thematic_id", thematicId);
  if (critError) return { error: critError.message };
  if (!criteria || criteria.length === 0) return { error: null, success: true };

  const { error } = await supabase
    .from("page_conformities")
    .delete()
    .eq("page_id", pageId)
    .in(
      "criteria_id",
      criteria.map((c) => c.id),
    );
  if (error) return { error: error.message };

  revalidateMatrix(auditId);
  return { error: null, success: true };
}

// ============================================================================
// 4) Créer une non-conformité + marquer la page comme NON_COMPLIANT
// ============================================================================
export interface CreateNCInput {
  title: string;
  description: string | null;
  recommendation: string | null;
  severity: NCSeverity;
}

export async function createNonConformity(
  auditId: string,
  pageId: string,
  criteriaId: string,
  input: CreateNCInput,
): Promise<CreateNCResult> {
  const auth = await requireAuditor();
  if ("error" in auth) return { error: auth.error };

  const supabase = await createClient();
  const t = await getTranslations("errors");

  const title = input.title.trim();
  if (!title) return { error: t("titleRequired") };

  // Insertion de la NC
  const { data: nc, error: ncError } = await supabase
    .from("non_conformities")
    .insert({
      audit_id: auditId,
      page_id: pageId,
      criteria_id: criteriaId,
      title,
      description: input.description?.trim() || null,
      recommendation: input.recommendation?.trim() || null,
      severity: input.severity,
      status: "OPEN",
      created_by: auth.userId,
    })
    .select("id")
    .single();

  if (ncError || !nc) {
    return {
      error: t("createNCFailed", { message: ncError?.message ?? "?" }),
    };
  }

  // Marquage du critère en NON_COMPLIANT pour la page
  const { error: confError } = await supabase
    .from("page_conformities")
    .upsert(
      {
        audit_id: auditId,
        page_id: pageId,
        criteria_id: criteriaId,
        status: "NON_COMPLIANT" as ConformityStatus,
      },
      { onConflict: "page_id,criteria_id" },
    );

  if (confError) {
    // Rollback logique : on supprime la NC qu'on vient de créer
    await supabase.from("non_conformities").delete().eq("id", nc.id);
    return {
      error: `Échec de la mise à jour de conformité : ${confError.message}`,
    };
  }

  revalidateMatrix(auditId);
  revalidatePath(`/audits/${auditId}/anomalies`);
  return { error: null, success: true, ncId: nc.id };
}
