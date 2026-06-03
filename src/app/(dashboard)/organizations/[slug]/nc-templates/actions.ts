"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import type { NCSeverity, NCTemplate } from "@/types/domain";

export interface NCTemplateActionResult {
  error: string | null;
  success?: boolean;
}

const VALID_SEVERITIES: NCSeverity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

// ============================================================================
// Garde commune : admin/owner de l'org seulement. Le super-admin plateforme
// passe aussi (via is_admin() côté RLS). Les autres reçoivent un 403.
// ============================================================================
async function requireOrgAdmin(
  organizationId: string,
): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const t = await getTranslations("errors");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: t("notAuthenticated") };

  // Super-admin plateforme : bypass de la check de membership.
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.is_platform_admin) return { ok: true, userId: user.id };

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return { ok: false, error: t("forbidden") };
  }
  return { ok: true, userId: user.id };
}

interface TemplateInput {
  label: string;
  referenceId: string | null;
  criterionId: string | null;
  severity: NCSeverity;
  titleTemplate: string;
  descriptionTemplate: string | null;
  recommendationTemplate: string | null;
}

// ============================================================================
// Parsing FormData → TemplateInput, avec validation des champs requis.
// On ne fait pas confiance aux valeurs brutes du form (un user peut éditer
// le HTML pour soumettre une sévérité inventée).
// ============================================================================
function parseTemplateFromFormData(
  formData: FormData,
): { ok: true; value: TemplateInput } | { ok: false; field: string } {
  const label = (formData.get("label") as string | null)?.trim() ?? "";
  const titleTemplate =
    (formData.get("titleTemplate") as string | null)?.trim() ?? "";
  const severityRaw = (formData.get("severity") as string | null) ?? "MEDIUM";
  const referenceIdRaw =
    (formData.get("referenceId") as string | null)?.trim() ?? "";
  const criterionIdRaw =
    (formData.get("criterionId") as string | null)?.trim() ?? "";
  const description =
    (formData.get("descriptionTemplate") as string | null)?.trim() ?? "";
  const recommendation =
    (formData.get("recommendationTemplate") as string | null)?.trim() ?? "";

  if (!label) return { ok: false, field: "label" };
  if (!titleTemplate) return { ok: false, field: "titleTemplate" };
  if (!VALID_SEVERITIES.includes(severityRaw as NCSeverity)) {
    return { ok: false, field: "severity" };
  }

  return {
    ok: true,
    value: {
      label,
      titleTemplate,
      descriptionTemplate: description || null,
      recommendationTemplate: recommendation || null,
      severity: severityRaw as NCSeverity,
      referenceId: referenceIdRaw || null,
      criterionId: criterionIdRaw || null,
    },
  };
}

// ============================================================================
// createNCTemplate
// ============================================================================
export async function createNCTemplate(
  organizationId: string,
  formData: FormData,
): Promise<NCTemplateActionResult> {
  const t = await getTranslations("errors");
  const guard = await requireOrgAdmin(organizationId);
  if (!guard.ok) return { error: guard.error };

  const parsed = parseTemplateFromFormData(formData);
  if (!parsed.ok) return { error: t("requiredField", { field: parsed.field }) };

  const supabase = await createClient();
  const { error } = await supabase.from("nc_templates").insert({
    organization_id: organizationId,
    created_by: guard.userId,
    label: parsed.value.label,
    reference_id: parsed.value.referenceId,
    criterion_id: parsed.value.criterionId,
    severity: parsed.value.severity,
    title_template: parsed.value.titleTemplate,
    description_template: parsed.value.descriptionTemplate,
    recommendation_template: parsed.value.recommendationTemplate,
  });
  if (error) return { error: error.message };

  revalidatePath(`/organizations/${organizationId}/nc-templates`);
  return { error: null, success: true };
}

// ============================================================================
// updateNCTemplate
// ============================================================================
export async function updateNCTemplate(
  organizationId: string,
  templateId: string,
  formData: FormData,
): Promise<NCTemplateActionResult> {
  const t = await getTranslations("errors");
  const guard = await requireOrgAdmin(organizationId);
  if (!guard.ok) return { error: guard.error };

  const parsed = parseTemplateFromFormData(formData);
  if (!parsed.ok) return { error: t("requiredField", { field: parsed.field }) };

  const supabase = await createClient();
  const { error } = await supabase
    .from("nc_templates")
    .update({
      label: parsed.value.label,
      reference_id: parsed.value.referenceId,
      criterion_id: parsed.value.criterionId,
      severity: parsed.value.severity,
      title_template: parsed.value.titleTemplate,
      description_template: parsed.value.descriptionTemplate,
      recommendation_template: parsed.value.recommendationTemplate,
    })
    .eq("id", templateId)
    .eq("organization_id", organizationId);
  if (error) return { error: error.message };

  revalidatePath(`/organizations/${organizationId}/nc-templates`);
  return { error: null, success: true };
}

// ============================================================================
// deleteNCTemplate
// ============================================================================
export async function deleteNCTemplate(
  organizationId: string,
  templateId: string,
): Promise<NCTemplateActionResult> {
  const guard = await requireOrgAdmin(organizationId);
  if (!guard.ok) return { error: guard.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("nc_templates")
    .delete()
    .eq("id", templateId)
    .eq("organization_id", organizationId);
  if (error) return { error: error.message };

  revalidatePath(`/organizations/${organizationId}/nc-templates`);
  return { error: null, success: true };
}

// ============================================================================
// listNCTemplatesForAudit — utilisée par le picker côté NC form
// ----------------------------------------------------------------------------
// Renvoie les templates de l'org propriétaire de l'audit, filtrés à ceux
// qui sont compatibles avec le référentiel de l'audit :
//   - referenceId NULL → universel (toujours montré)
//   - referenceId = celui de l'audit → spécifique
// Trié par label pour faciliter la recherche visuelle.
// ============================================================================
export async function listNCTemplatesForAudit(
  auditId: string,
): Promise<NCTemplate[]> {
  const supabase = await createClient();

  const { data: audit } = await supabase
    .from("audits")
    .select("organization_id, reference_id")
    .eq("id", auditId)
    .maybeSingle();
  if (!audit) return [];

  const { data, error } = await supabase
    .from("nc_templates")
    .select(
      "id, organization_id, label, reference_id, criterion_id, severity, title_template, description_template, recommendation_template, created_at, updated_at",
    )
    .eq("organization_id", audit.organization_id)
    .or(`reference_id.is.null,reference_id.eq.${audit.reference_id}`)
    .order("label", { ascending: true });

  if (error || !data) return [];

  return data.map(
    (r): NCTemplate => ({
      id: r.id as string,
      organizationId: r.organization_id as string,
      label: r.label as string,
      referenceId: (r.reference_id as string | null) ?? null,
      criterionId: (r.criterion_id as string | null) ?? null,
      severity: r.severity as NCSeverity,
      titleTemplate: r.title_template as string,
      descriptionTemplate: (r.description_template as string | null) ?? null,
      recommendationTemplate:
        (r.recommendation_template as string | null) ?? null,
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string,
    }),
  );
}
