import { describe, expect, it } from "vitest";
import {
  featuresForNeeds,
  planCoversNeeds,
  recommendationReason,
  recommendPlan,
  type PlanNeeds,
} from "./recommend-plan";
import { PLAN_ORDER, PLANS } from "./plans";

const BASE: PlanNeeds = { activeAudits: 1, members: 1, features: [] };

describe("recommendPlan", () => {
  it("conseille Free par défaut", () => {
    expect(recommendPlan(BASE)).toBe("free");
  });

  it("conseille Starter si l'export PDF est coché", () => {
    expect(recommendPlan({ ...BASE, features: featuresForNeeds(["pdf"]) })).toBe(
      "starter",
    );
  });

  it("reste sur Starter jusqu'à 10 audits actifs et 5 membres", () => {
    expect(recommendPlan({ ...BASE, activeAudits: 10, members: 5 })).toBe(
      "starter",
    );
  });

  it("conseille Pro au-delà de 10 audits actifs", () => {
    expect(recommendPlan({ ...BASE, activeAudits: 11 })).toBe("pro");
  });

  it("conseille Pro au-delà de 5 membres", () => {
    expect(recommendPlan({ ...BASE, members: 6 })).toBe("pro");
  });

  it("conseille Pro si la relecture est cochée", () => {
    expect(
      recommendPlan({ ...BASE, features: featuresForNeeds(["review"]) }),
    ).toBe("pro");
  });

  it("reste sur Pro jusqu'à 25 membres", () => {
    expect(recommendPlan({ ...BASE, members: 25 })).toBe("pro");
  });

  it("conseille Enterprise au-delà de 25 membres", () => {
    expect(recommendPlan({ ...BASE, members: 26 })).toBe("enterprise");
  });

  it("conseille Enterprise si le SSO est coché", () => {
    expect(recommendPlan({ ...BASE, features: featuresForNeeds(["sso"]) })).toBe(
      "enterprise",
    );
    expect(recommendPlan({ ...BASE, features: ["sso.saml"] })).toBe(
      "enterprise",
    );
  });

  it("le plan conseillé couvre toujours les besoins", () => {
    const needs: PlanNeeds = {
      activeAudits: 40,
      members: 3,
      features: featuresForNeeds(["pdf"]),
    };
    const plan = recommendPlan(needs);
    expect(planCoversNeeds(plan, needs)).toBe(true);
    // Et aucun plan moins cher ne les couvre.
    for (const cheaper of PLAN_ORDER.slice(0, PLAN_ORDER.indexOf(plan))) {
      expect(planCoversNeeds(cheaper, needs)).toBe(false);
    }
  });

  it("suit le catalogue : le seuil vient de PLANS, pas d'une constante", () => {
    const starterMax = PLANS.starter.limits.max_active_audits ?? 0;
    expect(recommendPlan({ ...BASE, activeAudits: starterMax })).toBe(
      "starter",
    );
    expect(recommendPlan({ ...BASE, activeAudits: starterMax + 1 })).toBe(
      "pro",
    );
  });
});

describe("featuresForNeeds", () => {
  it("retourne une liste vide sans case cochée", () => {
    expect(featuresForNeeds([])).toEqual([]);
  });

  it("cumule les fonctionnalités des cases cochées", () => {
    expect(featuresForNeeds(["pdf", "review"])).toEqual([
      "export.pdf",
      "audit.proofreading",
      "audit.collaboration",
    ]);
  });
});

describe("recommendationReason", () => {
  it("base pour le premier plan", () => {
    expect(recommendationReason("free", BASE)).toEqual({ kind: "base" });
  });

  it("feature quand le plan précédent n'a pas la fonctionnalité", () => {
    const needs = { ...BASE, features: featuresForNeeds(["pdf"]) };
    expect(recommendationReason("starter", needs)).toEqual({
      kind: "feature",
      feature: "export.pdf",
    });
  });

  it("limits quand seul le volume dépasse le plan précédent", () => {
    const needs = { ...BASE, members: 6, features: featuresForNeeds(["pdf"]) };
    expect(recommendationReason("pro", needs)).toEqual({
      kind: "limits",
      previous: "starter",
    });
  });
});
