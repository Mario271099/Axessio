// Helpers serveur pour le branding personnalisé par organisation.
// Gating : la feature `branding.custom` (cf. plan_features migration 49)
// doit être présente sur le plan de l'org. Sinon les helpers renvoient null.

import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { orgHasFeature } from "@/lib/billing/server";
import { PLANS, planHasFeature, type PlanCode } from "@/lib/billing/plans";
import {
  AXESSIO_DEFAULT_OUTPUT_BRANDING,
  sanitizeHexColor,
  sanitizeLogoUrl,
  type OutputBranding,
} from "./output";
import type { OrgBranding } from "@/types/domain";

interface BrandingRow {
  logo_url: string | null;
  primary_color: string | null;
  accent_color: string | null;
  support_email: string | null;
  custom_domain: string | null;
}

function fromRow(row: BrandingRow | null | undefined): OrgBranding | null {
  if (!row) return null;
  return {
    logoUrl: row.logo_url,
    primaryColor: row.primary_color,
    accentColor: row.accent_color,
    supportEmail: row.support_email,
    customDomain: row.custom_domain,
  };
}

/**
 * Lit le branding de l'org active si son plan inclut `branding.custom`.
 * Retourne null sinon — c'est ce qui sert de gate côté UI (si null →
 * fallback sur les valeurs par défaut Axessyo).
 */
export async function getCurrentOrgBranding(): Promise<OrgBranding | null> {
  const hasFeature = await orgHasFeature("branding.custom");
  if (!hasFeature) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("current_org_branding");
  if (error || !Array.isArray(data) || data.length === 0) return null;
  return fromRow(data[0] as BrandingRow);
}

/**
 * Variante "par org_id" — utilisée par la page d'édition du branding où
 * on connaît l'org cible par son slug. Ne fait PAS le check de feature
 * (le caller le fait juste avant pour afficher un message d'upsell).
 */
export async function getOrgBrandingById(
  organizationId: string,
): Promise<OrgBranding | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("organizations")
    .select("logo_url, primary_color, accent_color, support_email, custom_domain")
    .eq("id", organizationId)
    .maybeSingle();
  return fromRow(data as BrandingRow | null);
}

/**
 * Résout le branding d'une org pour les sorties hors-session (emails, PDF,
 * cron). Contrairement à `getCurrentOrgBranding`, ne dépend PAS de
 * `current_org()` : on passe l'org cible explicitement et on lit son plan via
 * `subscriptions` (la feature `branding.custom` gate l'application).
 *
 * Renvoie TOUJOURS un objet valide : si l'org n'a pas la feature, ou si une
 * valeur manque, on retombe sur les défauts Axessyo. Le caller n'a donc jamais
 * à gérer le cas null.
 */
export async function resolveOutputBranding(
  organizationId: string | null | undefined,
): Promise<OutputBranding> {
  if (!organizationId) return AXESSIO_DEFAULT_OUTPUT_BRANDING;

  const admin = createAdminClient();

  // 1) Le plan de l'org doit inclure `branding.custom`.
  const { data: sub } = await admin
    .from("subscriptions")
    .select("plan_code")
    .eq("organization_id", organizationId)
    .maybeSingle();
  const planCode: PlanCode =
    sub?.plan_code && (sub.plan_code as string) in PLANS
      ? (sub.plan_code as PlanCode)
      : "free";
  if (!planHasFeature(planCode, "branding.custom")) {
    return AXESSIO_DEFAULT_OUTPUT_BRANDING;
  }

  // 2) Lecture du nom + colonnes branding.
  const { data: org } = await admin
    .from("organizations")
    .select("name, logo_url, primary_color, support_email")
    .eq("id", organizationId)
    .maybeSingle();
  if (!org) return AXESSIO_DEFAULT_OUTPUT_BRANDING;

  const brandName = (org.name as string | null)?.trim() || "Axessyo";
  return {
    brandName,
    logoUrl: sanitizeLogoUrl(org.logo_url as string | null),
    primaryColor: sanitizeHexColor(org.primary_color as string | null),
    // Pas de tagline Axessyo sur une marque cliente (white-label).
    tagline: null,
    supportEmail: (org.support_email as string | null)?.trim() || null,
    isCustom: true,
  };
}

interface UpdateInput {
  logoUrl?: string | null;
  primaryColor?: string | null;
  accentColor?: string | null;
  supportEmail?: string | null;
  customDomain?: string | null;
}

/**
 * Persiste les champs branding. Passe par la service-role parce que les
 * triggers d'`organizations` (validate_profile_current_org etc.) ne
 * concernent que les colonnes membership — donc safe.
 */
export async function updateOrgBranding(
  organizationId: string,
  patch: UpdateInput,
): Promise<{ error: string | null }> {
  const admin = createAdminClient();
  const update: Record<string, string | null> = {};
  if (patch.logoUrl !== undefined) update.logo_url = patch.logoUrl;
  if (patch.primaryColor !== undefined) update.primary_color = patch.primaryColor;
  if (patch.accentColor !== undefined) update.accent_color = patch.accentColor;
  if (patch.supportEmail !== undefined) update.support_email = patch.supportEmail;
  if (patch.customDomain !== undefined) update.custom_domain = patch.customDomain;

  const { error } = await admin
    .from("organizations")
    .update(update)
    .eq("id", organizationId);

  return { error: error?.message ?? null };
}
