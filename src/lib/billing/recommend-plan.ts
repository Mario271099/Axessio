// Recommandation de plan pour le bloc « Quel plan pour vous ? » de /pricing.
// Fonctions pures : aucune valeur n'est recopiée ici, tout est lu dans le
// catalogue `PLANS` via `planLimit` / `planHasFeature`.

import {
  PLAN_ORDER,
  planHasFeature,
  planLimit,
  previousPlan,
  type FeatureCode,
  type PlanCode,
} from "./plans";

export interface PlanNeeds {
  /** Nombre d'audits actifs en même temps. */
  activeAudits: number;
  /** Nombre de personnes dans l'équipe. */
  members: number;
  /** Fonctionnalités indispensables. */
  features: ReadonlyArray<FeatureCode>;
}

/**
 * Besoins proposés en cases à cocher. `key` sert de clé i18n
 * (`pricing.finder.needs.<key>`), `features` liste les fonctionnalités que la
 * case exige : toutes doivent être présentes dans le plan.
 */
export const PLAN_NEED_OPTIONS = [
  { key: "pdf", features: ["export.pdf"] },
  { key: "review", features: ["audit.proofreading", "audit.collaboration"] },
  { key: "sso", features: ["sso.saml", "scim.provisioning", "api.access"] },
] as const satisfies ReadonlyArray<{
  key: string;
  features: ReadonlyArray<FeatureCode>;
}>;

export type PlanNeedKey = (typeof PLAN_NEED_OPTIONS)[number]["key"];

function withinLimit(limit: number | null, value: number): boolean {
  return limit === null || value <= limit;
}

/** Vrai si le plan couvre les volumes et possède toutes les fonctionnalités. */
export function planCoversNeeds(plan: PlanCode, needs: PlanNeeds): boolean {
  return (
    withinLimit(planLimit(plan, "max_active_audits"), needs.activeAudits) &&
    withinLimit(planLimit(plan, "max_members"), needs.members) &&
    needs.features.every((feature) => planHasFeature(plan, feature))
  );
}

/**
 * Premier plan de `PLAN_ORDER` qui couvre les besoins. Si aucun ne les
 * couvre, on retombe sur le dernier plan (le plus complet).
 */
export function recommendPlan(needs: PlanNeeds): PlanCode {
  return (
    PLAN_ORDER.find((plan) => planCoversNeeds(plan, needs)) ??
    // Le catalogue n'est jamais vide.
    (PLAN_ORDER[PLAN_ORDER.length - 1] as PlanCode)
  );
}

/** Fonctionnalités exigées par une sélection de cases. */
export function featuresForNeeds(
  selected: ReadonlyArray<PlanNeedKey>,
): FeatureCode[] {
  return PLAN_NEED_OPTIONS.filter((option) =>
    selected.includes(option.key),
  ).flatMap((option) => option.features);
}

/**
 * Pourquoi ce plan plutôt que le précédent :
 *  - `base` : c'est le premier plan, il suffit ;
 *  - `feature` : le plan précédent n'a pas cette fonctionnalité ;
 *  - `limits` : le plan précédent a les fonctionnalités mais pas le volume.
 */
export type RecommendationReason =
  | { kind: "base" }
  | { kind: "feature"; feature: FeatureCode }
  | { kind: "limits"; previous: PlanCode };

export function recommendationReason(
  plan: PlanCode,
  needs: PlanNeeds,
): RecommendationReason {
  const previous = previousPlan(plan);
  if (!previous) return { kind: "base" };
  const missing = needs.features.find(
    (feature) => !planHasFeature(previous, feature),
  );
  if (missing) return { kind: "feature", feature: missing };
  return { kind: "limits", previous };
}
