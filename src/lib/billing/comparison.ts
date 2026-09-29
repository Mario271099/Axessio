// Structure du tableau comparatif de /pricing. Seules les lignes et leur
// regroupement sont décrits ici : les valeurs de chaque cellule sont lues
// dans `PLANS` (via `planLimit` / `planHasFeature`) au rendu.

import {
  planHasFeature,
  previousPlan,
  type FeatureCode,
  type LimitCode,
  type PlanCode,
} from "./plans";

/**
 * `key` est la clé i18n de la ligne (`pricing.compare.rows.<key>`).
 * Une ligne `feature` sans code est incluse dans tous les plans : ce sont des
 * fonctions du socle, que le catalogue ne restreint pas.
 */
export type ComparisonRow =
  | { kind: "limit"; key: string; limit: LimitCode }
  | { kind: "feature"; key: string; features: ReadonlyArray<FeatureCode> };

export interface ComparisonGroup {
  /** Clé i18n du groupe (`pricing.compare.groups.<key>`). */
  key: string;
  rows: ReadonlyArray<ComparisonRow>;
}

export const COMPARISON_GROUPS: ReadonlyArray<ComparisonGroup> = [
  {
    key: "limits",
    rows: [
      { kind: "limit", key: "activeAudits", limit: "max_active_audits" },
      { kind: "limit", key: "auditsPerMonth", limit: "max_audits_per_month" },
      { kind: "limit", key: "members", limit: "max_members" },
      { kind: "limit", key: "clients", limit: "max_clients" },
    ],
  },
  {
    key: "audit",
    rows: [
      { kind: "feature", key: "standards", features: [] },
      { kind: "feature", key: "matrix", features: [] },
      { kind: "feature", key: "nonConformities", features: [] },
      { kind: "feature", key: "exportPdf", features: ["export.pdf"] },
      {
        kind: "feature",
        key: "simulator",
        features: ["remediation.simulator"],
      },
    ],
  },
  {
    key: "team",
    rows: [
      {
        kind: "feature",
        key: "proofreading",
        features: ["audit.proofreading"],
      },
      {
        kind: "feature",
        key: "collaboration",
        features: ["audit.collaboration"],
      },
    ],
  },
  {
    key: "security",
    rows: [
      { kind: "feature", key: "dataIsolation", features: [] },
      {
        kind: "feature",
        key: "auditLogsExport",
        features: ["audit_logs.export"],
      },
      { kind: "feature", key: "webhooks", features: ["webhooks.outgoing"] },
      { kind: "feature", key: "api", features: ["api.access"] },
      { kind: "feature", key: "sso", features: ["sso.saml", "sso.oidc"] },
      { kind: "feature", key: "scim", features: ["scim.provisioning"] },
      { kind: "feature", key: "branding", features: ["branding.custom"] },
    ],
  },
  {
    key: "support",
    rows: [
      { kind: "feature", key: "support", features: ["support.priority"] },
    ],
  },
];

type FeatureRow = Extract<ComparisonRow, { kind: "feature" }>;

const FEATURE_ROWS: ReadonlyArray<FeatureRow> = COMPARISON_GROUPS.flatMap(
  (group) =>
    group.rows.filter((row): row is FeatureRow => row.kind === "feature"),
);

/** Vrai si le plan possède toutes les fonctionnalités de la ligne. */
export function planIncludesRow(plan: PlanCode, row: FeatureRow): boolean {
  return row.features.every((feature) => planHasFeature(plan, feature));
}

/** Lignes du socle, incluses dans tous les plans. */
export const CORE_ROWS: ReadonlyArray<FeatureRow> = FEATURE_ROWS.filter(
  (row) => row.features.length === 0,
);

/**
 * Lignes qu'un plan ajoute au plan précédent de `PLAN_ORDER`. Pour le premier
 * plan, ce sont les lignes du socle.
 */
export function rowsAddedByPlan(plan: PlanCode): FeatureRow[] {
  const previous = previousPlan(plan);
  if (!previous) return [...CORE_ROWS];
  return FEATURE_ROWS.filter(
    (row) =>
      row.features.length > 0 &&
      planIncludesRow(plan, row) &&
      !planIncludesRow(previous, row),
  );
}
