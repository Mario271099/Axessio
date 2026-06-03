// Système RBAC centralisé.
//
// Source unique de vérité côté code pour qui peut faire quoi. Toutes les
// gardes UI (boutons, sidebar, états read-only) et toutes les vérifications
// dans les server actions DOIVENT passer par ce module — jamais d'égalité
// directe `role === "auditor"` dans le reste du code.
//
// La RLS Postgres est la deuxième ligne de défense : ce module ne remplace
// PAS les policies, il les complète côté UX en cachant les actions interdites.

import type { OrgRole, UserRole } from "@/types/domain";

// ============================================================================
// Catalogue des permissions atomiques
// ----------------------------------------------------------------------------
// Ce type est la source de vérité côté code. Il DOIT rester aligné avec
// le seed de la migration 47 (`public.permissions`). Quand tu ajoutes une
// permission ici, ajoute la ligne SQL correspondante dans la migration.
// ============================================================================
export type Permission =
  // Audit
  | "audit.view"
  | "audit.edit"
  | "audit.delete"
  | "audit.assign_auditor"
  // Matrice de conformité
  | "matrix.edit"
  // Non-conformités
  | "nc.create"
  | "nc.edit"
  | "nc.delete"
  | "nc.update_status_client"
  // Remédiation : visible par tous les rôles (objectif produit)
  | "remediation.view"
  // Chat / commentaires : SPLIT par fil depuis la Phase 2 (mig. 67).
  // - `chat.client.*` : fil de discussion visible côté client
  // - `chat.review.*` : fil interne de relecture (JAMAIS exposé aux contacts)
  | "chat.client.read"
  | "chat.client.write"
  | "chat.review.read"
  | "chat.review.write"
  // Administration
  | "client.manage"
  | "project.manage"
  | "user.manage"
  // Diagnostic / outils
  | "audit_logs.view_all"
  | "impersonate"
  | "permissions.debug";

/** Catalogue exhaustif — utilisé pour les pages debug et l'introspection. */
export const ALL_PERMISSIONS: ReadonlyArray<Permission> = [
  "audit.view",
  "audit.edit",
  "audit.delete",
  "audit.assign_auditor",
  "matrix.edit",
  "nc.create",
  "nc.edit",
  "nc.delete",
  "nc.update_status_client",
  "remediation.view",
  "chat.client.read",
  "chat.client.write",
  "chat.review.read",
  "chat.review.write",
  "client.manage",
  "project.manage",
  "user.manage",
  "audit_logs.view_all",
  "impersonate",
  "permissions.debug",
];

// ============================================================================
// Matrice rôle → permissions
// ============================================================================
const ADMIN_PERMS: ReadonlyArray<Permission> = [
  "audit.view",
  "audit.edit",
  "audit.delete",
  "audit.assign_auditor",
  "matrix.edit",
  "nc.create",
  "nc.edit",
  "nc.delete",
  "nc.update_status_client",
  "remediation.view",
  "chat.client.read",
  "chat.client.write",
  "chat.review.read",
  "chat.review.write",
  "client.manage",
  "project.manage",
  "user.manage",
  "audit_logs.view_all",
  "impersonate",
  "permissions.debug",
];

const AUDITOR_PERMS: ReadonlyArray<Permission> = [
  "audit.view",
  "audit.edit",
  "matrix.edit",
  "nc.create",
  "nc.edit",
  "nc.delete",
  "nc.update_status_client",
  "remediation.view",
  "chat.client.read",
  "chat.client.write",
  "chat.review.read",
  "chat.review.write",
  // Quick-fix Phase 0 (en attendant la refonte rôles unifiés) : un auditeur
  // peut créer un client dans son org. Sans ça un freelance ne peut rien
  // initier seul. La gate quota (`max_clients` du plan) sera ajoutée en
  // Phase 4 et complétera ce contrôle de permission.
  "client.manage",
  "project.manage",
  // L'auditeur est lead sur ses audits : il peut assigner d'autres
  // auditeurs (collaboration) et inviter des contacts client (Porte 2).
  // Sans cette perm, le bouton « Inviter un contact » de la page audit
  // restait caché — bug rapporté avant cette ligne.
  "audit.assign_auditor",
  "impersonate", // limité à `client` côté UI (cf. canImpersonate ci-dessous)
];

const CLIENT_ADMIN_PERMS: ReadonlyArray<Permission> = [
  "audit.view",
  "audit.assign_auditor",
  "nc.update_status_client",
  "remediation.view",
  "chat.client.read",
  "chat.client.write",
];

const CLIENT_PERMS: ReadonlyArray<Permission> = [
  "audit.view",
  "nc.update_status_client",
  "remediation.view",
  "chat.client.read",
  "chat.client.write",
];

export const PERMISSIONS: Record<UserRole, ReadonlySet<Permission>> = {
  admin: new Set(ADMIN_PERMS),
  auditor: new Set(AUDITOR_PERMS),
  client_admin: new Set(CLIENT_ADMIN_PERMS),
  client: new Set(CLIENT_PERMS),
};

// ============================================================================
// API publique
// ============================================================================

/** Vérification atomique : `role` peut-il faire `permission` ? */
export function can(role: UserRole, permission: Permission): boolean {
  return PERMISSIONS[role].has(permission);
}

/** Liste lisible des permissions d'un rôle (debug, page admin). */
export function listPermissions(role: UserRole): Permission[] {
  return Array.from(PERMISSIONS[role]);
}

// ----------------------------------------------------------------------------
// Spécialisations — à utiliser depuis le code applicatif plutôt que `can()`
// (lisibilité + grep-ability).
// ----------------------------------------------------------------------------
export const canViewAudit          = (r: UserRole) => can(r, "audit.view");
export const canEditAudit          = (r: UserRole) => can(r, "audit.edit");
export const canDeleteAudit        = (r: UserRole) => can(r, "audit.delete");
export const canAssignAuditor      = (r: UserRole) => can(r, "audit.assign_auditor");
export const canEditMatrix         = (r: UserRole) => can(r, "matrix.edit");
export const canCreateNC           = (r: UserRole) => can(r, "nc.create");
export const canEditNC             = (r: UserRole) => can(r, "nc.edit");
export const canDeleteNC           = (r: UserRole) => can(r, "nc.delete");
export const canUpdateNCStatusClient = (r: UserRole) =>
  can(r, "nc.update_status_client");
export const canAccessRemediation  = (r: UserRole) => can(r, "remediation.view");
export const canChatClient         = (r: UserRole) => can(r, "chat.client.read");
export const canChatReview         = (r: UserRole) => can(r, "chat.review.read");
/** @deprecated remplacé par canChatClient/canChatReview (Phase 2 / mig. 67). */
export const canChat               = canChatClient;
export const canManageClients      = (r: UserRole) => can(r, "client.manage");
export const canManageProjects     = (r: UserRole) => can(r, "project.manage");
export const canManageUsers        = (r: UserRole) => can(r, "user.manage");
export const canViewAllAuditLogs   = (r: UserRole) => can(r, "audit_logs.view_all");
export const canDebugPermissions   = (r: UserRole) => can(r, "permissions.debug");

/** Rôles auxquels `role` peut emprunter l'identité côté UI uniquement. */
export function canImpersonateAs(role: UserRole): UserRole[] {
  if (role === "admin") return ["client_admin", "client"];
  if (role === "auditor") return ["client"];
  return [];
}
export const canImpersonate = (r: UserRole) => canImpersonateAs(r).length > 0;

/** Raccourci : rôle interne plateforme (admin OR auditor). */
export const isStaff = (r: UserRole): boolean => r === "admin" || r === "auditor";

/**
 * Peut désigner / retirer un relecteur sur un audit.
 * - admin : oui (super-admin)
 * - auditor : oui (lead de ses audits dans le nouveau modèle
 *   freelance/consultance — il invite son propre relecteur)
 * - client_admin : oui sur les audits de son client (verrou de scope
 *   appliqué côté RLS, mig. 35)
 */
export const canAssignProofreader = (r: UserRole): boolean =>
  r === "admin" || r === "auditor" || r === "client_admin";

// ============================================================================
// RBAC org-scopé (Phase 3 — migrations 47/48)
// ----------------------------------------------------------------------------
// Le mapping ci-dessous DOIT rester strictement aligné avec le seed
// `role_permissions` (scope='org') de la migration 47. Si tu ajoutes une
// permission à un rôle, modifie les deux endroits.
//
// Ce mapping est utilisé côté UI (rendu conditionnel rapide sans round-trip
// DB). Côté serveur, préfère la fonction SQL `has_org_permission(...)` qui
// lit la matrice persistée — c'est la source de vérité opposable à la RLS.
// ============================================================================

const OWNER_ADMIN_ORG_PERMS: ReadonlyArray<Permission> = ALL_PERMISSIONS;

// auditor (Phase 2) : absorbe les anciens `manager` et `member`. Contribue
// pleinement aux audits — matrice, NC, projets, chat client + review.
// Inclut aussi `client.manage` (mig. 73) pour qu'un freelance seul dans son
// org puisse gérer son carnet de clients sans passer par owner/admin.
// Ne gère ni les membres ni la facturation.
const AUDITOR_ORG_PERMS: ReadonlyArray<Permission> = [
  "audit.view",
  "audit.edit",
  "audit.delete",
  "audit.assign_auditor",
  "matrix.edit",
  "nc.create",
  "nc.edit",
  "nc.delete",
  "nc.update_status_client",
  "remediation.view",
  "chat.client.read",
  "chat.client.write",
  "chat.review.read",
  "chat.review.write",
  "project.manage",
  "client.manage",
];

// viewer (Phase 2) : lecture totale (y compris fil review) + commentaires
// partout. Pas d'édition de matrice ni de NC. Promu vs. l'ancien `viewer`
// (qui ne pouvait que lire) ; absorbe aussi l'ancien `guest` côté org_members.
// Les vrais invités (PO d'un customer, auditeur ponctuel) ne sont JAMAIS
// dans cette matrice : ils sont sur `audit_assignees` (Porte 2 — Phase 5).
const VIEWER_ORG_PERMS: ReadonlyArray<Permission> = [
  "audit.view",
  "remediation.view",
  "chat.client.read",
  "chat.client.write",
  "chat.review.read",
  "chat.review.write",
];

export const ORG_PERMISSIONS: Record<OrgRole, ReadonlySet<Permission>> = {
  owner:   new Set(OWNER_ADMIN_ORG_PERMS),
  admin:   new Set(OWNER_ADMIN_ORG_PERMS),
  auditor: new Set(AUDITOR_ORG_PERMS),
  viewer:  new Set(VIEWER_ORG_PERMS),
};

/** Vérification atomique sur un rôle d'organisation. */
export function canOrg(role: OrgRole, permission: Permission): boolean {
  return ORG_PERMISSIONS[role].has(permission);
}

/** Liste lisible des permissions d'un rôle d'org (debug, page admin). */
export function listOrgPermissions(role: OrgRole): Permission[] {
  return Array.from(ORG_PERMISSIONS[role]);
}

/**
 * Hiérarchie numérique des rôles d'organisation, alignée sur la fonction
 * SQL `has_org_role(min_role)` (migration 42). Permet de comparer côté code
 * sans round-trip DB.
 */
export const ORG_ROLE_WEIGHT: Record<OrgRole, number> = {
  viewer:  1,
  auditor: 2,
  admin:   3,
  owner:   4,
};

export function orgRoleAtLeast(role: OrgRole, min: OrgRole): boolean {
  return ORG_ROLE_WEIGHT[role] >= ORG_ROLE_WEIGHT[min];
}
