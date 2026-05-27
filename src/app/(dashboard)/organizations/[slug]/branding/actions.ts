"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { orgHasFeature } from "@/lib/billing/server";
import { updateOrgBranding } from "@/lib/branding/server";

export interface BrandingActionResult {
  error: string | null;
  success?: boolean;
}

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Hostname permissif : labels alphanumériques + tirets, séparés par des points.
const DOMAIN = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

function normalize(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export async function saveBranding(
  organizationId: string,
  formData: FormData,
): Promise<BrandingActionResult> {
  const supabase = await createClient();
  const t = await getTranslations("errors");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: t("notAuthenticated") };

  // 1. Garde par rôle org (owner/admin).
  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return { error: t("forbidden") };
  }

  // 2. Garde par plan (Enterprise uniquement). On switch côté code parce que
  //    le user qui sauvegarde DOIT être sur l'org active — sinon `current_org`
  //    serait une autre org. La page d'édition fait déjà le switch implicite
  //    via le slug, donc dans la pratique current_org() == organizationId.
  const enabled = await orgHasFeature("branding.custom");
  if (!enabled) return { error: t("planUpgradeRequired") };

  // 3. Lecture + validation.
  const logoUrl = normalize(formData.get("logoUrl"));
  const primaryColor = normalize(formData.get("primaryColor"));
  const accentColor = normalize(formData.get("accentColor"));
  const supportEmail = normalize(formData.get("supportEmail"));
  const customDomain = normalize(formData.get("customDomain"));

  if (primaryColor && !HEX_COLOR.test(primaryColor))
    return { error: t("invalidColorFormat") };
  if (accentColor && !HEX_COLOR.test(accentColor))
    return { error: t("invalidColorFormat") };
  if (supportEmail && !EMAIL.test(supportEmail))
    return { error: t("emailInvalid") };
  if (customDomain && !DOMAIN.test(customDomain))
    return { error: t("invalidDomainFormat") };
  if (logoUrl && !/^https?:\/\//i.test(logoUrl))
    return { error: t("invalidUrl") };

  // 4. Persistance.
  const { error } = await updateOrgBranding(organizationId, {
    logoUrl,
    primaryColor: primaryColor ? primaryColor.toLowerCase() : null,
    accentColor: accentColor ? accentColor.toLowerCase() : null,
    supportEmail,
    customDomain: customDomain ? customDomain.toLowerCase() : null,
  });
  if (error) return { error };

  // 5. Revalidation : tout le layout dépend du branding.
  revalidatePath("/", "layout");
  return { error: null, success: true };
}

export async function resetBranding(
  organizationId: string,
): Promise<BrandingActionResult> {
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

  const { error } = await updateOrgBranding(organizationId, {
    logoUrl: null,
    primaryColor: null,
    accentColor: null,
    supportEmail: null,
    customDomain: null,
  });
  if (error) return { error };

  revalidatePath("/", "layout");
  return { error: null, success: true };
}
