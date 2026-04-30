/**
 * Types métier de Axessio.
 *
 * Ces types miroitent les énumérations de la base Postgres
 * (cf. `supabase/migrations/00_init_schema.sql`).
 * Quand `supabase gen types` aura tourné, on importera plutôt
 * depuis `./database.ts` pour avoir des types 100% synchronisés.
 */

// ============================================================================
// Rôles & utilisateurs
// ============================================================================
export type UserRole = "auditor" | "client_admin" | "client_member";

export interface Profile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  clientId: string | null; // null pour les auditeurs internes
  language: "fr" | "en";
}

// ============================================================================
// Référentiels
// ============================================================================
export type ReferenceType =
  | "RGAA"
  | "WCAG"
  | "RAWeb"
  | "RAAM"
  | "PDF_UA"
  | "EN_301_549";

export type DisabilityType = "VISUAL" | "COGNITIVE" | "AUDITORY" | "MOTOR";

export interface Reference {
  id: string;
  type: ReferenceType;
  version: string;
  isActive: boolean;
}

export interface Thematic {
  id: string;
  referenceId: string;
  identifier: string; // ex: "1", "6"
  name: string;
  sortOrder: number;
}

export interface Criterion {
  id: string;
  thematicId: string;
  identifier: string; // ex: "1.1", "6.1"
  name: string;
  url: string | null;
  disabilities: DisabilityType[];
}

// ============================================================================
// Audit
// ============================================================================
export type PlatformType = "WEB" | "MOBILE";

export type ServiceType = "AUDIT" | "NO_COUNTER_AUDIT" | "COMPLIANCE_AUDIT";

export type AuditStatus =
  | "PENDING"
  | "PLANNED"
  | "IN_PROGRESS"
  | "DELIVERED"
  | "REMEDIATION"
  | "COUNTER_AUDIT"
  | "ONLINE"
  | "COMPLETED"
  | "ARCHIVED";

export interface Audit {
  id: string;
  projectId: string;
  referenceId: string;
  serviceType: ServiceType;
  platform: PlatformType;
  status: AuditStatus;
  language: "fr" | "en";
  expectedStartAt: string | null;
  expectedEndAt: string | null;
  deliveredAt: string | null;
  onlineAt: string | null;
  initialScore: number | null;
  finalScore: number | null;
  accessibilityLink: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Page (échantillon)
// ============================================================================
export type PageType = "MANDATORY" | "REPRESENTATIVE" | "TRANSVERSAL";

export type ComplexityLevel =
  | "ULTRA_SIMPLE"
  | "SIMPLE"
  | "MINIMAL"
  | "COMPLEX";

export interface AuditPage {
  id: string;
  auditId: string;
  name: string;
  url: string | null;
  pageType: PageType;
  complexity: ComplexityLevel | null;
  sortOrder: number;
}

/** Pages obligatoires que la création d'un audit insère systématiquement. */
export const MANDATORY_PAGES: ReadonlyArray<{ name: string; pageType: PageType }> = [
  { name: "Accueil",            pageType: "MANDATORY" },
  { name: "Contact",            pageType: "MANDATORY" },
  { name: "Mentions légales",   pageType: "MANDATORY" },
  { name: "Plan du site",       pageType: "MANDATORY" },
  { name: "Page d'accessibilité", pageType: "MANDATORY" },
];

// ============================================================================
// Conformité (par page et par critère)
// ============================================================================
export type ConformityStatus = "COMPLIANT" | "NON_COMPLIANT" | "NOT_APPLICABLE";

export interface PageConformity {
  id: string;
  auditId: string;
  pageId: string;
  criteriaId: string;
  status: ConformityStatus;
}

// ============================================================================
// Non-conformités
// ============================================================================
export type NCSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type NCStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "CORRECTED"
  | "NON_REPRODUCIBLE"
  | "RESOLVED"
  | "REJECTED"
  | "CANCELLED";

export interface NonConformity {
  id: string;
  auditId: string;
  pageId: string | null; // null = transversal
  criteriaId: string;
  testId: string | null;
  identifier: string | null;
  title: string;
  description: string | null;
  recommendation: string | null;
  externalReference: string | null;
  severity: NCSeverity;
  status: NCStatus;
  createdAt: string;
  updatedAt: string;
}

/** NC enrichie (avec critère et page joints) — utile pour le simulateur. */
export interface NonConformityEnriched extends NonConformity {
  criterion: Pick<Criterion, "id" | "identifier" | "name">;
  page: Pick<AuditPage, "id" | "name"> | null;
}

// ============================================================================
// Client & Project
// ============================================================================
export interface Client {
  id: string;
  name: string;
  contractStartAt: string;
  logoUrl: string | null;
  hasSubscription: boolean;
}

export interface Project {
  id: string;
  clientId: string;
  name: string;
  url: string | null;
  logoUrl: string | null;
}
