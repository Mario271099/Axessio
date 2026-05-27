import { describe, expect, it } from "vitest";
import {
  minPlanForFeature,
  planHasFeature,
  planLimit,
  PLAN_ORDER,
  PLANS,
  type FeatureCode,
  type LimitCode,
  type PlanCode,
} from "./plans";

const LIMIT_CODES: readonly LimitCode[] = [
  "max_members",
  "max_active_audits",
  "max_audits_per_month",
];

const ALL_PLAN_CODES: readonly PlanCode[] = [
  "free",
  "starter",
  "pro",
  "enterprise",
];

// ============================================================================
// PLANS — structure générale
// ============================================================================
describe("PLANS catalogue", () => {
  it("expose les 4 plans free / starter / pro / enterprise", () => {
    expect(Object.keys(PLANS).sort()).toEqual([...ALL_PLAN_CODES].sort());
  });

  it("PLAN_ORDER suit l'ordre croissant free → starter → pro → enterprise", () => {
    expect(PLAN_ORDER).toEqual(["free", "starter", "pro", "enterprise"]);
  });

  it("le plan free est entièrement gratuit (0 €)", () => {
    expect(PLANS.free.monthlyPriceEur).toBe(0);
    expect(PLANS.free.yearlyPriceEur).toBe(0);
    expect(PLANS.free.features.length).toBe(0);
  });

  it("le plan enterprise est en contact sales (pas de prix self-service)", () => {
    expect(PLANS.enterprise.isContactSales).toBe(true);
    expect(PLANS.enterprise.monthlyPriceEur).toBeNull();
    expect(PLANS.enterprise.yearlyPriceEur).toBeNull();
  });

  it("starter et pro ne sont pas en contact sales", () => {
    expect(PLANS.starter.isContactSales).toBe(false);
    expect(PLANS.pro.isContactSales).toBe(false);
  });

  it("le yearly est ≤ 12× le monthly (incitation au yearly)", () => {
    for (const code of ["starter", "pro"] as const) {
      const monthly = PLANS[code].monthlyPriceEur ?? 0;
      const yearly = PLANS[code].yearlyPriceEur ?? 0;
      expect(yearly).toBeLessThanOrEqual(monthly * 12);
    }
  });

  it("chaque plan déclare les 3 limites de base", () => {
    for (const code of ALL_PLAN_CODES) {
      for (const limit of LIMIT_CODES) {
        // value peut être null (illimité) ou un nombre, mais la clé doit exister.
        expect(PLANS[code].limits).toHaveProperty(limit);
      }
    }
  });
});

// ============================================================================
// planHasFeature
// ============================================================================
describe("planHasFeature", () => {
  it("free n'a aucune feature payante", () => {
    expect(planHasFeature("free", "export.pdf")).toBe(false);
    expect(planHasFeature("free", "audit.collaboration")).toBe(false);
    expect(planHasFeature("free", "sso.saml")).toBe(false);
  });

  it("starter inclut export.pdf et le simulateur de remédiation", () => {
    expect(planHasFeature("starter", "export.pdf")).toBe(true);
    expect(planHasFeature("starter", "remediation.simulator")).toBe(true);
  });

  it("starter n'inclut PAS la collaboration multi-auditeurs ni les webhooks", () => {
    expect(planHasFeature("starter", "audit.collaboration")).toBe(false);
    expect(planHasFeature("starter", "webhooks.outgoing")).toBe(false);
  });

  it("pro inclut webhooks.outgoing et audit_logs.export", () => {
    expect(planHasFeature("pro", "webhooks.outgoing")).toBe(true);
    expect(planHasFeature("pro", "audit_logs.export")).toBe(true);
  });

  it("pro N'inclut PAS SSO ni SCIM (réservés enterprise)", () => {
    expect(planHasFeature("pro", "sso.saml")).toBe(false);
    expect(planHasFeature("pro", "scim.provisioning")).toBe(false);
    expect(planHasFeature("pro", "api.access")).toBe(false);
  });

  it("enterprise inclut SSO/SCIM/API/branding", () => {
    expect(planHasFeature("enterprise", "sso.saml")).toBe(true);
    expect(planHasFeature("enterprise", "sso.oidc")).toBe(true);
    expect(planHasFeature("enterprise", "scim.provisioning")).toBe(true);
    expect(planHasFeature("enterprise", "api.access")).toBe(true);
    expect(planHasFeature("enterprise", "branding.custom")).toBe(true);
  });

  it("héritage croissant : chaque feature de starter est aussi dans pro et enterprise", () => {
    for (const f of PLANS.starter.features) {
      expect(planHasFeature("pro", f)).toBe(true);
      expect(planHasFeature("enterprise", f)).toBe(true);
    }
  });

  it("héritage croissant : chaque feature de pro est aussi dans enterprise", () => {
    for (const f of PLANS.pro.features) {
      expect(planHasFeature("enterprise", f)).toBe(true);
    }
  });
});

// ============================================================================
// planLimit
// ============================================================================
describe("planLimit", () => {
  it("free limite à 2 membres et 1 audit actif", () => {
    expect(planLimit("free", "max_members")).toBe(2);
    expect(planLimit("free", "max_active_audits")).toBe(1);
  });

  it("starter relève les limites par rapport à free", () => {
    expect((planLimit("starter", "max_members") ?? 0)).toBeGreaterThan(
      planLimit("free", "max_members") ?? 0,
    );
    expect(
      (planLimit("starter", "max_active_audits") ?? 0),
    ).toBeGreaterThan(planLimit("free", "max_active_audits") ?? 0);
  });

  it("pro a max_active_audits illimité (null)", () => {
    expect(planLimit("pro", "max_active_audits")).toBeNull();
    expect(planLimit("pro", "max_audits_per_month")).toBeNull();
  });

  it("enterprise est illimité sur les 3 limites", () => {
    for (const limit of LIMIT_CODES) {
      expect(planLimit("enterprise", limit)).toBeNull();
    }
  });
});

// ============================================================================
// minPlanForFeature
// ============================================================================
describe("minPlanForFeature", () => {
  it("export.pdf est débloqué à partir de starter", () => {
    expect(minPlanForFeature("export.pdf")).toBe("starter");
  });

  it("audit.collaboration est débloqué à partir de pro", () => {
    expect(minPlanForFeature("audit.collaboration")).toBe("pro");
  });

  it("webhooks.outgoing est débloqué à partir de pro", () => {
    expect(minPlanForFeature("webhooks.outgoing")).toBe("pro");
  });

  it("sso.saml est uniquement débloqué en enterprise", () => {
    expect(minPlanForFeature("sso.saml")).toBe("enterprise");
  });

  it("api.access est uniquement débloqué en enterprise", () => {
    expect(minPlanForFeature("api.access")).toBe("enterprise");
  });

  it("branding.custom est uniquement débloqué en enterprise", () => {
    expect(minPlanForFeature("branding.custom")).toBe("enterprise");
  });

  it("scim.provisioning est uniquement débloqué en enterprise", () => {
    expect(minPlanForFeature("scim.provisioning")).toBe("enterprise");
  });

  it("retourne null pour une feature inexistante (cast)", () => {
    expect(minPlanForFeature("nonexistent.feature" as FeatureCode)).toBeNull();
  });
});
