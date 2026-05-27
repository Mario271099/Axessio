import { describe, expect, it } from "vitest";
import {
  ALL_PERMISSIONS,
  canImpersonateAs,
  canOrg,
  ORG_PERMISSIONS,
  ORG_ROLE_WEIGHT,
  orgRoleAtLeast,
  PERMISSIONS,
  can,
  isStaff,
  listOrgPermissions,
  listPermissions,
  type Permission,
} from "./permissions";
import type { OrgRole, UserRole } from "@/types/domain";

const ALL_USER_ROLES: readonly UserRole[] = [
  "admin",
  "auditor",
  "client_admin",
  "client",
];

const ALL_ORG_ROLES: readonly OrgRole[] = [
  "owner",
  "admin",
  "manager",
  "member",
  "viewer",
  "guest",
];

// ============================================================================
// Catalogue
// ============================================================================
describe("ALL_PERMISSIONS catalogue", () => {
  it("contient au moins les 18 permissions atomiques attendues", () => {
    // Si on en ajoute, ce nombre monte — mais on garde un test "garde-fou"
    // pour éviter une régression silencieuse.
    expect(ALL_PERMISSIONS.length).toBeGreaterThanOrEqual(18);
  });

  it("n'a pas de doublons", () => {
    const set = new Set(ALL_PERMISSIONS);
    expect(set.size).toBe(ALL_PERMISSIONS.length);
  });

  it("expose les permissions critiques (audit.view, audit.delete, user.manage)", () => {
    expect(ALL_PERMISSIONS).toContain("audit.view");
    expect(ALL_PERMISSIONS).toContain("audit.delete");
    expect(ALL_PERMISSIONS).toContain("user.manage");
  });
});

// ============================================================================
// PERMISSIONS — rôles plateforme (legacy)
// ============================================================================
describe("PERMISSIONS (rôles plateforme)", () => {
  it("couvre exactement les 4 rôles UserRole", () => {
    expect(Object.keys(PERMISSIONS).sort()).toEqual(
      [...ALL_USER_ROLES].sort(),
    );
  });

  it("admin possède toutes les permissions du catalogue", () => {
    for (const perm of ALL_PERMISSIONS) {
      expect(can("admin", perm)).toBe(true);
    }
  });

  it("client ne peut pas modifier la matrice ni supprimer un audit", () => {
    expect(can("client", "matrix.edit")).toBe(false);
    expect(can("client", "audit.delete")).toBe(false);
    expect(can("client", "user.manage")).toBe(false);
  });

  it("client_admin peut assigner un auditeur mais pas créer une NC", () => {
    // Cf. permissions.ts : client_admin a 'audit.assign_auditor' mais pas 'nc.create'.
    expect(can("client_admin", "audit.assign_auditor")).toBe(true);
    expect(can("client_admin", "nc.create")).toBe(false);
  });

  it("auditor a accès à matrix.edit et aux opérations NC mais pas à user.manage", () => {
    expect(can("auditor", "matrix.edit")).toBe(true);
    expect(can("auditor", "nc.create")).toBe(true);
    expect(can("auditor", "nc.edit")).toBe(true);
    expect(can("auditor", "user.manage")).toBe(false);
  });

  it("tous les rôles peuvent accéder à remediation.view et chat.read", () => {
    for (const role of ALL_USER_ROLES) {
      expect(can(role, "remediation.view")).toBe(true);
      expect(can(role, "chat.read")).toBe(true);
    }
  });
});

describe("listPermissions", () => {
  it("retourne les mêmes éléments que la Set sous-jacente", () => {
    const list = listPermissions("admin");
    expect(new Set(list)).toEqual(PERMISSIONS.admin);
  });
});

// ============================================================================
// canImpersonateAs
// ============================================================================
describe("canImpersonateAs", () => {
  it("admin peut impersonner client_admin et client", () => {
    expect(canImpersonateAs("admin").sort()).toEqual(
      ["client", "client_admin"].sort(),
    );
  });

  it("auditor peut impersonner client uniquement", () => {
    expect(canImpersonateAs("auditor")).toEqual(["client"]);
  });

  it("client_admin et client ne peuvent impersonner personne", () => {
    expect(canImpersonateAs("client_admin")).toEqual([]);
    expect(canImpersonateAs("client")).toEqual([]);
  });
});

// ============================================================================
// isStaff
// ============================================================================
describe("isStaff", () => {
  it("est vrai pour admin et auditor", () => {
    expect(isStaff("admin")).toBe(true);
    expect(isStaff("auditor")).toBe(true);
  });

  it("est faux pour client_admin et client", () => {
    expect(isStaff("client_admin")).toBe(false);
    expect(isStaff("client")).toBe(false);
  });
});

// ============================================================================
// ORG_PERMISSIONS — Phase 3 (RBAC org-scopé)
// ============================================================================
describe("ORG_PERMISSIONS (rôles organisation)", () => {
  it("couvre exactement les 6 rôles OrgRole", () => {
    expect(Object.keys(ORG_PERMISSIONS).sort()).toEqual(
      [...ALL_ORG_ROLES].sort(),
    );
  });

  it("owner et admin ont toutes les permissions (idem)", () => {
    for (const perm of ALL_PERMISSIONS) {
      expect(canOrg("owner", perm)).toBe(true);
      expect(canOrg("admin", perm)).toBe(true);
    }
  });

  it("manager peut éditer un audit + NC mais pas user.manage ni client.manage", () => {
    expect(canOrg("manager", "audit.edit")).toBe(true);
    expect(canOrg("manager", "nc.create")).toBe(true);
    expect(canOrg("manager", "nc.delete")).toBe(true);
    expect(canOrg("manager", "user.manage")).toBe(false);
    expect(canOrg("manager", "client.manage")).toBe(false);
  });

  it("member peut créer une NC mais pas la supprimer", () => {
    expect(canOrg("member", "nc.create")).toBe(true);
    expect(canOrg("member", "nc.edit")).toBe(true);
    expect(canOrg("member", "nc.delete")).toBe(false);
  });

  it("viewer ne peut qu'audit.view + remediation.view + chat.read", () => {
    expect(listOrgPermissions("viewer").sort()).toEqual(
      ["audit.view", "chat.read", "remediation.view"].sort(),
    );
  });

  it("guest peut écrire dans le chat et changer le statut client d'une NC", () => {
    expect(canOrg("guest", "chat.write")).toBe(true);
    expect(canOrg("guest", "nc.update_status_client")).toBe(true);
    // mais pas créer ni supprimer
    expect(canOrg("guest", "nc.create")).toBe(false);
    expect(canOrg("guest", "nc.delete")).toBe(false);
  });

  it("aucun rôle org < admin n'a audit.delete", () => {
    const lower: OrgRole[] = ["manager", "member", "viewer", "guest"];
    for (const role of lower) {
      expect(canOrg(role, "audit.delete")).toBe(false);
    }
  });
});

// ============================================================================
// Hiérarchie OrgRole
// ============================================================================
describe("ORG_ROLE_WEIGHT + orgRoleAtLeast", () => {
  it("ordonne strictement owner > admin > manager > member > viewer > guest", () => {
    expect(ORG_ROLE_WEIGHT.owner).toBeGreaterThan(ORG_ROLE_WEIGHT.admin);
    expect(ORG_ROLE_WEIGHT.admin).toBeGreaterThan(ORG_ROLE_WEIGHT.manager);
    expect(ORG_ROLE_WEIGHT.manager).toBeGreaterThan(ORG_ROLE_WEIGHT.member);
    expect(ORG_ROLE_WEIGHT.member).toBeGreaterThan(ORG_ROLE_WEIGHT.viewer);
    expect(ORG_ROLE_WEIGHT.viewer).toBeGreaterThan(ORG_ROLE_WEIGHT.guest);
  });

  it("attribue un poids unique à chaque rôle", () => {
    const values = Object.values(ORG_ROLE_WEIGHT);
    expect(new Set(values).size).toBe(values.length);
  });

  it("orgRoleAtLeast est inclusif (un rôle satisfait sa propre exigence)", () => {
    for (const role of ALL_ORG_ROLES) {
      expect(orgRoleAtLeast(role, role)).toBe(true);
    }
  });

  it("owner satisfait toute exigence", () => {
    for (const min of ALL_ORG_ROLES) {
      expect(orgRoleAtLeast("owner", min)).toBe(true);
    }
  });

  it("guest ne satisfait que guest", () => {
    expect(orgRoleAtLeast("guest", "viewer")).toBe(false);
    expect(orgRoleAtLeast("guest", "guest")).toBe(true);
  });

  it("admin satisfait manager/member/viewer/guest mais pas owner", () => {
    expect(orgRoleAtLeast("admin", "manager")).toBe(true);
    expect(orgRoleAtLeast("admin", "guest")).toBe(true);
    expect(orgRoleAtLeast("admin", "owner")).toBe(false);
  });
});

// ============================================================================
// Cohérence catalogue ↔ rôles
// ============================================================================
describe("Cohérence catalogue ↔ matrices", () => {
  it("chaque permission de chaque rôle plateforme appartient au catalogue", () => {
    for (const role of ALL_USER_ROLES) {
      for (const perm of PERMISSIONS[role]) {
        expect(ALL_PERMISSIONS).toContain(perm as Permission);
      }
    }
  });

  it("chaque permission de chaque rôle org appartient au catalogue", () => {
    for (const role of ALL_ORG_ROLES) {
      for (const perm of ORG_PERMISSIONS[role]) {
        expect(ALL_PERMISSIONS).toContain(perm as Permission);
      }
    }
  });
});
