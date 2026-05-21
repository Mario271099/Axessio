"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { canEditAudit } from "@/lib/permissions";
import { MANDATORY_PAGES } from "@/types/domain";
import type {
  AuditStatus,
  ComplexityLevel,
  PageType,
  PlatformType,
  ServiceType,
  UserRole,
} from "@/types/domain";

export interface ActionState {
  error: string | null;
  fieldErrors?: Record<string, string>;
  success?: boolean;
}

// ============================================================================
// Création d'un audit
// ============================================================================
export async function createAudit(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
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

  if (!profile?.role || !canEditAudit(profile.role as UserRole)) {
    return { error: t("forbidden") };
  }

  const projectId = formData.get("projectId")?.toString();
  const referenceId = formData.get("referenceId")?.toString();
  const platform = formData.get("platform")?.toString() as PlatformType;
  const serviceType = formData.get("serviceType")?.toString() as ServiceType;
  const language = formData.get("language")?.toString() ?? "fr";
  const expectedStartAt = formData.get("expectedStartAt")?.toString() || null;
  const expectedEndAt = formData.get("expectedEndAt")?.toString() || null;
  const restitutionAt = formData.get("restitutionAt")?.toString() || null;
  const counterAuditAt = formData.get("counterAuditAt")?.toString() || null;
  const accessibilityLink =
    formData.get("accessibilityLink")?.toString() || null;
  const notes = formData.get("notes")?.toString() || null;

  const fieldErrors: Record<string, string> = {};
  if (!projectId) fieldErrors.projectId = t("selectProject");
  if (!referenceId) fieldErrors.referenceId = t("selectReference");
  if (!platform) fieldErrors.platform = t("selectPlatform");
  if (!serviceType) fieldErrors.serviceType = t("selectServiceType");

  if (Object.keys(fieldErrors).length > 0) {
    return { error: t("fieldErrors"), fieldErrors };
  }

  const { data: audit, error: auditError } = await supabase
    .from("audits")
    .insert({
      project_id: projectId,
      reference_id: referenceId,
      service_type: serviceType,
      platform,
      status: "PENDING" as AuditStatus,
      language,
      expected_start_at: expectedStartAt,
      expected_end_at: expectedEndAt,
      restitution_at: restitutionAt,
      counter_audit_at: counterAuditAt,
      accessibility_link: accessibilityLink,
      notes,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (auditError || !audit) {
    return {
      error: t("createAuditFailed", { message: auditError?.message ?? "?" }),
    };
  }

  // Pages obligatoires + Éléments transverses
  const mandatoryPagesPayload = MANDATORY_PAGES.map((page, index) => ({
    audit_id: audit.id,
    name: page.name,
    page_type: "MANDATORY" as PageType,
    sort_order: index,
  }));

  const transversalPagePayload = {
    audit_id: audit.id,
    name: "Éléments transverses",
    page_type: "TRANSVERSAL" as PageType,
    sort_order: 99,
  };

  const { error: pagesError } = await supabase
    .from("pages")
    .insert([...mandatoryPagesPayload, transversalPagePayload]);

  if (pagesError) {
    // Un audit sans page obligatoire est inutilisable (la matrice plante,
    // l'échantillon est vide). On rollback en supprimant l'audit fraîchement
    // créé pour rester cohérent au lieu de laisser un état partiel.
    console.error("[createAudit] Pages obligatoires non créées:", pagesError);
    await supabase.from("audits").delete().eq("id", audit.id);
    return {
      error: t("createAuditFailed", { message: pagesError.message }),
    };
  }

  // Auto-assignation : un auditeur qui crée un audit s'ajoute automatiquement
  // comme assignee (la policy `assignees_self_insert` l'autorise), sinon il
  // perdrait l'accès à son propre audit dès la migration 25 appliquée. Les
  // admins n'en ont pas besoin (is_admin() court-circuite la restriction).
  if (profile.role === "auditor") {
    await supabase.from("audit_assignees").insert({
      audit_id: audit.id,
      profile_id: user.id,
      role: "auditor",
    });
  }

  revalidatePath("/audits");
  revalidatePath("/dashboard");
  redirect(`/audits/${audit.id}`);
}

// ============================================================================
// Mise à jour d'un audit (édition)
// ============================================================================
export async function updateAudit(
  auditId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
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

  if (!profile?.role || !canEditAudit(profile.role as UserRole)) {
    return { error: t("forbidden") };
  }

  const referenceId = formData.get("referenceId")?.toString();
  const platform = formData.get("platform")?.toString() as PlatformType;
  const serviceType = formData.get("serviceType")?.toString() as ServiceType;
  const status = formData.get("status")?.toString() as AuditStatus;
  const language = formData.get("language")?.toString() ?? "fr";
  const expectedStartAt = formData.get("expectedStartAt")?.toString() || null;
  const expectedEndAt = formData.get("expectedEndAt")?.toString() || null;
  const restitutionAt = formData.get("restitutionAt")?.toString() || null;
  const counterAuditAt = formData.get("counterAuditAt")?.toString() || null;
  const accessibilityLink =
    formData.get("accessibilityLink")?.toString() || null;
  const notes = formData.get("notes")?.toString() || null;

  const { error } = await supabase
    .from("audits")
    .update({
      reference_id: referenceId,
      platform,
      service_type: serviceType,
      status,
      language,
      expected_start_at: expectedStartAt,
      expected_end_at: expectedEndAt,
      restitution_at: restitutionAt,
      counter_audit_at: counterAuditAt,
      accessibility_link: accessibilityLink,
      notes,
    })
    .eq("id", auditId);

  if (error) return { error: error.message };

  revalidatePath(`/audits/${auditId}`);
  revalidatePath("/audits");
  return { error: null, success: true };
}

// ============================================================================
// Archivage d'un audit
// ============================================================================
export async function archiveAudit(auditId: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("audits")
    .update({ status: "ARCHIVED" })
    .eq("id", auditId);

  if (error) return { error: error.message };

  revalidatePath("/audits");
  return { error: null, success: true };
}

// ============================================================================
// Ajout d'une page (avec URL et complexité)
// ============================================================================
export async function addPage(
  auditId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
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

  if (!profile?.role || !canEditAudit(profile.role as UserRole)) {
    return { error: t("forbidden") };
  }
  const name = formData.get("name")?.toString().trim();
  const url = formData.get("url")?.toString().trim() || null;
  const complexityValue = formData.get("complexity")?.toString();
  const complexity =
    complexityValue && complexityValue !== "NONE"
      ? (complexityValue as ComplexityLevel)
      : null;

  if (!name) return { error: t("pageNameRequired") };

  const { data: maxRow } = await supabase
    .from("pages")
    .select("sort_order")
    .eq("audit_id", auditId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = (maxRow?.sort_order ?? 0) + 1;

  const { error } = await supabase.from("pages").insert({
    audit_id: auditId,
    name,
    url,
    page_type: "REPRESENTATIVE" as PageType,
    complexity,
    sort_order: nextOrder,
  });

  if (error) return { error: error.message };

  revalidatePath(`/audits/${auditId}`);
  revalidatePath(`/audits/${auditId}/sample`);
  return { error: null, success: true };
}

// ============================================================================
// Mise à jour d'une page (URL, nom, complexité)
// ============================================================================
export async function updatePage(
  pageId: string,
  auditId: string,
  formData: FormData,
): Promise<ActionState> {
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

  if (!profile?.role || !canEditAudit(profile.role as UserRole)) {
    return { error: t("forbidden") };
  }
  const name = formData.get("name")?.toString().trim();
  const url = formData.get("url")?.toString().trim() || null;
  const complexityValue = formData.get("complexity")?.toString();
  const complexity =
    complexityValue && complexityValue !== "NONE"
      ? (complexityValue as ComplexityLevel)
      : null;

  if (!name) return { error: t("pageNameRequired") };

  const { error } = await supabase
    .from("pages")
    .update({ name, url, complexity })
    .eq("id", pageId);

  if (error) return { error: error.message };

  revalidatePath(`/audits/${auditId}/sample`);
  return { error: null, success: true };
}

// ============================================================================
// Suppression d'une page (TOUTES les pages désormais, sauf transversale)
// ============================================================================
export async function deletePage(
  pageId: string,
  auditId: string,
): Promise<ActionState> {
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

  if (!profile?.role || !canEditAudit(profile.role as UserRole)) {
    return { error: t("forbidden") };
  }
  // On empêche uniquement la suppression de la page transversale (techniquement nécessaire)
  const { data: page } = await supabase
    .from("pages")
    .select("page_type")
    .eq("id", pageId)
    .maybeSingle();

  if (page?.page_type === "TRANSVERSAL") {
    return { error: t("transversalCantBeDeleted") };
  }

  const { error } = await supabase.from("pages").delete().eq("id", pageId);
  if (error) return { error: error.message };

  revalidatePath(`/audits/${auditId}/sample`);
  return { error: null, success: true };
}
