"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ConformityStatus, NCSeverity } from "@/types/domain";

export interface CreateNCInput {
  auditId: string;
  pageId: string;
  criteriaId: string;
  title: string;
  description: string | null;
  actualResult: string | null;
  recommendation: string | null;
  severity: NCSeverity;
}

export interface CreateNCResult {
  error: string | null;
  ncId?: string;
}

// ============================================================================
// Crée une NC standalone :
//   1) INSERT non_conformities
//   2) UPSERT page_conformities en NON_COMPLIANT pour la page + critère
// Renvoie { ncId } : la navigation vers /anomalies/[ncId] est faite côté
// client après l'éventuel upload des captures.
// Réservé aux auditeurs.
// ============================================================================
export async function createNC(
  input: CreateNCInput,
): Promise<CreateNCResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "auditor") {
    return { error: "Seuls les auditeurs peuvent créer une non-conformité." };
  }

  const title = input.title.trim();
  if (!title) return { error: "Le titre est requis." };
  if (!input.criteriaId) return { error: "Le critère est requis." };
  if (!input.pageId) return { error: "La page est requise." };

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
    })
    .select("id")
    .single();

  if (ncError || !nc) {
    return {
      error: `Échec de la création de la non-conformité : ${ncError?.message ?? "inconnue"}`,
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
      error: `Échec de la mise à jour de conformité : ${confError.message}`,
    };
  }

  revalidatePath(`/audits/${input.auditId}/anomalies`);
  revalidatePath(`/audits/${input.auditId}/matrix`);
  revalidatePath(`/audits/${input.auditId}`);

  return { error: null, ncId: nc.id };
}
