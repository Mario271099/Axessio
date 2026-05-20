import type {
  AuditStatus,
  AuditWorkflowStatus,
  ComplexityLevel,
  ConformityStatus,
  DisabilityType,
  NCReviewStatus,
  NCSeverity,
  NCStatus,
  PageType,
  PlatformType,
  ReferenceType,
  ServiceType,
  UserRole,
} from "@/types/domain";

// ============================================================================
// Audit status
// ============================================================================
export const AUDIT_STATUS_LABELS: Record<AuditStatus, string> = {
  PENDING: "En attente",
  PLANNED: "Planifié",
  IN_PROGRESS: "En cours",
  DELIVERED: "Livré",
  REMEDIATION: "Remédiation",
  COUNTER_AUDIT: "Contre-audit",
  ONLINE: "En ligne",
  COMPLETED: "Terminé",
  ARCHIVED: "Archivé",
};

/** Couleur sémantique (HSL token CSS) pour le badge. */
export const AUDIT_STATUS_TONE: Record<
  AuditStatus,
  "neutral" | "info" | "warning" | "success" | "muted"
> = {
  PENDING: "neutral",
  PLANNED: "info",
  IN_PROGRESS: "info",
  DELIVERED: "warning",
  REMEDIATION: "warning",
  COUNTER_AUDIT: "warning",
  ONLINE: "success",
  COMPLETED: "success",
  ARCHIVED: "muted",
};

// ============================================================================
// Workflow éditorial d'audit (séparé du lifecycle métier ci-dessus)
// ============================================================================
export const AUDIT_WORKFLOW_LABELS: Record<AuditWorkflowStatus, string> = {
  draft: "Brouillon",
  in_review: "En revue",
  validated: "Validé",
  delivered: "Livré",
};

export const AUDIT_WORKFLOW_TONE: Record<
  AuditWorkflowStatus,
  "neutral" | "info" | "warning" | "success" | "muted"
> = {
  draft: "neutral",
  in_review: "info",
  validated: "warning",
  delivered: "success",
};

export interface AuditWorkflowTransition {
  to: AuditWorkflowStatus;
  roles: ReadonlyArray<UserRole>;
  /**
   * Force la saisie d'un motif non vide pour valider la transition (côté UI
   * + côté serveur). Utilisé notamment pour "Demander des corrections".
   */
  requireReason?: boolean;
  /**
   * Override la clé i18n du CTA. Par défaut on utilise
   * `audits.workflow.transitionCta.<to>`. Ici on permet une variante
   * sémantique différente (ex. `request_changes` plutôt que `draft`).
   */
  ctaKey?: string;
}

/**
 * Transitions autorisées depuis chaque état + permissions. Chaque transition
 * indique les rôles autorisés à la déclencher. Lecture :
 *   AUDIT_WORKFLOW_TRANSITIONS["draft"] = ["in_review"]
 *
 * Le verrou final côté serveur reste `canTransitionWorkflow(role)` + cette
 * matrice (le rôle doit avoir la permission ET la transition doit être permise
 * pour ce rôle dans cet état).
 */
export const AUDIT_WORKFLOW_TRANSITIONS: Record<
  AuditWorkflowStatus,
  ReadonlyArray<AuditWorkflowTransition>
> = {
  draft: [
    { to: "in_review", roles: ["admin", "auditor"] },
  ],
  in_review: [
    // "Demander des corrections" : retour à brouillon AVEC motif obligatoire.
    // Sémantique forte d'un refus de relecture, distinct d'un simple revert.
    {
      to: "draft",
      roles: ["admin", "auditor"],
      requireReason: true,
      ctaKey: "transitionCta.request_changes",
    },
    { to: "validated", roles: ["admin", "auditor"] },
  ],
  validated: [
    { to: "in_review", roles: ["admin"] },            // retour exceptionnel (admin uniquement)
    { to: "delivered", roles: ["admin", "auditor"] },
  ],
  delivered: [
    // Terminal sauf intervention admin via UPDATE direct (hors UI standard).
  ],
};

// ============================================================================
// Sévérités NC
// ============================================================================
export const NC_SEVERITY_LABELS: Record<NCSeverity, string> = {
  LOW: "Faible",
  MEDIUM: "Moyenne",
  HIGH: "Haute",
  CRITICAL: "Critique",
};

export const NC_SEVERITY_ORDER: Record<NCSeverity, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

// ============================================================================
// Statut NC
// ============================================================================
export const NC_STATUS_LABELS: Record<NCStatus, string> = {
  OPEN: "Ouverte",
  IN_PROGRESS: "En cours",
  CORRECTED: "Corrigée",
  NON_REPRODUCIBLE: "Non reproductible",
  RESOLVED: "Résolue",
  REJECTED: "Rejetée",
  CANCELLED: "Annulée",
  TO_FIX: "À corriger",
  FIXED: "Corrigée",
  FALSE_POSITIVE: "Faux positif",
};

/** Statuts considérés comme "fermés" — utilisés par le simulateur de remédiation. */
export const NC_CLOSED_STATUSES: NCStatus[] = [
  "CORRECTED",
  "RESOLVED",
  "NON_REPRODUCIBLE",
];

// ============================================================================
// Cycle de relecture NC — libellés + couleurs
// ============================================================================
export const NC_REVIEW_STATUS_LABELS: Record<NCReviewStatus, string> = {
  not_requested: "Non demandée",
  pending: "Relecture demandée",
  under_review: "En relecture",
  changes_requested: "Corrections demandées",
  approved: "Validée",
};

export const NC_REVIEW_STATUS_TONE: Record<
  NCReviewStatus,
  "neutral" | "info" | "warning" | "success" | "destructive" | "muted"
> = {
  not_requested: "muted",
  pending: "warning",
  under_review: "info",
  changes_requested: "destructive",
  approved: "success",
};

// ============================================================================
// Page
// ============================================================================
export const PAGE_TYPE_LABELS: Record<PageType, string> = {
  MANDATORY: "Obligatoire",
  REPRESENTATIVE: "Représentative",
  TRANSVERSAL: "Transversale",
};

export const COMPLEXITY_LABELS: Record<ComplexityLevel, string> = {
  ULTRA_SIMPLE: "Très simple",
  SIMPLE: "Simple",
  MINIMAL: "Minimale",
  COMPLEX: "Complexe",
};

// ============================================================================
// Référentiels
// ============================================================================
export const REFERENCE_TYPE_LABELS: Record<ReferenceType, string> = {
  RGAA: "RGAA",
  WCAG: "WCAG",
  RAWeb: "RAWeb",
  RAAM: "RAAM",
  PDF_UA: "PDF/UA",
  EN_301_549: "EN 301 549",
};

/**
 * Libellés français des 4 principes WCAG.
 * Clé = valeur stockée en base (anglais), valeur = libellé affiché (français).
 */
export const WCAG_PRINCIPLE_LABELS: Record<string, string> = {
  Perceivable: "Perceptible",
  Operable: "Utilisable",
  Understandable: "Compréhensible",
  Robust: "Robuste",
};

// ============================================================================
// Service & plateforme
// ============================================================================
export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  AUDIT: "Audit avec contre-audit",
  NO_COUNTER_AUDIT: "Audit sans contre-audit",
  COMPLIANCE_AUDIT: "Audit de conformité",
};

export const PLATFORM_LABELS: Record<PlatformType, string> = {
  WEB: "Web",
  MOBILE: "Mobile",
};

// ============================================================================
// Conformité par critère
// ============================================================================
export const CONFORMITY_STATUS_LABELS: Record<ConformityStatus, string> = {
  COMPLIANT: "Conforme",
  NON_COMPLIANT: "Non conforme",
  NOT_APPLICABLE: "Non applicable",
};

// ============================================================================
// Handicaps
// ============================================================================
export const DISABILITY_LABELS: Record<DisabilityType, string> = {
  VISUAL: "Visuel",
  COGNITIVE: "Cognitif",
  AUDITORY: "Auditif",
  MOTOR: "Moteur",
};

// ============================================================================
// Rôles
// ============================================================================
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrateur",
  auditor: "Auditeur",
  client_admin: "Administrateur client",
  client: "Client",
};

/** Variant `<Badge>` à utiliser pour le rôle. Aligné sur les variants exposés
 *  par `components/ui/badge.tsx`. */
export const USER_ROLE_BADGE_VARIANT: Record<
  UserRole,
  "default" | "secondary" | "success" | "muted"
> = {
  admin: "default",
  auditor: "secondary",
  client_admin: "success",
  client: "muted",
};
