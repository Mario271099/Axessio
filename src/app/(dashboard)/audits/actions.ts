"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { requireAnyPermission } from "@/lib/server-permissions";
import { rateLimit, retryAfterSeconds } from "@/lib/rate-limit";
import { PLANS, planLimit, type PlanCode } from "@/lib/billing/plans";
import {
  countActiveAuditsInOrg,
  countAuditsCreatedThisMonthInOrg,
} from "@/lib/billing/usage";
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

export interface BulkAuditsResult {
  error: string | null;
  count?: number;
}

// 30 actions bulk audits / minute. Plus restrictif que NC (60) parce qu'une
// suppression d'audit cascade sur pages/critères/NC : volume potentiellement
// énorme. Borne le débit côté serveur même si le client tente une boucle.
const BULK_AUDITS_LIMIT = 30;
const BULK_AUDITS_WINDOW_MS = 60 * 1000;

// ============================================================================
// Création d'un audit
// ============================================================================
export async function createAudit(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const t = await getTranslations("errors");

  // Legacy (auditor/admin) OU permission d'org `audit.edit` (owner/admin/
  // auditor d'org self-serve). Les gates quota/feature de plan restent en aval.
  // La RLS `audits_insert_auditor` (mig. 78) re-vérifie côté DB.
  const guard = await requireAnyPermission("audit.edit");
  if (!guard.ok) return { error: guard.error };

  const projectId = formData.get("projectId")?.toString();
  const referenceId = formData.get("referenceId")?.toString();
  const platform = formData.get("platform")?.toString() as PlatformType;
  const serviceType = formData.get("serviceType")?.toString() as ServiceType;
  const language = formData.get("language")?.toString() ?? "fr";
  const siteName = formData.get("siteName")?.toString().trim() ?? "";
  const siteUrl = formData.get("siteUrl")?.toString().trim() ?? "";
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
  if (!siteName) fieldErrors.siteName = t("siteNameRequired");
  if (!siteUrl) fieldErrors.siteUrl = t("siteUrlRequired");

  if (Object.keys(fieldErrors).length > 0) {
    return { error: t("fieldErrors"), fieldErrors };
  }

  // Garde-fou serveur : le référentiel RAAM est mobile-only. Si l'UI a
  // été contournée et envoie WEB, on corrige silencieusement plutôt que
  // de rejeter - l'utilisateur ne voit pas l'erreur, on évite une perte
  // de saisie.
  let effectivePlatform: PlatformType = platform;
  if (referenceId) {
    const { data: refRow } = await supabase
      .from("references")
      .select("type")
      .eq("id", referenceId)
      .maybeSingle();
    if (refRow?.type === "RAAM") {
      effectivePlatform = "MOBILE";
    }
  }

  // Validation chronologique : chaque date doit être strictement supérieure
  // à la précédente. Re-check côté serveur - l'UI peut être contournée.
  if (expectedStartAt) {
    const today = new Date();
    const startDate = new Date(expectedStartAt);
    if (
      startDate.getTime() <=
      new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
    ) {
      return { error: t("dateStartBeforeToday") };
    }
  }
  if (
    expectedStartAt &&
    expectedEndAt &&
    new Date(expectedEndAt) <= new Date(expectedStartAt)
  ) {
    return { error: t("dateEndBeforeStart") };
  }
  if (
    expectedEndAt &&
    restitutionAt &&
    new Date(restitutionAt) <= new Date(expectedEndAt)
  ) {
    return { error: t("dateRestitutionBeforeEnd") };
  }
  if (
    restitutionAt &&
    counterAuditAt &&
    new Date(counterAuditAt) <= new Date(restitutionAt)
  ) {
    return { error: t("dateCounterBeforeRestitution") };
  }

  // ============================================================================
  // Limites de plan : `max_active_audits` (concurrents) + `max_audits_per_month`.
  // Le projet détermine l'organisation, et l'organisation détermine le plan.
  // On lit la limite depuis le catalogue TS (`PLANS[plan_code]`) - strictement
  // aligné avec le seed SQL, donc fiable et sans round-trip supplémentaire.
  // ============================================================================
  const { data: projectRow } = await supabase
    .from("projects")
    .select("organization_id")
    .eq("id", projectId!)
    .maybeSingle();
  if (projectRow?.organization_id) {
    const orgId = projectRow.organization_id as string;
    const { data: subRow } = await supabase
      .from("subscriptions")
      .select("plan_code")
      .eq("organization_id", orgId)
      .maybeSingle();
    const planCode: PlanCode =
      subRow?.plan_code && subRow.plan_code in PLANS
        ? (subRow.plan_code as PlanCode)
        : "free";

    const maxActive = planLimit(planCode, "max_active_audits");
    const maxPerMonth = planLimit(planCode, "max_audits_per_month");

    // On parallélise les deux comptages - chacun fait un COUNT(*) léger.
    const [activeCount, monthCount] = await Promise.all([
      maxActive !== null ? countActiveAuditsInOrg(orgId) : Promise.resolve(0),
      maxPerMonth !== null
        ? countAuditsCreatedThisMonthInOrg(orgId)
        : Promise.resolve(0),
    ]);

    if (maxActive !== null && activeCount >= maxActive) {
      return {
        error: t("limitMaxActiveAuditsReached", {
          limit: maxActive,
          plan: PLANS[planCode].name,
        }),
      };
    }
    if (maxPerMonth !== null && monthCount >= maxPerMonth) {
      return {
        error: t("limitMaxAuditsPerMonthReached", {
          limit: maxPerMonth,
          plan: PLANS[planCode].name,
        }),
      };
    }
  }

  const { data: audit, error: auditError } = await supabase
    .from("audits")
    .insert({
      project_id: projectId,
      reference_id: referenceId,
      service_type: serviceType,
      platform: effectivePlatform,
      status: "PENDING" as AuditStatus,
      language,
      site_name: siteName,
      site_url: siteUrl,
      expected_start_at: expectedStartAt,
      expected_end_at: expectedEndAt,
      restitution_at: restitutionAt,
      counter_audit_at: counterAuditAt,
      accessibility_link: accessibilityLink,
      notes,
      created_by: guard.userId,
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

  // Auto-assignation : un auditeur legacy qui crée un audit s'ajoute
  // automatiquement comme assignee (la policy `assignees_self_insert`
  // l'autorise), sinon il perdrait l'accès à son propre audit dès la migration
  // 25 appliquée. Les admins n'en ont pas besoin (is_admin() court-circuite la
  // restriction) ; un owner/auditor d'org self-serve voit déjà son audit via le
  // scope org (accessible_project_ids = organization_id = current_org).
  if (guard.role === "auditor") {
    await supabase.from("audit_assignees").insert({
      audit_id: audit.id,
      profile_id: guard.userId,
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

  const guard = await requireAnyPermission("audit.edit");
  if (!guard.ok) return { error: guard.error };

  const referenceId = formData.get("referenceId")?.toString();
  const platform = formData.get("platform")?.toString() as PlatformType;
  const serviceType = formData.get("serviceType")?.toString() as ServiceType;
  const status = formData.get("status")?.toString() as AuditStatus;
  const language = formData.get("language")?.toString() ?? "fr";
  const siteName = formData.get("siteName")?.toString().trim() ?? "";
  const siteUrl = formData.get("siteUrl")?.toString().trim() ?? "";
  const expectedStartAt = formData.get("expectedStartAt")?.toString() || null;
  const expectedEndAt = formData.get("expectedEndAt")?.toString() || null;
  const restitutionAt = formData.get("restitutionAt")?.toString() || null;
  const counterAuditAt = formData.get("counterAuditAt")?.toString() || null;
  const accessibilityLink =
    formData.get("accessibilityLink")?.toString() || null;
  const notes = formData.get("notes")?.toString() || null;

  // Garde-fou serveur (cohérent avec createAudit) : RAAM → MOBILE forcé.
  let effectivePlatform: PlatformType = platform;
  if (referenceId) {
    const { data: refRow } = await supabase
      .from("references")
      .select("type")
      .eq("id", referenceId)
      .maybeSingle();
    if (refRow?.type === "RAAM") {
      effectivePlatform = "MOBILE";
    }
  }

  const { error } = await supabase
    .from("audits")
    .update({
      reference_id: referenceId,
      platform: effectivePlatform,
      service_type: serviceType,
      status,
      language,
      site_name: siteName || null,
      site_url: siteUrl || null,
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

  // Garde applicative explicite (cohérent avec les autres actions du fichier).
  // La RLS `audits_update_auditor` (mig. 78) reste la 2ᵉ ligne de défense, mais
  // on ne s'appuie pas dessus seule : on refuse tôt et avec un message propre.
  const guard = await requireAnyPermission("audit.edit");
  if (!guard.ok) return { error: guard.error };

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

  const guard = await requireAnyPermission("audit.edit");
  if (!guard.ok) return { error: guard.error };
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

  const guard = await requireAnyPermission("audit.edit");
  if (!guard.ok) return { error: guard.error };
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

  const guard = await requireAnyPermission("audit.edit");
  if (!guard.ok) return { error: guard.error };
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

// ============================================================================
// Actions en masse sur la liste des audits
// ----------------------------------------------------------------------------
// Authentification + rôle vérifiés à chaque action (jamais de confiance dans
// les flags client). Le filtrage RLS reste la deuxième ligne de défense
// (un user ne peut écrire que sur les audits qui passent ses policies).
// ============================================================================
async function requireBulkEditor(): Promise<
  { ok: true; userId: string; role: UserRole } | { ok: false; error: string }
> {
  // Legacy (auditor/admin) OU permission d'org `audit.edit`. La RLS borne
  // ensuite l'écriture aux audits effectivement accessibles à l'utilisateur.
  const guard = await requireAnyPermission("audit.edit");
  if (!guard.ok) return { ok: false, error: guard.error };
  return { ok: true, userId: guard.userId, role: guard.role };
}

async function checkBulkAuditsRateLimit(
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const limit = await rateLimit(
    `bulkAudits:${userId}`,
    BULK_AUDITS_LIMIT,
    BULK_AUDITS_WINDOW_MS,
  );
  if (limit.ok) return { ok: true };
  const t = await getTranslations("errors");
  return {
    ok: false,
    error: t("rateLimited", { seconds: retryAfterSeconds(limit.resetMs) }),
  };
}

function validateAuditIds(
  ids: string[],
): { ok: true } | { ok: false; errorKey: "auditIdMissing" | "bulkNoSelection" } {
  if (!Array.isArray(ids) || ids.length === 0) {
    return { ok: false, errorKey: "bulkNoSelection" };
  }
  return { ok: true };
}

export async function bulkArchiveAudits(
  auditIds: string[],
): Promise<BulkAuditsResult> {
  const auth = await requireBulkEditor();
  if (!auth.ok) return { error: auth.error };

  const rl = await checkBulkAuditsRateLimit(auth.userId);
  if (!rl.ok) return { error: rl.error };

  const t = await getTranslations("errors");
  const guard = validateAuditIds(auditIds);
  if (!guard.ok) return { error: t(guard.errorKey) };

  const supabase = await createClient();
  const { error, count } = await supabase
    .from("audits")
    .update({ status: "ARCHIVED" as AuditStatus }, { count: "exact" })
    .in("id", auditIds);

  if (error) return { error: error.message };

  revalidatePath("/audits");
  revalidatePath("/dashboard");
  return { error: null, count: count ?? 0 };
}

export async function bulkDeleteAudits(
  auditIds: string[],
): Promise<BulkAuditsResult> {
  const auth = await requireBulkEditor();
  if (!auth.ok) return { error: auth.error };

  // Suppression hard réservée au super-admin. canEditAudit() suffit pour
  // l'archivage mais pas pour wiper la donnée - on garde un garde-fou
  // supplémentaire ici.
  if (auth.role !== "admin") {
    const t = await getTranslations("errors");
    return { error: t("forbidden") };
  }

  const rl = await checkBulkAuditsRateLimit(auth.userId);
  if (!rl.ok) return { error: rl.error };

  const t = await getTranslations("errors");
  const guard = validateAuditIds(auditIds);
  if (!guard.ok) return { error: t(guard.errorKey) };

  const supabase = await createClient();
  const { error, count } = await supabase
    .from("audits")
    .delete({ count: "exact" })
    .in("id", auditIds);

  if (error) return { error: error.message };

  revalidatePath("/audits");
  revalidatePath("/dashboard");
  return { error: null, count: count ?? 0 };
}
