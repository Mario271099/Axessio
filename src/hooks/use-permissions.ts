"use client";

import { useMemo } from "react";
import {
  can,
  canAccessRemediation,
  canAssignAuditor,
  canChat,
  canCreateNC,
  canDebugPermissions,
  canDeleteAudit,
  canDeleteNC,
  canEditAudit,
  canEditMatrix,
  canEditNC,
  canImpersonate,
  canImpersonateAs,
  canManageClients,
  canManageProjects,
  canManageUsers,
  canTransitionWorkflow,
  canUpdateNCStatusClient,
  canViewAllAuditLogs,
  canViewAudit,
  isStaff,
  type Permission,
} from "@/lib/permissions";
import type { UserRole } from "@/types/domain";

export interface PermissionsApi {
  role: UserRole;
  can: (permission: Permission) => boolean;
  isStaff: boolean;
  // Audit
  canViewAudit: boolean;
  canEditAudit: boolean;
  canDeleteAudit: boolean;
  canAssignAuditor: boolean;
  canTransitionWorkflow: boolean;
  // Matrice / NC
  canEditMatrix: boolean;
  canCreateNC: boolean;
  canEditNC: boolean;
  canDeleteNC: boolean;
  canUpdateNCStatusClient: boolean;
  // Collaboration
  canAccessRemediation: boolean;
  canChat: boolean;
  // Administration
  canManageClients: boolean;
  canManageProjects: boolean;
  canManageUsers: boolean;
  // Diagnostic
  canViewAllAuditLogs: boolean;
  canDebugPermissions: boolean;
  // Impersonation
  canImpersonate: boolean;
  impersonatableRoles: UserRole[];
}

/**
 * Hook client de lecture des permissions du rôle courant.
 *
 * Le rôle est résolu côté serveur (Server Components / layouts) et propagé
 * en prop. Aucun appel réseau côté hook, juste un calcul mémoïsé sur le
 * matrice statique de `lib/permissions.ts`.
 */
export function usePermissions(role: UserRole): PermissionsApi {
  return useMemo(
    () => ({
      role,
      can: (permission) => can(role, permission),
      isStaff: isStaff(role),
      canViewAudit: canViewAudit(role),
      canEditAudit: canEditAudit(role),
      canDeleteAudit: canDeleteAudit(role),
      canAssignAuditor: canAssignAuditor(role),
      canTransitionWorkflow: canTransitionWorkflow(role),
      canEditMatrix: canEditMatrix(role),
      canCreateNC: canCreateNC(role),
      canEditNC: canEditNC(role),
      canDeleteNC: canDeleteNC(role),
      canUpdateNCStatusClient: canUpdateNCStatusClient(role),
      canAccessRemediation: canAccessRemediation(role),
      canChat: canChat(role),
      canManageClients: canManageClients(role),
      canManageProjects: canManageProjects(role),
      canManageUsers: canManageUsers(role),
      canViewAllAuditLogs: canViewAllAuditLogs(role),
      canDebugPermissions: canDebugPermissions(role),
      canImpersonate: canImpersonate(role),
      impersonatableRoles: canImpersonateAs(role),
    }),
    [role],
  );
}
