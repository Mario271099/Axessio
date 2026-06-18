"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { requireAnyPermission } from "@/lib/server-permissions";
import type { ConformityStatus, NCSeverity } from "@/types/domain";

export interface CreateNCInput {
  auditId: string;
  pageId: string;
  criteriaId: string;
  description: string;
  recommendation: string;
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
  const t = await getTranslations("errors");

  const guard = await requireAnyPermission("nc.create");
  if (!guard.ok) return { error: guard.error };

  const supabase = await createClient();

  if (!input.criteriaId) return { error: t("criterionRequired") };
  if (!input.pageId) return { error: t("pageRequired") };
  const description = input.description.trim();
  const recommendation = input.recommendation.trim();
  if (!description) return { error: t("requiredField", { field: "description" }) };
  if (!recommendation) return { error: t("requiredField", { field: "recommendation" }) };

  // Le test_reference est juste une chaîne libre, mais on borne la longueur
  // pour ne pas accepter d'input dégénéré (le format `Test X.Y.Z` fait <20 ch).
  const testReference = input.testReference?.trim().slice(0, 50) || null;

  // Le titre est généré côté serveur depuis le critère + référence de test.
  // L'utilisateur n'a plus à le saisir - la description porte le contenu
  // descriptif réel. Format : "1.1 - Test 1.1.5" ou "1.1 - {nom critère}".
  const { data: criterion } = await supabase
    .from("criteria")
    .select("identifier, name")
    .eq("id", input.criteriaId)
    .maybeSingle();
  if (!criterion) return { error: t("criterionRequired") };
  const autoTitle = testReference
    ? `${criterion.identifier} - ${testReference}`
    : `${criterion.identifier} - ${criterion.name as string}`;
  // Borne dure pour ne pas dépasser la limite raisonnable d'un titre (la
  // colonne est text, mais l'UI affiche tronqué au-delà de 200 ch).
  const title = autoTitle.slice(0, 200);

  const { data: nc, error: ncError } = await supabase
    .from("non_conformities")
    .insert({
      audit_id: input.auditId,
      page_id: input.pageId,
      criteria_id: input.criteriaId,
      title,
      description,
      recommendation,
      severity: input.severity,
      status: "OPEN",
      created_by: guard.userId,
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
