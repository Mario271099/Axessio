"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { canCreateNC } from "@/lib/permissions";
import type { ConformityStatus, NCSeverity, UserRole } from "@/types/domain";

export interface CreateNCInput {
  auditId: string;
  pageId: string;
  criteriaId: string;
  title: string;
  description: string | null;
  actualResult: string | null;
  recommendation: string | null;
  severity: NCSeverity;
  /** Référence textuelle du test précis qui a déclenché la NC, ex. `Test 1.1.1`. */
  testReference: string | null;
}

export interface CreateNCResult {
  error: string | null;
  ncId?: string;
}

export async function createNC(
  input: CreateNCInput,
): Promise<CreateNCResult> {
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

  if (!profile?.role || !canCreateNC(profile.role as UserRole)) {
    return { error: t("forbidden") };
  }

  const title = input.title.trim();
  if (!title) return { error: t("titleRequired") };
  if (!input.criteriaId) return { error: t("criterionRequired") };
  if (!input.pageId) return { error: t("pageRequired") };

  // Le test_reference est juste une chaîne libre, mais on borne la longueur
  // pour ne pas accepter d'input dégénéré (le format `Test X.Y.Z` fait <20 ch).
  const testReference = input.testReference?.trim().slice(0, 50) || null;

  const { data: nc, error: ncError } = await supabase
    .from("non_conformities")
    .insert({
      audit_id: input.auditId,
      page_id: input.pageId,
      criteria_id: input.criteriaId,
      title,
      description: input.description?.trim() || null,
      actual_result: input.actualResult?.trim() || null,
      recommendation: input.recommendation?.trim() || null,
      severity: input.severity,
      status: "OPEN",
      created_by: user.id,
      test_reference: testReference,
    })
    .select("id")
    .single();

  if (ncError || !nc) {
    return {
      error: t("createNCFailed", { message: ncError?.message ?? "?" }),
    };
  }

  const { error: confError } = await supabase
    .from("page_conformities")
    .upsert(
      {
        audit_id: input.auditId,
        page_id: input.pageId,
        criteria_id: input.criteriaId,
        status: "NON_COMPLIANT" as ConformityStatus,
      },
      { onConflict: "page_id,criteria_id" },
    );

  if (confError) {
    // Rollback logique : on supprime la NC fraîchement créée pour rester cohérent.
    await supabase.from("non_conformities").delete().eq("id", nc.id);
    return {
      error: t("updateConformityFailed", { message: confError.message }),
    };
  }

  // Une seule invalidation au niveau du layout audit : Next régénère anomalies,
  // matrix et la fiche audit lazily à la prochaine visite, plutôt que de
  // déclencher 3 invalidations explicites.
  revalidatePath("/audits/[uuid]", "layout");

  return { error: null, ncId: nc.id };
}
