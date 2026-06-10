import { describe, it, expect } from "vitest";
import {
  AUDIT_STATUS_TRANSITIONS,
  availableManualTransitions,
  evaluateTransition,
  type AuditLifecycleSnapshot,
} from "./audit-status";

// Snapshot "tout vert" par défaut — chaque test surcharge ce qui l'intéresse.
function snapshot(
  overrides: Partial<AuditLifecycleSnapshot> = {},
): AuditLifecycleSnapshot {
  return {
    representativeCount: 5,
    matrixFilled: 100,
    matrixTotal: 100,
    matrixPercent: 100,
    startDateSet: true,
    startDateReached: true,
    ...overrides,
  };
}

// ============================================================================
// Matrice de transitions — invariants structurels
// ============================================================================
describe("AUDIT_STATUS_TRANSITIONS", () => {
  it("ne contient aucun doublon (from, to)", () => {
    const seen = new Set<string>();
    for (const t of AUDIT_STATUS_TRANSITIONS) {
      const key = `${t.from}->${t.to}`;
      expect(seen.has(key), `doublon ${key}`).toBe(false);
      seen.add(key);
    }
  });

  it("toute transition manuelle déclare au moins un rôle autorisé", () => {
    for (const t of AUDIT_STATUS_TRANSITIONS) {
      if (t.manual) {
        expect(t.roles.length, `${t.from}->${t.to}`).toBeGreaterThan(0);
      }
    }
  });

  it("toute transition purement automatique n'autorise aucun rôle manuel", () => {
    for (const t of AUDIT_STATUS_TRANSITIONS) {
      if (!t.manual && t.auto) {
        expect(t.roles, `${t.from}->${t.to}`).toEqual([]);
      }
    }
  });

  it("la transition vers REMEDIATION est automatique uniquement", () => {
    const t = AUDIT_STATUS_TRANSITIONS.find((x) => x.to === "REMEDIATION");
    expect(t).toBeDefined();
    expect(t?.manual).toBe(false);
    expect(t?.auto).toBe(true);
  });
});

// ============================================================================
// evaluateTransition — source / cible inconnues
// ============================================================================
describe("evaluateTransition — garde source/cible", () => {
  it("refuse une transition inexistante (source ne matche aucune règle)", () => {
    const r = evaluateTransition("ONLINE", "ARCHIVED", snapshot());
    expect(r.ready).toBe(false);
    expect(r.errorCode).toBe("STATUS_INVALID_TARGET");
  });

  it("refuse un saut de statut non documenté (PENDING -> DELIVERED)", () => {
    const r = evaluateTransition("PENDING", "DELIVERED", snapshot());
    expect(r.ready).toBe(false);
    expect(r.errorCode).toBe("STATUS_INVALID_TARGET");
  });

  it("refuse une transition vers REMEDIATION en manuel (auto only)", () => {
    const r = evaluateTransition("DELIVERED", "REMEDIATION", snapshot());
    expect(r.ready).toBe(false);
    expect(r.errorCode).toBe("STATUS_INVALID_TARGET");
  });
});

// ============================================================================
// evaluateTransition — PENDING -> PLANNED (échantillon non vide)
// ============================================================================
describe("evaluateTransition — PENDING -> PLANNED", () => {
  it("refuse si l'échantillon est vide", () => {
    const r = evaluateTransition(
      "PENDING",
      "PLANNED",
      snapshot({ representativeCount: 0 }),
    );
    expect(r.ready).toBe(false);
    expect(r.errorCode).toBe("SAMPLE_EMPTY");
  });

  it("autorise dès qu'il y a au moins une page représentative", () => {
    const r = evaluateTransition(
      "PENDING",
      "PLANNED",
      snapshot({ representativeCount: 1 }),
    );
    expect(r.ready).toBe(true);
    expect(r.errorCode).toBeUndefined();
  });
});

// ============================================================================
// evaluateTransition — PLANNED -> IN_PROGRESS (date de début)
// ============================================================================
describe("evaluateTransition — PLANNED -> IN_PROGRESS", () => {
  it("refuse si la date de début n'est pas posée", () => {
    const r = evaluateTransition(
      "PLANNED",
      "IN_PROGRESS",
      snapshot({ startDateSet: false }),
    );
    expect(r.ready).toBe(false);
    expect(r.errorCode).toBe("START_DATE_MISSING");
  });

  it("refuse si la date de début est dans le futur", () => {
    const r = evaluateTransition(
      "PLANNED",
      "IN_PROGRESS",
      snapshot({ startDateSet: true, startDateReached: false }),
    );
    expect(r.ready).toBe(false);
    expect(r.errorCode).toBe("START_DATE_FUTURE");
  });

  it("autorise quand la date est posée et atteinte", () => {
    const r = evaluateTransition("PLANNED", "IN_PROGRESS", snapshot());
    expect(r.ready).toBe(true);
  });
});

// ============================================================================
// evaluateTransition — IN_PROGRESS -> DELIVERED (matrice complète)
// ============================================================================
describe("evaluateTransition — IN_PROGRESS -> DELIVERED", () => {
  it("refuse avec MATRIX_NO_PAGES quand il n'y a ni page ni critère", () => {
    const r = evaluateTransition(
      "IN_PROGRESS",
      "DELIVERED",
      snapshot({ matrixFilled: 0, matrixTotal: 0 }),
    );
    expect(r.ready).toBe(false);
    expect(r.errorCode).toBe("MATRIX_NO_PAGES");
  });

  it("refuse avec MATRIX_INCOMPLETE et expose le contexte de complétion", () => {
    const r = evaluateTransition(
      "IN_PROGRESS",
      "DELIVERED",
      snapshot({ matrixFilled: 80, matrixTotal: 100, matrixPercent: 80 }),
    );
    expect(r.ready).toBe(false);
    expect(r.errorCode).toBe("MATRIX_INCOMPLETE");
    expect(r.context).toEqual({ filled: 80, total: 100, percent: 80 });
  });

  it("autorise quand la matrice est intégralement remplie", () => {
    const r = evaluateTransition("IN_PROGRESS", "DELIVERED", snapshot());
    expect(r.ready).toBe(true);
    expect(r.context).toBeUndefined();
  });
});

// ============================================================================
// availableManualTransitions — filtrage par statut + rôle
// ============================================================================
describe("availableManualTransitions", () => {
  it("propose PLANNED depuis PENDING pour un auditor", () => {
    const list = availableManualTransitions("PENDING", "auditor");
    expect(list.map((t) => t.to)).toEqual(["PLANNED"]);
  });

  it("propose la même transition à un admin", () => {
    const list = availableManualTransitions("PENDING", "admin");
    expect(list.map((t) => t.to)).toEqual(["PLANNED"]);
  });

  it("ne propose rien à un client (rôle non autorisé)", () => {
    expect(availableManualTransitions("PENDING", "client")).toEqual([]);
    expect(availableManualTransitions("IN_PROGRESS", "client_admin")).toEqual(
      [],
    );
  });

  it("ne propose aucune transition manuelle depuis DELIVERED (suite auto)", () => {
    expect(availableManualTransitions("DELIVERED", "admin")).toEqual([]);
  });

  it("ne renvoie que des transitions marquées manual", () => {
    for (const role of ["admin", "auditor"] as const) {
      for (const status of [
        "PENDING",
        "PLANNED",
        "IN_PROGRESS",
        "DELIVERED",
      ] as const) {
        for (const t of availableManualTransitions(status, role)) {
          expect(t.manual).toBe(true);
          expect(t.roles).toContain(role);
        }
      }
    }
  });
});
