// Système RBAC centralisé.
//
// Source unique de vérité côté code pour qui peut faire quoi. Toutes les
// gardes UI (boutons, sidebar, états read-only) et toutes les vérifications
// dans les server actions DOIVENT passer par ce module — jamais d'égalité
// directe `role === "auditor"` dans le reste du code.
//
// La RLS Postgres est la deuxième ligne de défense : ce module ne remplace
// PAS les policies, il les complète côté UX en cachant les actions interdites.

import type { AuditWorkflowStatus, UserRole } from "@/types/domain";

// ============================================================================
// Catalogue des permissions atomiques
// ============================================================================
export type Permission =
  // Audit
  | "audit.view"
  | "audit.edit"
  | "audit.delete"
  | "audit.assign_auditor"
  | "audit.transition_workflow"
  // Matrice de conformité
  | "matrix.edit"
  // Non-conformités
  | "nc.create"
  | "nc.edit"
  | "nc.delete"
  | "nc.update_status_client"
  // Remédiation : visible par tous les rôles (objectif produit)
  | "remediation.view"
  // Chat / commentaires : ouverts à tous les rôles
  | "chat.read"
  | "chat.write"
  // Administration
  | "client.manage"
  | "project.manage"
  | "user.manage"
  // Diagnostic / outils
  | "audit_logs.view_all"
  | "impersonate"
  | "permissions.debug";

// ============================================================================
// Matrice rôle → permissions
// ============================================================================
const ADMIN_PERMS: ReadonlyArray<Permission> = [
  "audit.view",
  "audit.edit",
  "audit.delete",
  "audit.assign_auditor",
  "audit.transition_workflow",
  "matrix.edit",
  "nc.create",
  "nc.edit",
  "nc.delete",
  "nc.update_status_client",
  "remediation.view",
  "chat.read",
  "chat.write",
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
  "audit.transition_workflow",
  "matrix.edit",
  "nc.create",
  "nc.edit",
  "nc.delete",
  "nc.update_status_client",
  "remediation.view",
  "chat.read",
  "chat.write",
  "project.manage",
  "impersonate", // limité à `client` côté UI (cf. canImpersonate ci-dessous)
];

const CLIENT_ADMIN_PERMS: ReadonlyArray<Permission> = [
  "audit.view",
  "audit.assign_auditor",
  "nc.update_status_client",
  "remediation.view",
  "chat.read",
  "chat.write",
];

const CLIENT_PERMS: ReadonlyArray<Permission> = [
  "audit.view",
  "nc.update_status_client",
  "remediation.view",
  "chat.read",
  "chat.write",
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
export const canTransitionWorkflow = (r: UserRole) => can(r, "audit.transition_workflow");
export const canEditMatrix         = (r: UserRole) => can(r, "matrix.edit");
export const canCreateNC           = (r: UserRole) => can(r, "nc.create");
export const canEditNC             = (r: UserRole) => can(r, "nc.edit");
export const canDeleteNC           = (r: UserRole) => can(r, "nc.delete");
export const canUpdateNCStatusClient = (r: UserRole) =>
  can(r, "nc.update_status_client");
export const canAccessRemediation  = (r: UserRole) => can(r, "remediation.view");
export const canChat               = (r: UserRole) => can(r, "chat.read");
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
 * Peut désigner / retirer un relecteur sur un audit. Depuis la migration 35,
 * réservé à admin + client_admin (l'auditor a perdu ce pouvoir — confer la
 * spec rôles audit). Le verrou granulaire de scope (client_admin uniquement
 * sur les audits de son client) est appliqué côté RLS.
 */
export const canAssignProofreader = (r: UserRole): boolean =>
  r === "admin" || r === "client_admin";

/**
 * Peut poster un commentaire de relecture sur un audit. Ouvert au staff
 * plateforme. Côté serveur on filtre en plus sur l'accessibilité de l'audit
 * (RLS audit_logs_insert) — ce helper ne couvre que l'aspect rôle.
 */
export const canPostReviewComment = (r: UserRole): boolean => isStaff(r);

// ============================================================================
// Verrouillage par workflow_status
// ============================================================================
//
// Quand l'audit est `validated` ou `delivered`, on bloque toute édition (matrice,
// NC, métadonnées audit, pages d'échantillon) SAUF pour l'admin qui peut toujours
// intervenir en cas de besoin. Le client_admin et le client n'ont déjà pas
// `audit.edit`, mais ce verrou s'applique aussi au rôle auditor.
//
// À utiliser systématiquement en plus des permissions de base :
//   canEditAudit(role) && isWorkflowEditable(workflowStatus, role)

/**
 * Renvoie `true` si le rôle donné peut encore éditer le contenu de l'audit
 * compte tenu de son workflow_status. L'admin n'est jamais verrouillé.
 */
export function isWorkflowEditable(
  workflowStatus: AuditWorkflowStatus,
  role: UserRole,
): boolean {
  if (role === "admin") return true;
  return workflowStatus === "draft" || workflowStatus === "in_review";
}

/** Variante "Édition de l'audit". Combine la permission + le verrou. */
export function canEditAuditNow(
  role: UserRole,
  workflowStatus: AuditWorkflowStatus,
): boolean {
  return canEditAudit(role) && isWorkflowEditable(workflowStatus, role);
}

/** Variante "Édition de la matrice". Combine la permission + le verrou. */
export function canEditMatrixNow(
  role: UserRole,
  workflowStatus: AuditWorkflowStatus,
): boolean {
  return canEditMatrix(role) && isWorkflowEditable(workflowStatus, role);
}

/** Variante "Édition NC". Combine la permission + le verrou. */
export function canEditNCNow(
  role: UserRole,
  workflowStatus: AuditWorkflowStatus,
): boolean {
  return canEditNC(role) && isWorkflowEditable(workflowStatus, role);
}

/** Variante "Création NC". Combine la permission + le verrou. */
export function canCreateNCNow(
  role: UserRole,
  workflowStatus: AuditWorkflowStatus,
): boolean {
  return canCreateNC(role) && isWorkflowEditable(workflowStatus, role);
}
