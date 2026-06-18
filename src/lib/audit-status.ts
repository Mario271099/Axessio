// ============================================================================
// Cycle de vie de `audits.status` - matrice de transitions
// ----------------------------------------------------------------------------
// Source de vérité pour les transitions autorisées + leurs conditions.
// Les server actions (statut/actions.ts) et l'UI (audit-status-actions.tsx)
// consomment cette matrice. La RLS Postgres reste la deuxième ligne de
// défense via la migration 31 (is_auditor() + accessible_project_ids).
//
// Spec : voir documentation produit "Spécifications - Transitions de statut
// d'audit".
// ============================================================================

import type { AuditStatus, UserRole } from "@/types/domain";

// Codes d'erreur stables utilisés par les server actions ET l'UI. Toute
// nouvelle condition métier doit ajouter son code ici en premier.
export type AuditStatusErrorCode =
  | "STATUS_INVALID_SOURCE"
  | "STATUS_INVALID_TARGET"
  | "STATUS_ROLE_DENIED"
  | "SAMPLE_EMPTY"
  | "START_DATE_MISSING"
  | "START_DATE_FUTURE"
  | "MATRIX_NO_PAGES"
  | "MATRIX_NO_CRITERIA"
  | "MATRIX_INCOMPLETE";

export interface AuditStatusTransition {
  from: AuditStatus;
  to: AuditStatus;
  /** Manuel = bouton UI. Auto = cron. Les deux peuvent coexister (T2). */
  manual: boolean;
  auto: boolean;
  /** Rôles autorisés à déclencher manuellement. Ignoré pour les autos. */
  roles: ReadonlyArray<UserRole>;
  /** Clé i18n du CTA (audits.statusTransitions.cta.<key>). */
  ctaKey: string;
}

// Matrice des transitions documentées dans la spec.
export const AUDIT_STATUS_TRANSITIONS: ReadonlyArray<AuditStatusTransition> = [
  {
    from: "PENDING",
    to: "PLANNED",
    manual: true,
    auto: false,
    roles: ["admin", "auditor"],
    ctaKey: "plan",
  },
  {
    from: "PLANNED",
    to: "IN_PROGRESS",
    manual: true,
    auto: true,
    roles: ["admin", "auditor"],
    ctaKey: "start",
  },
  {
    from: "IN_PROGRESS",
    to: "DELIVERED",
    manual: true,
    auto: false,
    roles: ["admin", "auditor"],
    ctaKey: "deliver",
  },
  {
    from: "DELIVERED",
    to: "REMEDIATION",
    manual: false,
    auto: true,
    roles: [],
    ctaKey: "openRemediation",
  },
];

/**
 * Snapshot des grandeurs nécessaires aux validations de transition.
 * Calculé via le RPC `audit_status_lifecycle_view`.
 */
export interface AuditLifecycleSnapshot {
  representativeCount: number;
  matrixFilled: number;
  matrixTotal: number;
  matrixPercent: number;
  startDateSet: boolean;
  startDateReached: boolean;
}

/**
 * Résultat d'évaluation des préconditions d'une transition. Pas d'effet ;
 * permet à l'UI de pré-désactiver les boutons + d'afficher la raison.
 */
export interface TransitionReadiness {
  to: AuditStatus;
  ready: boolean;
  errorCode?: AuditStatusErrorCode;
  /** Contexte d'interpolation pour le message UI (% complétion, dates, etc.). */
  context?: Record<string, string | number>;
}

/**
 * Évalue les conditions métier pour une transition donnée. Ne fait JAMAIS
 * confiance au statut courant côté UI : si la source ne matche pas, c'est
 * `STATUS_INVALID_SOURCE`. Côté serveur, on re-check au moment d'écrire.
 */
export function evaluateTransition(
  currentStatus: AuditStatus,
  target: AuditStatus,
  snapshot: AuditLifecycleSnapshot,
): TransitionReadiness {
  const transition = AUDIT_STATUS_TRANSITIONS.find(
    (t) => t.from === currentStatus && t.to === target,
  );
  if (!transition) {
    return { to: target, ready: false, errorCode: "STATUS_INVALID_TARGET" };
  }

  switch (target) {
    case "PLANNED":
      if (snapshot.representativeCount < 1) {
        return { to: target, ready: false, errorCode: "SAMPLE_EMPTY" };
      }
      return { to: target, ready: true };

    case "IN_PROGRESS":
      if (!snapshot.startDateSet) {
        return { to: target, ready: false, errorCode: "START_DATE_MISSING" };
      }
      if (!snapshot.startDateReached) {
        return { to: target, ready: false, errorCode: "START_DATE_FUTURE" };
      }
      return { to: target, ready: true };

    case "DELIVERED":
      if (snapshot.matrixTotal === 0) {
        // Cas dégénéré : ni pages ni critères. On affine pour distinguer.
        return {
          to: target,
          ready: false,
          errorCode:
            snapshot.matrixFilled === 0 && snapshot.matrixTotal === 0
              ? "MATRIX_NO_PAGES"
              : "MATRIX_NO_CRITERIA",
        };
      }
      if (snapshot.matrixFilled < snapshot.matrixTotal) {
        return {
          to: target,
          ready: false,
          errorCode: "MATRIX_INCOMPLETE",
          context: {
            filled: snapshot.matrixFilled,
            total: snapshot.matrixTotal,
            percent: snapshot.matrixPercent,
          },
        };
      }
      return { to: target, ready: true };

    case "REMEDIATION":
      // Transition uniquement automatique - pas évaluable manuellement.
      return { to: target, ready: false, errorCode: "STATUS_INVALID_TARGET" };

    default:
      return { to: target, ready: false, errorCode: "STATUS_INVALID_TARGET" };
  }
}

/**
 * Liste les transitions manuelles disponibles depuis le statut courant pour
 * un rôle donné. Utilisé par l'UI pour afficher les boutons d'action.
 */
export function availableManualTransitions(
  currentStatus: AuditStatus,
  role: UserRole,
): AuditStatusTransition[] {
  return AUDIT_STATUS_TRANSITIONS.filter(
    (t) => t.from === currentStatus && t.manual && t.roles.includes(role),
  );
}
