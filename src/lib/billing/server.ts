// Helpers serveur billing. Pendant du module `lib/server-permissions.ts` mais
// pour les checks de plan/feature/limit. Ces helpers interrogent les fonctions
// SQL définies dans la migration 50, donc restent cohérents avec ce que les
// futures policies RLS verront.

import "server-only";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import type { FeatureCode, LimitCode, PlanCode } from "@/lib/billing/plans";
import { PLANS } from "@/lib/billing/plans";

// ============================================================================
// Lecture du plan actif
// ============================================================================
export async function getCurrentOrgPlan(): Promise<PlanCode> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("current_org_plan");
  if (error || typeof data !== "string") return "free";
  return (data as PlanCode) in PLANS ? (data as PlanCode) : "free";
}

// ============================================================================
// Feature flags
// ============================================================================
export async function orgHasFeature(code: FeatureCode): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("org_has_feature", {
    p_feature_code: code,
  });
  if (error) return false;
  return data === true;
}

interface FeatureGuardSuccess {
  ok: true;
}
interface FeatureGuardFailure {
  ok: false;
  error: string;
}
export type FeatureGuard = FeatureGuardSuccess | FeatureGuardFailure;

/**
 * À appeler en tête d'une server action pour bloquer une fonctionnalité
 * payante. Retour explicite plutôt que throw - on attend du caller qu'il
 * formate l'erreur côté UI (upsell, modale, etc.).
 */
export async function requireFeature(code: FeatureCode): Promise<FeatureGuard> {
  const t = await getTranslations("errors");
  const ok = await orgHasFeature(code);
  if (!ok) return { ok: false, error: t("planUpgradeRequired") };
  return { ok: true };
}

// ============================================================================
// Limites quantitatives
// ============================================================================
export async function getOrgLimit(code: LimitCode): Promise<number | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("org_limit", {
    p_limit_code: code,
  });
  if (error) return null;
  if (data === null || data === undefined) return null;
  return Number(data);
}

/**
 * Vérifie qu'on reste sous la limite SI on en consomme une unité de plus.
 * Le caller passe l'usage courant (count(audits), count(members), etc.).
 * Une limite NULL signifie "illimité" et renvoie toujours true.
 */
export async function orgWithinLimit(
  code: LimitCode,
  currentUsage: number,
): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("org_within_limit", {
    p_limit_code: code,
    p_current_usage: currentUsage,
  });
  if (error) return false;
  return data === true;
}

// ============================================================================
// Lecture de la subscription (page billing)
// ============================================================================
export interface OrgSubscriptionRow {
  planCode: PlanCode;
  status: string;
  billingInterval: "monthly" | "yearly" | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
}

export async function getOrgSubscription(
  organizationId: string,
): Promise<OrgSubscriptionRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      "plan_code, status, billing_interval, current_period_end, cancel_at_period_end, stripe_customer_id",
    )
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    planCode: data.plan_code as PlanCode,
    status: data.status,
    billingInterval: data.billing_interval as "monthly" | "yearly" | null,
    currentPeriodEnd: data.current_period_end,
    cancelAtPeriodEnd: data.cancel_at_period_end,
    stripeCustomerId: data.stripe_customer_id,
  };
}
