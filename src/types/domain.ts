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
// L'ordre reflète la hiérarchie de privilèges (admin > auditor > client_admin > client).
// admin        : super-admin plateforme (gère utilisateurs, clients, etc.)
// auditor      : auditeur interne (ses projets assignés)
// client_admin : admin côté client (lecture audit + assigne auditeur)
// client       : utilisateur côté client (lecture seule + chat + remédiation)
export type UserRole = "admin" | "auditor" | "client_admin" | "client";

export interface Profile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  /**
   * Rôle **effectif** — éventuellement remplacé par le rôle d'impersonation
   * (View as). C'est le rôle que l'UI doit utiliser pour les checks de
   * permission et le rendu conditionnel.
   *
   * Pour TOUTE vérification côté serveur (server actions, RLS), il faut au
   * contraire utiliser le rôle réel issu de `profiles.role`. Le module
   * `lib/server-permissions.ts` y veille déjà.
   */
  role: UserRole;
  /** Rôle réel en base — utile pour afficher la bannière "Vous voyez en tant que". */
  realRole: UserRole;
  /** True si `role` diffère de `realRole` (impersonation active). */
  impersonating: boolean;
  clientId: string | null; // null pour les staff (admin / auditor)
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

export type WCAGLevel = "A" | "AA" | "AAA";

export interface Criterion {
  id: string;
  thematicId: string;
  identifier: string; // ex: "1.1", "6.1"
  name: string;
  url: string | null;
  disabilities: DisabilityType[];
  /** Libellé anglais (WCAG). NULL pour les référentiels francophones. */
  nameEn: string | null;
  /** Niveau WCAG (A / AA / AAA). NULL pour les référentiels sans niveau. */
  level: WCAGLevel | null;
  /** Principe WCAG (Perceivable, Operable, Understandable, Robust). */
  principle: string | null;
  /** Guideline WCAG (ex: "1.1 Text Alternatives"). */
  guideline: string | null;
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
  /** Date prévue de restitution (présentation du rapport). */
  restitutionAt: string | null;
  /** Date prévue du contre-audit (pour les prestations avec contre-audit). */
  counterAuditAt: string | null;
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
  | "CANCELLED"
  | "TO_FIX"
  | "FIXED"
  | "FALSE_POSITIVE";

/**
 * Cycle de relecture interne d'une NC. Indépendant de NCStatus (qui est le
 * statut métier de la NC). Cf. migration 33.
 */
export type NCReviewStatus =
  | "not_requested"
  | "pending"
  | "under_review"
  | "changes_requested"
  | "approved";

/** Fil de discussion sur une NC. Cf. migration 34. */
export type NCMessageThread = "client" | "review";

export interface NonConformity {
  id: string;
  auditId: string;
  pageId: string | null; // null = transversal
  criteriaId: string;
  testId: string | null;
  identifier: string | null;
  /** Numéro séquentiel par audit (1, 2, 3…). Affiché en UI "NC #001". */
  displayNumber: number;
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
