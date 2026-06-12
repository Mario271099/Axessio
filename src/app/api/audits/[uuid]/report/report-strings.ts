// Dictionnaires bilingues du rapport PDF — encapsulés ici pour ne pas polluer
// `lib/constants.ts` (la majorité de l'app reste en FR). Tout libellé visible
// dans le PDF DOIT passer par ces tables.
// Extrait de report-template.tsx (découpage des gros fichiers).

import type {
  NCSeverity,
  NCStatus,
  PageType,
  PlatformType,
  ReferenceType,
  ServiceType,
} from "@/types/domain";
import type { ReportLocale } from "./report-types";

export type Dict = {
  // Cover
  coverTagline: string;
  coverKicker: string;
  coverServiceType: string;
  coverReference: string;
  coverPlatform: string;
  coverAuthor: string;
  // Synthesis
  synthTitle: string;
  synthScoreAria: string;
  synthGlobalRate: string;
  synthFormula: string;
  synthSrDivBy: string;
  synthSrMinus: string;
  synthSrTimes: string;
  synthEvaluated: string;
  synthCompliant: string;
  synthNonCompliant: string;
  synthNotApplicable: string;
  synthByThematic: string;
  synthByThematicCaption: string;
  synthByPage: string;
  synthByPageCaption: string;
  synthThematic: string;
  synthPage: string;
  synthType: string;
  synthNC: string;
  synthNA: string;
  synthRate: string;
  synthNoConformity: string;
  synthNoSample: string;
  synthBySeverity: string;
  unevaluated: string;
  // Pages detail
  pagesTitle: string;
  pagesIntro: string;
  pageLabel: string;
  pageScoreAria: string;
  pageNotEvaluated: string;
  pageCompliants: string;
  pageNCShort: string;
  pageNAShort: string;
  pageEvaluatedShort: string;
  thematicNotEvaluated: string;
  colNum: string;
  colCriterion: string;
  colStatus: string;
  colLevel: string;
  thematicCaption: string;
  // Status badges
  badgeCompliant: string;
  badgeNonCompliant: string;
  badgeNotApplicable: string;
  badgeUnevaluated: string;
  // NC section
  ncTitle: string;
  ncEmpty: string;
  ncIntro: string;
  ncTransversalGroup: string;
  ncPageGroup: string;
  ncDescription: string;
  ncActualResult: string;
  ncRecommendation: string;
  ncAttachments: string;
  ncCriterion: string;
  ncTest: string;
  ncPage: string;
  ncOfficialRef: string;
  ncTransversal: string;
  ncAttachmentPdfLabel: string;
  ncAttachmentImgAlt: string;
  ncMetaCaption: string;
  ncSeverityAria: string;
  ncStatusAria: string;
  ncReferenceAria: string;
  // Meta document
  docTitle: string;
  docSubject: string;
  docDescription: string;
  // Constants
  serviceType: Record<ServiceType, string>;
  platform: Record<PlatformType, string>;
  reference: Record<ReferenceType, string>;
  pageType: Record<PageType, string>;
  severity: Record<NCSeverity, string>;
  ncStatus: Record<NCStatus, string>;
};

const STRINGS_FR: Dict = {
  coverTagline: "Rapport d'audit d'accessibilité",
  coverKicker: "Rapport d'audit",
  coverServiceType: "Type d'audit",
  coverReference: "Référentiel",
  coverPlatform: "Plateforme",
  coverAuthor: "Réalisé par",
  synthTitle: "Synthèse",
  synthScoreAria: "Score global de conformité",
  synthGlobalRate: "Taux de conformité global",
  synthFormula:
    "Formule : conformes / (total − non applicables) × 100",
  synthSrDivBy: " divisé par ",
  synthSrMinus: " moins ",
  synthSrTimes: " multiplié par ",
  synthEvaluated: "Évalués",
  synthCompliant: "Conformes",
  synthNonCompliant: "Non conformes",
  synthNotApplicable: "Non applicables",
  synthByThematic: "Détail par thématique",
  synthByThematicCaption: "Taux de conformité par thématique du référentiel",
  synthByPage: "Détail par page",
  synthByPageCaption: "Taux de conformité par page de l'échantillon",
  synthThematic: "Thématique",
  synthPage: "Page",
  synthType: "Type",
  synthNC: "NC",
  synthNA: "NA",
  synthRate: "Taux",
  synthNoConformity: "Aucune évaluation enregistrée.",
  synthNoSample: "Aucune page dans l'échantillon.",
  synthBySeverity: "Répartition des non-conformités par sévérité",
  unevaluated: "Non évalué",
  pagesTitle: "Détail par page",
  pagesIntro:
    "Conformité de chaque page de l'échantillon, critère par critère, regroupée par thématique du référentiel.",
  pageLabel: "Page :",
  pageScoreAria: "Score de la page {name}",
  pageNotEvaluated: "Non évaluée",
  pageCompliants: "conformes",
  pageNCShort: "NC",
  pageNAShort: "NA",
  pageEvaluatedShort: "évalués",
  thematicNotEvaluated: "Thématique non évaluée sur cette page.",
  colNum: "N°",
  colCriterion: "Critère",
  colStatus: "Statut",
  colLevel: "Niveau",
  thematicCaption: "Critères de la thématique {id} {name}",
  badgeCompliant: "Conforme",
  badgeNonCompliant: "Non conforme",
  badgeNotApplicable: "Non applicable",
  badgeUnevaluated: "Non évalué",
  ncTitle: "Non-conformités détaillées",
  ncEmpty: "Aucune non-conformité relevée.",
  ncIntro:
    "{count, plural, one {# non-conformité relevée} other {# non-conformités relevées}}, {count, plural, one {ordonnée} other {ordonnées}} par page puis par sévérité.",
  ncTransversalGroup: "Non-conformités transversales",
  ncPageGroup: "Page : {name}",
  ncDescription: "Description",
  ncActualResult: "Résultat obtenu",
  ncRecommendation: "Recommandation",
  ncAttachments: "Pièces jointes",
  ncCriterion: "Critère",
  ncTest: "Test",
  ncPage: "Page",
  ncOfficialRef: "Référence officielle",
  ncTransversal: "Transversale",
  ncAttachmentPdfLabel: "Pièce jointe PDF : {name}",
  ncAttachmentImgAlt:
    "Capture d'écran liée à la non-conformité « {title} » : {name}",
  ncMetaCaption: "Métadonnées de la non-conformité {nc}",
  ncSeverityAria: "Sévérité {label}",
  ncStatusAria: "Statut {label}",
  ncReferenceAria: "Référence {nc}",
  docTitle: "Rapport d'audit — {project}",
  docSubject: "Rapport d'audit d'accessibilité numérique",
  docDescription:
    "Rapport d'audit d'accessibilité numérique pour {project} ({client}). Référentiel {reference} {version}, plateforme {platform}.",
  serviceType: {
    AUDIT: "Audit avec contre-audit",
    NO_COUNTER_AUDIT: "Audit sans contre-audit",
    COMPLIANCE_AUDIT: "Audit de conformité",
  },
  platform: { WEB: "Web", MOBILE: "Mobile" },
  reference: {
    RGAA: "RGAA",
    WCAG: "WCAG",
    RAWeb: "RAWeb",
    RAAM: "RAAM",
    PDF_UA: "PDF/UA",
    EN_301_549: "EN 301 549",
  },
  pageType: {
    MANDATORY: "Obligatoire",
    REPRESENTATIVE: "Représentative",
    TRANSVERSAL: "Transversale",
  },
  severity: {
    LOW: "Faible",
    MEDIUM: "Moyenne",
    HIGH: "Haute",
    CRITICAL: "Critique",
  },
  ncStatus: {
    OPEN: "Ouverte",
    IN_PROGRESS: "En cours",
    CORRECTED: "Corrigée",
    NON_REPRODUCIBLE: "Non reproductible",
    RESOLVED: "Résolue",
    REJECTED: "Rejetée",
    CANCELLED: "Annulée",
    TO_FIX: "À corriger",
    FIXED: "Corrigée",
  },
};

const STRINGS_EN: Dict = {
  coverTagline: "Accessibility audit report",
  coverKicker: "Audit report",
  coverServiceType: "Audit type",
  coverReference: "Reference",
  coverPlatform: "Platform",
  coverAuthor: "Carried out by",
  synthTitle: "Summary",
  synthScoreAria: "Global conformity score",
  synthGlobalRate: "Global conformity rate",
  synthFormula:
    "Formula: compliant / (total − not applicable) × 100",
  synthSrDivBy: " divided by ",
  synthSrMinus: " minus ",
  synthSrTimes: " multiplied by ",
  synthEvaluated: "Evaluated",
  synthCompliant: "Compliant",
  synthNonCompliant: "Non-compliant",
  synthNotApplicable: "Not applicable",
  synthByThematic: "Breakdown by topic",
  synthByThematicCaption: "Conformity rate by reference topic",
  synthByPage: "Breakdown by page",
  synthByPageCaption: "Conformity rate by sample page",
  synthThematic: "Topic",
  synthPage: "Page",
  synthType: "Type",
  synthNC: "NC",
  synthNA: "NA",
  synthRate: "Rate",
  synthNoConformity: "No evaluation recorded.",
  synthNoSample: "No page in the sample.",
  synthBySeverity: "Non-conformities by severity",
  unevaluated: "Not evaluated",
  pagesTitle: "Page-by-page detail",
  pagesIntro:
    "Conformity of each sample page, criterion by criterion, grouped by reference topic.",
  pageLabel: "Page:",
  pageScoreAria: "Score of page {name}",
  pageNotEvaluated: "Not evaluated",
  pageCompliants: "compliant",
  pageNCShort: "NC",
  pageNAShort: "NA",
  pageEvaluatedShort: "evaluated",
  thematicNotEvaluated: "Topic not evaluated on this page.",
  colNum: "No.",
  colCriterion: "Criterion",
  colStatus: "Status",
  colLevel: "Level",
  thematicCaption: "Criteria of topic {id} {name}",
  badgeCompliant: "Compliant",
  badgeNonCompliant: "Non-compliant",
  badgeNotApplicable: "Not applicable",
  badgeUnevaluated: "Not evaluated",
  ncTitle: "Detailed non-conformities",
  ncEmpty: "No non-conformity recorded.",
  ncIntro:
    "{count, plural, one {# non-conformity recorded} other {# non-conformities recorded}}, ordered by page then by severity.",
  ncTransversalGroup: "Transversal non-conformities",
  ncPageGroup: "Page: {name}",
  ncDescription: "Description",
  ncActualResult: "Observed result",
  ncRecommendation: "Recommendation",
  ncAttachments: "Attachments",
  ncCriterion: "Criterion",
  ncTest: "Test",
  ncPage: "Page",
  ncOfficialRef: "Official reference",
  ncTransversal: "Transversal",
  ncAttachmentPdfLabel: "PDF attachment: {name}",
  ncAttachmentImgAlt:
    "Screenshot linked to the non-conformity \"{title}\": {name}",
  ncMetaCaption: "Metadata of non-conformity {nc}",
  ncSeverityAria: "Severity {label}",
  ncStatusAria: "Status {label}",
  ncReferenceAria: "Reference {nc}",
  docTitle: "Audit report — {project}",
  docSubject: "Digital accessibility audit report",
  docDescription:
    "Digital accessibility audit report for {project} ({client}). Reference {reference} {version}, platform {platform}.",
  serviceType: {
    AUDIT: "Audit with counter-audit",
    NO_COUNTER_AUDIT: "Audit without counter-audit",
    COMPLIANCE_AUDIT: "Compliance audit",
  },
  platform: { WEB: "Web", MOBILE: "Mobile" },
  reference: {
    RGAA: "RGAA",
    WCAG: "WCAG",
    RAWeb: "RAWeb",
    RAAM: "RAAM",
    PDF_UA: "PDF/UA",
    EN_301_549: "EN 301 549",
  },
  pageType: {
    MANDATORY: "Mandatory",
    REPRESENTATIVE: "Representative",
    TRANSVERSAL: "Transversal",
  },
  severity: {
    LOW: "Low",
    MEDIUM: "Medium",
    HIGH: "High",
    CRITICAL: "Critical",
  },
  ncStatus: {
    OPEN: "Open",
    IN_PROGRESS: "In progress",
    CORRECTED: "Corrected",
    NON_REPRODUCIBLE: "Not reproducible",
    RESOLVED: "Resolved",
    REJECTED: "Rejected",
    CANCELLED: "Cancelled",
    TO_FIX: "To fix",
    FIXED: "Fixed",
  },
};

export function getDict(locale: ReportLocale): Dict {
  return locale === "en" ? STRINGS_EN : STRINGS_FR;
}

// Substitution simpliste — couvre nos placeholders {name}, {count}, etc.
// Le plural ICU est géré séparément (nous n'en avons qu'une seule chaîne).
export function fmt(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) =>
    k in vars ? String(vars[k]) : `{${k}}`,
  );
}

// Mini-ICU plural inliner — gère uniquement la forme `{count, plural, one {…} other {…}}`
// utilisée par `ncIntro` (le `#` est remplacé par le nombre).
export function plural(template: string, count: number): string {
  return template.replace(
    /\{count,\s*plural,\s*one\s*\{([^{}]*)\}\s*other\s*\{([^{}]*)\}\s*\}/g,
    (_, one: string, other: string) => {
      const branch = count === 1 ? one : other;
      return branch.replace(/#/g, String(count));
    },
  );
}
