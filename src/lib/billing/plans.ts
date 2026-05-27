// Catalogue de plans côté code — strictement aligné sur le seed SQL de la
// migration 49. Sert de source de vérité pour le rendu UI (labels, prix
// affichés, ordre des cards) et pour les helpers de feature/limit côté
// client. Côté serveur, préférer `org_has_feature()` SQL.

export type PlanCode = "free" | "starter" | "pro" | "enterprise";

export type FeatureCode =
  // Audit
  | "export.pdf"
  | "audit.proofreading"
  | "audit.collaboration"
  | "remediation.simulator"
  // Diagnostic / API
  | "audit_logs.export"
  | "webhooks.outgoing"
  | "api.access"
  // Enterprise
  | "sso.saml"
  | "sso.oidc"
  | "scim.provisioning"
  | "branding.custom"
  | "support.priority";

export type LimitCode =
  | "max_members"
  | "max_active_audits"
  | "max_audits_per_month";

export interface PlanDescriptor {
  code: PlanCode;
  name: string;
  description: string;
  monthlyPriceEur: number | null;
  yearlyPriceEur: number | null;
  features: ReadonlyArray<FeatureCode>;
  limits: Readonly<Record<LimitCode, number | null>>;
  /** Plan custom (Enterprise) : pas de checkout self-service, redirection sales. */
  isContactSales: boolean;
}

const FREE: PlanDescriptor = {
  code: "free",
  name: "Free",
  description: "Pour découvrir Axessio (1 audit, 2 membres)",
  monthlyPriceEur: 0,
  yearlyPriceEur: 0,
  features: [],
  limits: {
    max_members: 2,
    max_active_audits: 1,
    max_audits_per_month: 2,
  },
  isContactSales: false,
};

const STARTER: PlanDescriptor = {
  code: "starter",
  name: "Starter",
  description: "Freelances et petites équipes",
  monthlyPriceEur: 29,
  yearlyPriceEur: 290,
  features: ["export.pdf", "remediation.simulator"],
  limits: {
    max_members: 5,
    max_active_audits: 10,
    max_audits_per_month: 20,
  },
  isContactSales: false,
};

const PRO: PlanDescriptor = {
  code: "pro",
  name: "Pro",
  description: "Agences et équipes growth",
  monthlyPriceEur: 99,
  yearlyPriceEur: 990,
  features: [
    "export.pdf",
    "remediation.simulator",
    "audit.proofreading",
    "audit.collaboration",
    "audit_logs.export",
    "webhooks.outgoing",
  ],
  limits: {
    max_members: 25,
    max_active_audits: null,
    max_audits_per_month: null,
  },
  isContactSales: false,
};

const ENTERPRISE: PlanDescriptor = {
  code: "enterprise",
  name: "Enterprise",
  description: "SSO, SCIM, support dédié",
  monthlyPriceEur: null,
  yearlyPriceEur: null,
  features: [
    "export.pdf",
    "remediation.simulator",
    "audit.proofreading",
    "audit.collaboration",
    "audit_logs.export",
    "webhooks.outgoing",
    "sso.saml",
    "sso.oidc",
    "scim.provisioning",
    "api.access",
    "branding.custom",
    "support.priority",
  ],
  limits: {
    max_members: null,
    max_active_audits: null,
    max_audits_per_month: null,
  },
  isContactSales: true,
};

export const PLANS: Readonly<Record<PlanCode, PlanDescriptor>> = {
  free: FREE,
  starter: STARTER,
  pro: PRO,
  enterprise: ENTERPRISE,
};

export const PLAN_ORDER: ReadonlyArray<PlanCode> = [
  "free",
  "starter",
  "pro",
  "enterprise",
];

/** Vrai si le plan possède la feature. Utile pour les états UI synchrones. */
export function planHasFeature(
  plan: PlanCode,
  feature: FeatureCode,
): boolean {
  return PLANS[plan].features.includes(feature);
}

/** Limite numérique d'un plan ; null = illimité. */
export function planLimit(plan: PlanCode, limit: LimitCode): number | null {
  return PLANS[plan].limits[limit];
}

/**
 * Trouve le plan minimum qui débloque cette feature. Pratique pour afficher
 * "Disponible à partir du plan Pro" dans une UI gated.
 */
export function minPlanForFeature(feature: FeatureCode): PlanCode | null {
  for (const code of PLAN_ORDER) {
    if (PLANS[code].features.includes(feature)) return code;
  }
  return null;
}
