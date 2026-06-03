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

// Phase 2 (mig. 67) : enum org_role passé de 6 à 4 valeurs.
const ALL_ORG_ROLES: readonly OrgRole[] = ["owner", "admin", "auditor", "viewer"];

// ============================================================================
// Catalogue
// ============================================================================
describe("ALL_PERMISSIONS catalogue", () => {
  it("contient au moins les 20 permissions atomiques attendues", () => {
    // Phase 2 a split chat.read/write en chat.client.* + chat.review.* —
    // le compte total passe à 20 minimum.
    expect(ALL_PERMISSIONS.length).toBeGreaterThanOrEqual(20);
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

  it("expose les 4 permissions chat scopées par fil (Phase 2)", () => {
    expect(ALL_PERMISSIONS).toContain("chat.client.read");
    expect(ALL_PERMISSIONS).toContain("chat.client.write");
    expect(ALL_PERMISSIONS).toContain("chat.review.read");
    expect(ALL_PERMISSIONS).toContain("chat.review.write");
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
    expect(can("client_admin", "audit.assign_auditor")).toBe(true);
    expect(can("client_admin", "nc.create")).toBe(false);
  });

  it("auditor a accès à matrix.edit et aux opérations NC mais pas à user.manage", () => {
    expect(can("auditor", "matrix.edit")).toBe(true);
    expect(can("auditor", "nc.create")).toBe(true);
    expect(can("auditor", "nc.edit")).toBe(true);
    expect(can("auditor", "user.manage")).toBe(false);
  });

  it("tous les rôles peuvent lire le fil client d'une NC", () => {
    for (const role of ALL_USER_ROLES) {
      expect(can(role, "remediation.view")).toBe(true);
      expect(can(role, "chat.client.read")).toBe(true);
    }
  });

  it("seul le staff plateforme (admin + auditor) voit le fil review", () => {
    expect(can("admin", "chat.review.read")).toBe(true);
    expect(can("auditor", "chat.review.read")).toBe(true);
    expect(can("client_admin", "chat.review.read")).toBe(false);
    expect(can("client", "chat.review.read")).toBe(false);
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
// ORG_PERMISSIONS — Phase 2 : 4 rôles, chat scopé par fil
// ============================================================================
describe("ORG_PERMISSIONS (rôles organisation)", () => {
  it("couvre exactement les 4 rôles OrgRole", () => {
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

  it("auditor crée projets/audits/NC et édite la matrice", () => {
    expect(canOrg("auditor", "project.manage")).toBe(true);
    expect(canOrg("auditor", "audit.edit")).toBe(true);
    expect(canOrg("auditor", "audit.delete")).toBe(true);
    expect(canOrg("auditor", "nc.create")).toBe(true);
    expect(canOrg("auditor", "nc.delete")).toBe(true);
    expect(canOrg("auditor", "matrix.edit")).toBe(true);
  });

  it("auditor peut gérer les clients de son carnet (mig. 73) mais pas les membres ni la facturation", () => {
    expect(canOrg("auditor", "client.manage")).toBe(true);
    expect(canOrg("auditor", "user.manage")).toBe(false);
  });

  it("auditor a accès aux DEUX fils de discussion NC", () => {
    expect(canOrg("auditor", "chat.client.read")).toBe(true);
    expect(canOrg("auditor", "chat.client.write")).toBe(true);
    expect(canOrg("auditor", "chat.review.read")).toBe(true);
    expect(canOrg("auditor", "chat.review.write")).toBe(true);
  });

  it("viewer peut lire et commenter dans les DEUX fils, mais n'édite rien", () => {
    expect(canOrg("viewer", "audit.view")).toBe(true);
    expect(canOrg("viewer", "chat.client.read")).toBe(true);
    expect(canOrg("viewer", "chat.client.write")).toBe(true);
    expect(canOrg("viewer", "chat.review.read")).toBe(true);
    expect(canOrg("viewer", "chat.review.write")).toBe(true);

    expect(canOrg("viewer", "audit.edit")).toBe(false);
    expect(canOrg("viewer", "matrix.edit")).toBe(false);
    expect(canOrg("viewer", "nc.create")).toBe(false);
    expect(canOrg("viewer", "nc.delete")).toBe(false);
  });

  it("viewer n'expose que la lecture seule + chat (set borné)", () => {
    const perms = new Set(listOrgPermissions("viewer"));
    expect(perms).toEqual(
      new Set<Permission>([
        "audit.view",
        "remediation.view",
        "chat.client.read",
        "chat.client.write",
        "chat.review.read",
        "chat.review.write",
      ]),
    );
  });

  it("seuls owner/admin/auditor peuvent gérer les clients ; user.manage reste owner/admin", () => {
    // L'auditor a gagné client.manage en mig. 73 pour matcher le besoin
    // freelance « seul dans son org, gère son carnet ». Le viewer ne touche
    // toujours pas aux clients ni aux membres.
    expect(canOrg("auditor", "client.manage")).toBe(true);
    expect(canOrg("viewer", "client.manage")).toBe(false);
    const allLowerThanAdmin: OrgRole[] = ["auditor", "viewer"];
    for (const role of allLowerThanAdmin) {
      expect(canOrg(role, "user.manage")).toBe(false);
    }
    // auditor garde audit.delete (cf. ROLES_ROADMAP.md), viewer non.
    expect(canOrg("viewer", "audit.delete")).toBe(false);
  });
});

// ============================================================================
// Hiérarchie OrgRole — 4 niveaux désormais
// ============================================================================
describe("ORG_ROLE_WEIGHT + orgRoleAtLeast", () => {
  it("ordonne strictement owner > admin > auditor > viewer", () => {
    expect(ORG_ROLE_WEIGHT.owner).toBeGreaterThan(ORG_ROLE_WEIGHT.admin);
    expect(ORG_ROLE_WEIGHT.admin).toBeGreaterThan(ORG_ROLE_WEIGHT.auditor);
    expect(ORG_ROLE_WEIGHT.auditor).toBeGreaterThan(ORG_ROLE_WEIGHT.viewer);
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

  it("viewer ne satisfait que viewer", () => {
    expect(orgRoleAtLeast("viewer", "auditor")).toBe(false);
    expect(orgRoleAtLeast("viewer", "viewer")).toBe(true);
  });

  it("auditor satisfait viewer mais pas admin/owner", () => {
    expect(orgRoleAtLeast("auditor", "viewer")).toBe(true);
    expect(orgRoleAtLeast("auditor", "auditor")).toBe(true);
    expect(orgRoleAtLeast("auditor", "admin")).toBe(false);
    expect(orgRoleAtLeast("auditor", "owner")).toBe(false);
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
