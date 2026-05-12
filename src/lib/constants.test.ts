import { describe, expect, it } from "vitest";
import {
  AUDIT_STATUS_LABELS,
  COMPLEXITY_LABELS,
  CONFORMITY_STATUS_LABELS,
  DISABILITY_LABELS,
  NC_CLOSED_STATUSES,
  NC_SEVERITY_LABELS,
  NC_SEVERITY_ORDER,
  NC_STATUS_LABELS,
  PAGE_TYPE_LABELS,
  PLATFORM_LABELS,
  REFERENCE_TYPE_LABELS,
  SERVICE_TYPE_LABELS,
  USER_ROLE_LABELS,
  WCAG_PRINCIPLE_LABELS,
} from "./constants";
import type {
  AuditStatus,
  ComplexityLevel,
  ConformityStatus,
  DisabilityType,
  NCSeverity,
  NCStatus,
  PageType,
  PlatformType,
  ReferenceType,
  ServiceType,
  UserRole,
} from "@/types/domain";

// ============================================================================
// Helpers
// ============================================================================

/** Vrai si la valeur est exactement la clé technique (UPPER_SNAKE_CASE inchangé). */
function looksLikeKey(value: string, key: string): boolean {
  return value === key;
}

/**
 * Vérifie qu'une map de libellés couvre exactement un ensemble de clés attendues
 * (rien en plus, rien en moins) et que chaque libellé est non vide.
 */
function expectMapCoversKeys<K extends string>(
  map: Record<K, string>,
  expectedKeys: readonly K[],
) {
  const actualKeys = Object.keys(map).sort();
  expect(actualKeys).toEqual([...expectedKeys].sort());
  for (const key of expectedKeys) {
    const label = map[key];
    expect(label, `label manquant pour ${key}`).toBeTypeOf("string");
    expect(label.trim().length, `libellé vide pour ${key}`).toBeGreaterThan(0);
  }
}

/**
 * Vérifie que chaque libellé est différent de sa clé technique
 * (= libellé bien traduit en français, pas une copie de l'enum).
 *
 * Utilisé pour les enums "métier" où on attend une traduction française.
 * Non applicable aux acronymes (RGAA, WCAG…) qui restent identiques.
 */
function expectLabelsTranslated<K extends string>(
  map: Record<K, string>,
  keys: readonly K[],
) {
  for (const key of keys) {
    expect(
      looksLikeKey(map[key], key),
      `libellé ${key} non traduit (= clé technique)`,
    ).toBe(false);
  }
}

// ============================================================================
// AUDIT_STATUS_LABELS
// ============================================================================
describe("AUDIT_STATUS_LABELS", () => {
  const EXPECTED: readonly AuditStatus[] = [
    "PENDING",
    "PLANNED",
    "IN_PROGRESS",
    "DELIVERED",
    "REMEDIATION",
    "COUNTER_AUDIT",
    "ONLINE",
    "COMPLETED",
    "ARCHIVED",
  ];

  it("couvre exactement les 9 statuts d'audit", () => {
    expectMapCoversKeys(AUDIT_STATUS_LABELS, EXPECTED);
  });

  it("traduit chaque clé en français (≠ clé technique)", () => {
    expectLabelsTranslated(AUDIT_STATUS_LABELS, EXPECTED);
  });
});

// ============================================================================
// NC_SEVERITY_LABELS
// ============================================================================
describe("NC_SEVERITY_LABELS", () => {
  const EXPECTED: readonly NCSeverity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

  it("couvre exactement les 4 sévérités", () => {
    expectMapCoversKeys(NC_SEVERITY_LABELS, EXPECTED);
  });

  it("traduit chaque sévérité en français", () => {
    expectLabelsTranslated(NC_SEVERITY_LABELS, EXPECTED);
  });
});

// ============================================================================
// NC_SEVERITY_ORDER
// ============================================================================
describe("NC_SEVERITY_ORDER", () => {
  it("ordonne les sévérités CRITICAL < HIGH < MEDIUM < LOW (tri par poids)", () => {
    expect(NC_SEVERITY_ORDER.CRITICAL).toBeLessThan(NC_SEVERITY_ORDER.HIGH);
    expect(NC_SEVERITY_ORDER.HIGH).toBeLessThan(NC_SEVERITY_ORDER.MEDIUM);
    expect(NC_SEVERITY_ORDER.MEDIUM).toBeLessThan(NC_SEVERITY_ORDER.LOW);
  });

  it("attribue un poids distinct à chaque sévérité", () => {
    const values = Object.values(NC_SEVERITY_ORDER);
    expect(new Set(values).size).toBe(values.length);
  });
});

// ============================================================================
// NC_STATUS_LABELS + NC_CLOSED_STATUSES
// ============================================================================
describe("NC_STATUS_LABELS", () => {
  const EXPECTED: readonly NCStatus[] = [
    "OPEN",
    "IN_PROGRESS",
    "CORRECTED",
    "NON_REPRODUCIBLE",
    "RESOLVED",
    "REJECTED",
    "CANCELLED",
  ];

  it("couvre exactement les 7 statuts NC du domaine", () => {
    expectMapCoversKeys(NC_STATUS_LABELS, EXPECTED);
  });

  it("traduit chaque statut en français", () => {
    expectLabelsTranslated(NC_STATUS_LABELS, EXPECTED);
  });
});

describe("NC_CLOSED_STATUSES", () => {
  it("inclut uniquement des statuts NCStatus connus", () => {
    for (const s of NC_CLOSED_STATUSES) {
      expect(Object.keys(NC_STATUS_LABELS)).toContain(s);
    }
  });

  it("contient CORRECTED, RESOLVED et NON_REPRODUCIBLE", () => {
    expect(NC_CLOSED_STATUSES).toEqual(
      expect.arrayContaining(["CORRECTED", "RESOLVED", "NON_REPRODUCIBLE"]),
    );
  });

  it("n'inclut pas OPEN ni IN_PROGRESS", () => {
    expect(NC_CLOSED_STATUSES).not.toContain("OPEN");
    expect(NC_CLOSED_STATUSES).not.toContain("IN_PROGRESS");
  });
});

// ============================================================================
// PAGE_TYPE_LABELS
// ============================================================================
describe("PAGE_TYPE_LABELS", () => {
  const EXPECTED: readonly PageType[] = [
    "MANDATORY",
    "REPRESENTATIVE",
    "TRANSVERSAL",
  ];

  it("couvre exactement les 3 types de page", () => {
    expectMapCoversKeys(PAGE_TYPE_LABELS, EXPECTED);
  });

  it("traduit chaque type en français", () => {
    expectLabelsTranslated(PAGE_TYPE_LABELS, EXPECTED);
  });
});

// ============================================================================
// COMPLEXITY_LABELS
// ============================================================================
describe("COMPLEXITY_LABELS", () => {
  const EXPECTED: readonly ComplexityLevel[] = [
    "ULTRA_SIMPLE",
    "SIMPLE",
    "MINIMAL",
    "COMPLEX",
  ];

  it("couvre exactement les 4 niveaux de complexité", () => {
    expectMapCoversKeys(COMPLEXITY_LABELS, EXPECTED);
  });

  it("traduit chaque niveau en français", () => {
    expectLabelsTranslated(COMPLEXITY_LABELS, EXPECTED);
  });
});

// ============================================================================
// REFERENCE_TYPE_LABELS — acronymes : identiques à la clé pour la plupart.
// ============================================================================
describe("REFERENCE_TYPE_LABELS", () => {
  const EXPECTED: readonly ReferenceType[] = [
    "RGAA",
    "WCAG",
    "RAWeb",
    "RAAM",
    "PDF_UA",
    "EN_301_549",
  ];

  it("couvre exactement les 6 référentiels", () => {
    expectMapCoversKeys(REFERENCE_TYPE_LABELS, EXPECTED);
  });

  it("rend les acronymes UPPER_SNAKE_CASE lisibles (PDF/UA, EN 301 549)", () => {
    expect(REFERENCE_TYPE_LABELS.PDF_UA).toBe("PDF/UA");
    expect(REFERENCE_TYPE_LABELS.EN_301_549).toBe("EN 301 549");
  });
});

// ============================================================================
// PLATFORM_LABELS
// ============================================================================
describe("PLATFORM_LABELS", () => {
  const EXPECTED: readonly PlatformType[] = ["WEB", "MOBILE"];

  it("couvre exactement les 2 plateformes", () => {
    expectMapCoversKeys(PLATFORM_LABELS, EXPECTED);
  });

  it("traduit chaque plateforme en français (capitalisée)", () => {
    expectLabelsTranslated(PLATFORM_LABELS, EXPECTED);
  });
});

// ============================================================================
// SERVICE_TYPE_LABELS
// ============================================================================
describe("SERVICE_TYPE_LABELS", () => {
  const EXPECTED: readonly ServiceType[] = [
    "AUDIT",
    "NO_COUNTER_AUDIT",
    "COMPLIANCE_AUDIT",
  ];

  it("couvre exactement les 3 types de service", () => {
    expectMapCoversKeys(SERVICE_TYPE_LABELS, EXPECTED);
  });

  it("traduit chaque service en français", () => {
    expectLabelsTranslated(SERVICE_TYPE_LABELS, EXPECTED);
  });
});

// ============================================================================
// CONFORMITY_STATUS_LABELS
// ============================================================================
describe("CONFORMITY_STATUS_LABELS", () => {
  const EXPECTED: readonly ConformityStatus[] = [
    "COMPLIANT",
    "NON_COMPLIANT",
    "NOT_APPLICABLE",
  ];

  it("couvre exactement les 3 statuts de conformité", () => {
    expectMapCoversKeys(CONFORMITY_STATUS_LABELS, EXPECTED);
  });

  it("traduit chaque statut en français", () => {
    expectLabelsTranslated(CONFORMITY_STATUS_LABELS, EXPECTED);
  });
});

// ============================================================================
// DISABILITY_LABELS
// ============================================================================
describe("DISABILITY_LABELS", () => {
  const EXPECTED: readonly DisabilityType[] = [
    "VISUAL",
    "COGNITIVE",
    "AUDITORY",
    "MOTOR",
  ];

  it("couvre exactement les 4 types de handicap", () => {
    expectMapCoversKeys(DISABILITY_LABELS, EXPECTED);
  });

  it("traduit chaque handicap en français", () => {
    expectLabelsTranslated(DISABILITY_LABELS, EXPECTED);
  });
});

// ============================================================================
// USER_ROLE_LABELS
// ============================================================================
describe("USER_ROLE_LABELS", () => {
  const EXPECTED: readonly UserRole[] = [
    "auditor",
    "client_admin",
    "client_member",
  ];

  it("couvre exactement les 3 rôles", () => {
    expectMapCoversKeys(USER_ROLE_LABELS, EXPECTED);
  });

  it("traduit chaque rôle en français", () => {
    expectLabelsTranslated(USER_ROLE_LABELS, EXPECTED);
  });
});

// ============================================================================
// WCAG_PRINCIPLE_LABELS
// ============================================================================
describe("WCAG_PRINCIPLE_LABELS", () => {
  it("couvre les 4 principes WCAG (Perceivable, Operable, Understandable, Robust)", () => {
    expect(Object.keys(WCAG_PRINCIPLE_LABELS).sort()).toEqual([
      "Operable",
      "Perceivable",
      "Robust",
      "Understandable",
    ]);
  });

  it("traduit chaque principe en français", () => {
    expect(WCAG_PRINCIPLE_LABELS.Perceivable).toBe("Perceptible");
    expect(WCAG_PRINCIPLE_LABELS.Operable).toBe("Utilisable");
    expect(WCAG_PRINCIPLE_LABELS.Understandable).toBe("Compréhensible");
    expect(WCAG_PRINCIPLE_LABELS.Robust).toBe("Robuste");
  });
});
