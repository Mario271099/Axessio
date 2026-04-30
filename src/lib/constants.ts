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
};

/** Statuts considérés comme "fermés" — utilisés par le simulateur de remédiation. */
export const NC_CLOSED_STATUSES: NCStatus[] = [
  "CORRECTED",
  "RESOLVED",
  "NON_REPRODUCIBLE",
];

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
  auditor: "Auditeur",
  client_admin: "Administrateur client",
  client_member: "Membre",
};
