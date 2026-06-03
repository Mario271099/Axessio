/**
 * Types métier de Axessio.
 *
 * Ces types miroitent les énumérations de la base Postgres
 * (cf. `supabase/migrations/00_init_schema.sql`).
 * Quand `supabase gen types` aura tourné, on importera plutôt
 * depuis `./database.ts` pour avoir des types 100% synchronisés.
 */

// ============================================================================
// Tenancy — organisations (Phase 1 du refactor RBAC)
// ============================================================================
export type OrgType = "individual" | "agency" | "company" | "enterprise";

/**
 * Rôles d'organisation — 4 valeurs depuis la Phase 2 (mig. 67).
 * Voir ROLES_ROADMAP.md pour la matrice complète.
 *
 *   owner   : 1 par org, droits absolus + transfert de propriété
 *   admin   : tout sauf transfert d'ownership
 *   auditor : crée projets/audits, édite matrice et NC, fil client + review
 *   viewer  : lecture + commentaires (fil client + review), pas d'édition
 *
 * Les invités externes (PO d'un customer, auditeur ponctuel) ne sont JAMAIS
 * dans cette enum : ils passent par `audit_assignees.role = 'contact'`
 * (Porte 2 — voir Phase 5).
 */
export type OrgRole = "owner" | "admin" | "auditor" | "viewer";

export interface Organization {
  id: string;
  slug: string;
  name: string;
  type: OrgType;
  billingEmail: string;
  dataResidency: "eu" | "us" | "asia";
  createdAt: string;
}

/** Personnalisation visuelle d'une org (gated par la feature `branding.custom`). */
export interface OrgBranding {
  logoUrl: string | null;
  primaryColor: string | null; // #RRGGBB
  accentColor: string | null;  // #RRGGBB
  supportEmail: string | null;
  customDomain: string | null;
}

export interface OrganizationMembership {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  organizationType: OrgType;
  role: OrgRole;
}

/** UUID stable de l'organisation interne Axessio (cf. migration 43). */
export const AXESSIO_INTERNAL_ORG_ID =
  "00000000-0000-0000-0000-000000000001";

// ============================================================================
// Workspaces (Phase 6) — sous-divisions à l'intérieur d'une org
// ============================================================================
export interface Workspace {
  id: string;
  organizationId: string;
  slug: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  isArchived: boolean;
  createdAt: string;
}

/** Workspace + rôle effectif de l'utilisateur (incluant l'héritage org). */
export interface WorkspaceMembership {
  workspaceId: string;
  organizationId: string;
  slug: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  isArchived: boolean;
  effectiveRole: OrgRole;
}

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
   * Rôle **plateforme effectif** — éventuellement remplacé par le rôle
   * d'impersonation (View as). C'est le rôle que l'UI doit utiliser pour le
   * rendu conditionnel.
   *
   * Pour TOUTE vérification côté serveur (server actions, RLS), il faut au
   * contraire utiliser le rôle réel issu de `profiles.role`. Le module
   * `lib/server-permissions.ts` y veille déjà.
   *
   * ⚠️ Précédence d'autorisation (cf. CLAUDE.md § "Précédence des
   * autorisations") : pour toute NOUVELLE logique multi-tenant, la source de
   * vérité est la permission d'organisation (`canOrg()` /
   * `requireOrgPermission()` / `has_org_permission()` côté SQL), PAS ce champ.
   * `role` reste le mécanisme legacy qui gate encore les writes plateforme
   * (audits/pages/NC), conservé tant que la bascule par étape n'est pas
   * terminée. Ne pas inliner de nouveau check `role === "..."`.
   */
  role: UserRole;
  /** Rôle réel en base — utile pour afficher la bannière "Vous voyez en tant que". */
  realRole: UserRole;
  /** True si `role` diffère de `realRole` (impersonation active). */
  impersonating: boolean;
  clientId: string | null; // null pour les staff (admin / auditor)
  language: "fr" | "en";
  /** URL publique de l'avatar uploadé sur Supabase Storage. null = initiales. */
  avatarUrl: string | null;
  /**
   * Super-administrateur plateforme Axessio. Court-circuite TOUTES les
   * restrictions (RLS SQL via `is_admin()` + checks UI/server actions).
   * Source de vérité unique pour le « peut tout voir, peut tout faire »
   * — backfillé depuis `role = 'admin'` par la migration 69. À utiliser
   * à la place de `role === "admin"` dans tout nouveau code.
   */
  isPlatformAdmin: boolean;
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

// Note : la valeur 'FALSE_POSITIVE' a été retirée du cycle (migration 64).
// Une NC identifiée à tort doit désormais être supprimée, pas masquée
// derrière un statut. Les valeurs legacy (OPEN, CORRECTED, etc.) sont
// conservées pour compatibilité avec les anciens enregistrements.
export type NCStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "CORRECTED"
  | "NON_REPRODUCIBLE"
  | "RESOLVED"
  | "REJECTED"
  | "CANCELLED"
  | "TO_FIX"
  | "FIXED";

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
