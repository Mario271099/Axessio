import { describe, it, expect } from "vitest";
import {
  calculateScore,
  getConformityLabel,
  getConformityLevel,
} from "./score";

// ============================================================================
// calculateScore — formule officielle RGAA / WCAG :
//   score = compliant / (totalCriteria - notApplicable) * 100
// ============================================================================
describe("calculateScore", () => {
  it("retourne 0 quand aucun critère n'est conforme (0/50 applicables)", () => {
    const score = calculateScore({
      compliant: 0,
      notApplicable: 0,
      totalCriteria: 50,
    });
    expect(score).toBe(0);
  });

  it("retourne 100 quand tous les critères applicables sont conformes", () => {
    const score = calculateScore({
      compliant: 50,
      notApplicable: 0,
      totalCriteria: 50,
    });
    expect(score).toBe(100);
  });

  it("retourne 50 quand la moitié des critères applicables sont conformes", () => {
    const score = calculateScore({
      compliant: 25,
      notApplicable: 0,
      totalCriteria: 50,
    });
    expect(score).toBe(50);
  });

  it("retourne 100 quand tous les critères conformes le sont sur le périmètre applicable, malgré des NA", () => {
    // 30 conformes, 20 NA, total 50 → 30 / (50 - 20) = 100%
    const score = calculateScore({
      compliant: 30,
      notApplicable: 20,
      totalCriteria: 50,
    });
    expect(score).toBe(100);
  });

  it("retourne 0 quand tous les critères sont en NA (denominator = 0)", () => {
    const score = calculateScore({
      compliant: 0,
      notApplicable: 50,
      totalCriteria: 50,
    });
    expect(score).toBe(0);
  });

  it("retourne 0 quand aucun critère n'est évalué (totalCriteria = 0)", () => {
    const score = calculateScore({
      compliant: 0,
      notApplicable: 0,
      totalCriteria: 0,
    });
    expect(score).toBe(0);
  });

  it("retourne 0 si le dénominateur est négatif (cas dégradé : NA > total)", () => {
    // Garde défensive du code source — on n'est jamais censé arriver ici.
    const score = calculateScore({
      compliant: 5,
      notApplicable: 10,
      totalCriteria: 5,
    });
    expect(score).toBe(0);
  });

  it("compte les critères NON_COMPLIANT dans le dénominateur (10/95)", () => {
    // 10 conformes, 5 NA, 85 NON_COMPLIANT → total 100, dénom 95.
    // 10/95 ≈ 10.5263 → arrondi à 10.53
    const score = calculateScore({
      compliant: 10,
      notApplicable: 5,
      totalCriteria: 100,
    });
    expect(score).toBe(10.53);
  });

  it("arrondit à 2 décimales (1/3 des critères)", () => {
    // 1/3 * 100 = 33.333... → 33.33
    const score = calculateScore({
      compliant: 1,
      notApplicable: 0,
      totalCriteria: 3,
    });
    expect(score).toBe(33.33);
  });

  it("gère un mix réaliste (RGAA 106 critères : 60 conformes, 20 NA, 26 NC)", () => {
    // 60 / (106 - 20) = 60 / 86 = 69.767… → 69.77
    const score = calculateScore({
      compliant: 60,
      notApplicable: 20,
      totalCriteria: 106,
    });
    expect(score).toBe(69.77);
  });

  it("retourne 0 quand totalCriteria est négatif (garde défensive)", () => {
    const score = calculateScore({
      compliant: 0,
      notApplicable: 0,
      totalCriteria: -5,
    });
    expect(score).toBe(0);
  });
});

// ============================================================================
// getConformityLevel — seuils officiels :
//   0–49 : non-compliant
//   50–99 : partial
//   100 : full
// ============================================================================
describe("getConformityLevel", () => {
  it("retourne 'non-compliant' pour 0", () => {
    expect(getConformityLevel(0)).toBe("non-compliant");
  });

  it("retourne 'non-compliant' juste en dessous de 50", () => {
    expect(getConformityLevel(49.99)).toBe("non-compliant");
  });

  it("retourne 'partial' à exactement 50", () => {
    expect(getConformityLevel(50)).toBe("partial");
  });

  it("retourne 'partial' juste en dessous de 100", () => {
    expect(getConformityLevel(99.99)).toBe("partial");
  });

  it("retourne 'full' à exactement 100", () => {
    expect(getConformityLevel(100)).toBe("full");
  });
});

// ============================================================================
// getConformityLabel — libellés FR pour le rapport
// ============================================================================
describe("getConformityLabel", () => {
  it("retourne 'Non conforme' pour un score sous 50", () => {
    expect(getConformityLabel(25)).toBe("Non conforme");
  });

  it("retourne 'Partiellement conforme' pour un score entre 50 et 99", () => {
    expect(getConformityLabel(75)).toBe("Partiellement conforme");
  });

  it("retourne 'Totalement conforme' pour 100", () => {
    expect(getConformityLabel(100)).toBe("Totalement conforme");
  });
});
