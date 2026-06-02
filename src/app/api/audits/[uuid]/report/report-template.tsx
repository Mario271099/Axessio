import {
  calculateScore,
  getConformityLabel,
  getConformityLevel,
} from "@/lib/score";
import { NC_SEVERITY_ORDER } from "@/lib/constants";
import {
  AXESSIO_DEFAULT_OUTPUT_BRANDING,
  type OutputBranding,
} from "@/lib/branding/output";
import type {
  AuditStatus,
  ConformityStatus,
  NCSeverity,
  NCStatus,
  PageType,
  PlatformType,
  ReferenceType,
  ServiceType,
  UserRole,
  WCAGLevel,
} from "@/types/domain";

// ============================================================================
// Forme des données passées au template par la route.
// ============================================================================

export type ReportLocale = "fr" | "en";

export interface ReportData {
  generatedAt: string;
  /** Branding de sortie (org white-label ou défauts Axessio). */
  branding: OutputBranding;
  auditor: {
    name: string;
    role: UserRole;
  };
  audit: {
    id: string;
    status: AuditStatus;
    platform: PlatformType;
    serviceType: ServiceType;
    initialScore: number | null;
    finalScore: number | null;
    deliveredAt: string | null;
    onlineAt: string | null;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
  };
  project: {
    id: string;
    name: string;
    url: string | null;
  };
  client: {
    id: string;
    name: string;
    website: string | null;
  };
  reference: {
    id: string;
    type: ReferenceType;
    version: string;
  };
  pages: Array<{
    id: string;
    name: string;
    url: string | null;
    pageType: PageType;
    sortOrder: number;
  }>;
  thematics: Array<{
    id: string;
    identifier: string;
    name: string;
    sortOrder: number;
  }>;
  criteria: Array<{
    id: string;
    thematicId: string;
    identifier: string;
    name: string;
    nameEn: string | null;
    level: WCAGLevel | null;
  }>;
  pageConformities: Array<{
    id: string;
    pageId: string;
    criteriaId: string;
    status: ConformityStatus;
  }>;
  nonConformities: Array<{
    id: string;
    pageId: string | null;
    criteriaId: string;
    title: string;
    description: string | null;
    actualResult: string | null;
    recommendation: string | null;
    severity: NCSeverity;
    status: NCStatus;
    testReference: string | null;
    criterion: { identifier: string; name: string; url: string | null };
    page: { name: string; sortOrder: number } | null;
    attachments: Array<{
      id: string;
      storagePath: string;
      fileName: string | null;
      mimeType: string | null;
      kind: string;
      signedUrl: string | null;
    }>;
  }>;
}

// ============================================================================
// Dictionnaires bilingues — encapsulés dans le template pour ne pas polluer
// `lib/constants.ts` (la majorité de l'app reste en FR). Tout libellé visible
// dans le PDF DOIT passer par ces tables.
// ============================================================================

type Dict = {
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

function getDict(locale: ReportLocale): Dict {
  return locale === "en" ? STRINGS_EN : STRINGS_FR;
}

function intlLocale(locale: ReportLocale): string {
  return locale === "en" ? "en-US" : "fr-FR";
}

// Substitution simpliste — couvre nos placeholders {name}, {count}, etc.
// Le plural ICU est géré séparément (nous n'en avons qu'une seule chaîne).
function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) =>
    k in vars ? String(vars[k]) : `{${k}}`,
  );
}

// Mini-ICU plural inliner — gère uniquement la forme `{count, plural, one {…} other {…}}`
// utilisée par `ncIntro` (le `#` est remplacé par le nombre).
function plural(template: string, count: number): string {
  return template.replace(
    /\{count,\s*plural,\s*one\s*\{([^{}]*)\}\s*other\s*\{([^{}]*)\}\s*\}/g,
    (_, one: string, other: string) => {
      const branch = count === 1 ? one : other;
      return branch.replace(/#/g, String(count));
    },
  );
}

// ============================================================================
// Helpers
// ============================================================================

function esc(value: string | null | undefined): string {
  if (value == null) return "";
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(iso: string | null, locale: ReportLocale): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(intlLocale(locale), {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

interface ConformityCounts {
  compliant: number;
  nonCompliant: number;
  notApplicable: number;
  total: number;
}

function emptyCounts(): ConformityCounts {
  return { compliant: 0, nonCompliant: 0, notApplicable: 0, total: 0 };
}

function addStatus(counts: ConformityCounts, status: ConformityStatus): void {
  counts.total += 1;
  if (status === "COMPLIANT") counts.compliant += 1;
  else if (status === "NON_COMPLIANT") counts.nonCompliant += 1;
  else if (status === "NOT_APPLICABLE") counts.notApplicable += 1;
}

function rate(counts: ConformityCounts): number {
  return calculateScore({
    compliant: counts.compliant,
    notApplicable: counts.notApplicable,
    totalCriteria: counts.total,
  });
}

function formatRate(value: number): string {
  return `${value.toFixed(2).replace(/\.00$/, "")} %`;
}

const COLORS = {
  text: "#111111",
  muted: "#6b7280",
  light: "#d1d5db",
  bg: "#f9fafb",
  green: "#16a34a",
  red: "#dc2626",
  orange: "#ea580c",
};

function colorForScore(score: number): string {
  switch (getConformityLevel(score)) {
    case "non-compliant":
      return COLORS.red;
    case "partial":
      return COLORS.orange;
    case "full":
      return COLORS.green;
  }
}

// ============================================================================
// CSS global
// ============================================================================
const PRINT_CSS = `
  @page { size: A4 portrait; margin: 20mm; }

  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
      Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.55;
    color: ${COLORS.text};
    background: #ffffff;
  }
  p { margin: 0 0 8px; }
  h1, h2, h3 {
    color: ${COLORS.text};
    letter-spacing: -0.01em;
    margin: 0;
  }
  h1 { font-size: 22pt; line-height: 1.15; }
  h2 { font-size: 15pt; margin: 0 0 14px; }
  h3 { font-size: 12pt; margin: 16px 0 8px; }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .cover {
    height: 257mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    page-break-after: always;
    break-after: page;
  }
  .cover .brand {
    text-align: center;
    padding-top: 12mm;
  }
  .cover .brand .logo {
    font-size: 28pt;
    font-weight: 700;
    letter-spacing: -0.03em;
    color: ${COLORS.text};
  }
  .cover .brand .logo-img {
    max-height: 18mm;
    max-width: 70mm;
    object-fit: contain;
  }
  .cover .brand .tagline {
    margin-top: 4px;
    font-size: 11pt;
    color: ${COLORS.muted};
  }
  .cover .hero {
    text-align: center;
    padding: 0 8mm;
  }
  .cover .hero .kicker {
    font-size: 11pt;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: ${COLORS.muted};
    margin-bottom: 24px;
  }
  .cover .hero h1 {
    margin: 0 0 8px;
    font-size: 30pt;
  }
  .cover .hero .client-name {
    font-size: 14pt;
    color: ${COLORS.muted};
    margin-bottom: 32px;
  }
  .cover .hero dl {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 6px 16px;
    max-width: 360px;
    margin: 0 auto;
    text-align: left;
  }
  .cover .hero dt {
    font-size: 9pt;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: ${COLORS.muted};
    align-self: center;
  }
  .cover .hero dd {
    margin: 0;
    font-size: 11pt;
    color: ${COLORS.text};
  }
  .cover .signature {
    text-align: center;
    padding-bottom: 6mm;
    color: ${COLORS.muted};
    font-size: 10pt;
  }
  .cover .signature .auditor {
    color: ${COLORS.text};
    font-weight: 500;
  }

  section.page {
    page-break-before: always;
    break-before: page;
  }

  .score-card {
    border: 1px solid ${COLORS.light};
    border-radius: 6px;
    padding: 20px 24px;
    display: flex;
    align-items: center;
    gap: 24px;
    margin-bottom: 24px;
    background: ${COLORS.bg};
  }
  .score-card .pct {
    font-size: 42pt;
    font-weight: 700;
    line-height: 1;
    letter-spacing: -0.03em;
  }
  .score-card .label {
    font-size: 14pt;
    font-weight: 600;
  }
  .score-card .sub {
    font-size: 9pt;
    color: ${COLORS.muted};
    margin-top: 4px;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin: 16px 0 24px;
  }
  .stats-grid .stat {
    border: 1px solid ${COLORS.light};
    border-radius: 4px;
    padding: 10px 12px;
  }
  .stats-grid .stat .value {
    font-size: 18pt;
    font-weight: 600;
    line-height: 1.1;
  }
  .stats-grid .stat .name {
    margin-top: 2px;
    font-size: 9pt;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: ${COLORS.muted};
  }

  table.report {
    width: 100%;
    border-collapse: collapse;
    margin: 0 0 16px;
    font-size: 9.5pt;
  }
  table.report th,
  table.report td {
    border: 1px solid ${COLORS.light};
    padding: 6px 10px;
    text-align: left;
    vertical-align: top;
  }
  table.report thead th {
    background: ${COLORS.bg};
    color: ${COLORS.text};
    font-weight: 600;
    font-size: 9pt;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  table.report td.num,
  table.report th.num {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  table.report tr {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .severity-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-top: 12px;
  }
  .severity-row .sev {
    border: 1px solid ${COLORS.light};
    border-radius: 4px;
    padding: 10px 12px;
  }
  .severity-row .sev .count {
    font-size: 22pt;
    font-weight: 700;
    line-height: 1;
  }
  .severity-row .sev .name {
    margin-top: 4px;
    font-size: 9pt;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: ${COLORS.muted};
  }
  .severity-row .sev.critical .count { color: ${COLORS.red}; }
  .severity-row .sev.high .count { color: ${COLORS.orange}; }
  .severity-row .sev.medium .count { color: #ca8a04; }
  .severity-row .sev.low .count { color: ${COLORS.muted}; }

  section.pages-section {
    page-break-before: always;
    break-before: page;
  }
  section.pages-section > h1 {
    margin-bottom: 8px;
  }
  section.pages-section > p.intro {
    color: #4b5563;
    margin-bottom: 24px;
    font-size: 10.5pt;
  }
  section.page-detail {
    page-break-before: always;
    break-before: page;
  }
  section.page-detail:first-of-type {
    page-break-before: auto;
    break-before: auto;
  }
  .page-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 16px;
  }
  .page-head .titles {
    flex: 1;
    min-width: 0;
  }
  .page-head h2 {
    margin-bottom: 4px;
  }
  .page-head .subtitle {
    font-size: 10pt;
    color: ${COLORS.muted};
  }
  .page-head .subtitle .url {
    margin-left: 8px;
    word-break: break-all;
  }
  .page-head .score-mini {
    flex: 0 0 auto;
    min-width: 150px;
    text-align: right;
    border: 1px solid ${COLORS.light};
    border-radius: 6px;
    padding: 10px 14px;
    background: ${COLORS.bg};
  }
  .page-head .score-mini .pct {
    font-size: 20pt;
    font-weight: 700;
    line-height: 1;
    letter-spacing: -0.02em;
  }
  .page-head .score-mini .lbl {
    margin-top: 4px;
    font-size: 9pt;
    font-weight: 600;
  }
  .page-head .score-mini .counts {
    margin-top: 6px;
    font-size: 9pt;
    color: ${COLORS.muted};
  }

  table.criteria {
    width: 100%;
    border-collapse: collapse;
    margin: 0 0 14px;
    font-size: 9.5pt;
  }
  table.criteria th,
  table.criteria td {
    border: 1px solid ${COLORS.light};
    padding: 6px 10px;
    text-align: left;
    vertical-align: top;
  }
  table.criteria thead th {
    background: ${COLORS.bg};
    color: ${COLORS.text};
    font-weight: 600;
    font-size: 9pt;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  table.criteria tbody tr {
    page-break-inside: avoid;
    break-inside: avoid;
  }
  table.criteria col.col-num { width: 56px; }
  table.criteria col.col-status { width: 110px; }
  table.criteria col.col-level { width: 60px; }
  table.criteria .crit-name-en {
    display: block;
    margin-top: 2px;
    font-size: 9pt;
    color: #4b5563;
  }
  table.criteria td.identifier {
    font-variant-numeric: tabular-nums;
    font-weight: 600;
    color: ${COLORS.text};
    white-space: nowrap;
  }

  .badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 9pt;
    font-weight: 600;
    letter-spacing: 0.02em;
    line-height: 1.4;
    white-space: nowrap;
  }
  .badge.compliant { background: #dcfce7; color: #15803d; }
  .badge.non-compliant { background: #fee2e2; color: #b91c1c; }
  .badge.not-applicable { background: #f3f4f6; color: #374151; }
  .badge.unevaluated {
    background: transparent;
    color: #4b5563;
    font-weight: 600;
  }
  .badge.level {
    background: ${COLORS.bg};
    color: ${COLORS.text};
    border: 1px solid #9ca3af;
    font-weight: 700;
  }

  .thematic-empty {
    margin: 0 0 18px;
    padding: 10px 12px;
    border: 1px dashed ${COLORS.light};
    border-radius: 4px;
    color: ${COLORS.muted};
    font-size: 9.5pt;
    font-style: italic;
  }

  h3.thematic-title {
    margin: 18px 0 8px;
    font-size: 11.5pt;
    color: ${COLORS.text};
  }
  h3.thematic-title:first-of-type {
    margin-top: 8px;
  }

  section.nc-section {
    page-break-before: always;
    break-before: page;
  }
  section.nc-section > h1 {
    font-size: 22pt;
    margin: 0 0 8px;
  }
  section.nc-section > .nc-intro {
    color: ${COLORS.muted};
    margin-bottom: 24px;
    font-size: 10pt;
  }

  .nc-empty {
    margin: 24px 0;
    padding: 16px 18px;
    border: 1px dashed ${COLORS.light};
    border-radius: 4px;
    color: ${COLORS.muted};
    font-style: italic;
    text-align: center;
  }

  .nc-block {
    page-break-before: always;
    break-before: page;
    page-break-inside: auto;
  }
  .nc-block:first-of-type {
    page-break-before: avoid;
    break-before: avoid;
  }

  .nc-head-group {
    page-break-inside: avoid;
    break-inside: avoid;
    page-break-after: avoid;
    break-after: avoid;
  }

  .nc-head {
    display: flex;
    align-items: baseline;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 4px;
  }
  .nc-head .nc-number {
    font-size: 9pt;
    font-weight: 600;
    color: ${COLORS.muted};
    letter-spacing: 0.04em;
    font-variant-numeric: tabular-nums;
  }
  .nc-head h3 {
    font-size: 13pt;
    line-height: 1.25;
    flex: 1 1 100%;
    margin-top: 4px;
  }

  .nc-meta {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0 12px;
    font-size: 9.5pt;
  }
  .nc-meta th,
  .nc-meta td {
    border: 1px solid ${COLORS.light};
    padding: 5px 10px;
    text-align: left;
    vertical-align: top;
  }
  .nc-meta th {
    background: ${COLORS.bg};
    width: 30%;
    font-weight: 600;
    color: ${COLORS.muted};
    text-transform: uppercase;
    font-size: 9pt;
    letter-spacing: 0.04em;
  }
  .nc-meta a {
    color: ${COLORS.text};
    text-decoration: underline;
    text-decoration-color: ${COLORS.muted};
    word-break: break-all;
  }

  .nc-section-title {
    margin: 16px 0 4px;
    font-size: 10pt;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: ${COLORS.muted};
  }
  .nc-prose {
    margin: 0 0 8px;
    white-space: pre-wrap;
    word-wrap: break-word;
    font-size: 10pt;
    color: ${COLORS.text};
  }

  .nc-attachments {
    margin-top: 16px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }
  .nc-attach {
    border: 1px solid ${COLORS.light};
    border-radius: 4px;
    padding: 6px;
    background: ${COLORS.bg};
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .nc-attach img {
    display: block;
    width: 100%;
    max-height: 300px;
    object-fit: contain;
    background: #ffffff;
    border-radius: 2px;
  }
  .nc-attach .pdf-fallback {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 18px 12px;
    background: #ffffff;
    border-radius: 2px;
    color: ${COLORS.text};
  }
  .nc-attach .pdf-fallback .pdf-icon {
    flex: 0 0 auto;
    width: 36px;
    height: 44px;
    border: 1px solid ${COLORS.red};
    border-radius: 3px;
    color: ${COLORS.red};
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 9pt;
    font-weight: 700;
    letter-spacing: 0.04em;
  }
  .nc-attach .pdf-fallback .pdf-name {
    word-break: break-all;
    font-size: 9.5pt;
  }
  .nc-attach .caption {
    margin-top: 6px;
    font-size: 9pt;
    color: #4b5563;
    word-break: break-all;
  }

  .badge.sev-critical {
    background: #fee2e2;
    color: #b91c1c;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .badge.sev-high {
    background: #ffedd5;
    color: #c2410c;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .badge.sev-medium {
    background: #fef9c3;
    color: #854d0e;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .badge.sev-low {
    background: #f3f4f6;
    color: #4b5563;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .badge.status-open { background: #fee2e2; color: #b91c1c; }
  .badge.status-progress { background: #fef9c3; color: #854d0e; }
  .badge.status-done { background: #dcfce7; color: #15803d; }
  .badge.status-rejected { background: #f3f4f6; color: #4b5563; }
`;

// ============================================================================
// Page de garde
// ============================================================================
function renderCover(data: ReportData, locale: ReportLocale, d: Dict): string {
  const { audit, project, client, reference, auditor, generatedAt, branding } =
    data;
  // Logo custom (image) si fourni, sinon wordmark texte au nom de la marque.
  const brandMark = branding.logoUrl
    ? `<img class="logo-img" src="${esc(branding.logoUrl)}" alt="${esc(branding.brandName)}" />`
    : `<p class="logo">${esc(branding.brandName)}</p>`;
  // Tagline : celle de la marque si custom, sinon la tagline i18n du rapport.
  const tagline = branding.tagline ?? d.coverTagline;
  return `
    <header class="cover" role="banner">
      <div class="brand">
        ${brandMark}
        <p class="tagline">${esc(tagline)}</p>
      </div>

      <div class="hero">
        <p class="kicker" aria-hidden="true">${esc(d.coverKicker)}</p>
        <h1>${esc(project.name)}</h1>
        <p class="client-name">${esc(client.name)}</p>

        <dl>
          <dt>${esc(d.coverServiceType)}</dt>
          <dd>${esc(d.serviceType[audit.serviceType])}</dd>

          <dt>${esc(d.coverReference)}</dt>
          <dd>${esc(d.reference[reference.type])} ${esc(reference.version)}</dd>

          <dt>${esc(d.coverPlatform)}</dt>
          <dd>${esc(d.platform[audit.platform])}</dd>
        </dl>
      </div>

      <p class="signature">
        ${esc(d.coverAuthor)} <span class="auditor">${esc(auditor.name)}</span><br />
        <time datetime="${esc(generatedAt)}">${esc(formatDate(generatedAt, locale))}</time>
      </p>
    </header>
  `;
}

// ============================================================================
// Synthèse
// ============================================================================
function renderSynthesis(data: ReportData, d: Dict): string {
  const { pageConformities, thematics, criteria, pages, nonConformities } = data;

  const global = emptyCounts();
  for (const conf of pageConformities) addStatus(global, conf.status);
  const globalScore = rate(global);
  const globalColor = colorForScore(globalScore);
  const globalLabel = getConformityLabel(globalScore);

  const criteriaById = new Map(criteria.map((c) => [c.id, c]));
  const perThematic = new Map<string, ConformityCounts>(
    thematics.map((t) => [t.id, emptyCounts()]),
  );
  for (const conf of pageConformities) {
    const crit = criteriaById.get(conf.criteriaId);
    if (!crit) continue;
    const counts = perThematic.get(crit.thematicId);
    if (!counts) continue;
    addStatus(counts, conf.status);
  }
  const thematicRows = thematics
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((t) => {
      const counts = perThematic.get(t.id) ?? emptyCounts();
      const score = rate(counts);
      return `
        <tr>
          <td>${esc(t.identifier)} — ${esc(t.name)}</td>
          <td class="num">${counts.total}</td>
          <td class="num">${counts.compliant}</td>
          <td class="num">${counts.nonCompliant}</td>
          <td class="num">${counts.notApplicable}</td>
          <td class="num" style="color: ${colorForScore(score)}; font-weight: 600;">
            ${
              counts.total === 0
                ? `<span aria-hidden="true">—</span><span class="sr-only">${esc(d.unevaluated)}</span>`
                : esc(formatRate(score))
            }
          </td>
        </tr>`;
    })
    .join("");

  const perPage = new Map<string, ConformityCounts>(
    pages.map((p) => [p.id, emptyCounts()]),
  );
  for (const conf of pageConformities) {
    const counts = perPage.get(conf.pageId);
    if (!counts) continue;
    addStatus(counts, conf.status);
  }
  const pageRows = pages
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((p) => {
      const counts = perPage.get(p.id) ?? emptyCounts();
      const score = rate(counts);
      return `
        <tr>
          <td>${esc(p.name)}</td>
          <td>${esc(d.pageType[p.pageType])}</td>
          <td class="num">${counts.total}</td>
          <td class="num" style="color: ${colorForScore(score)}; font-weight: 600;">
            ${
              counts.total === 0
                ? `<span aria-hidden="true">—</span><span class="sr-only">${esc(d.unevaluated)}</span>`
                : esc(formatRate(score))
            }
          </td>
        </tr>`;
    })
    .join("");

  const ncBySeverity: Record<NCSeverity, number> = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
  };
  for (const nc of nonConformities) ncBySeverity[nc.severity] += 1;

  return `
    <section class="page" aria-labelledby="synthese-title">
      <h1 id="synthese-title">${esc(d.synthTitle)}</h1>

      <div class="score-card" role="group" aria-label="${esc(d.synthScoreAria)}">
        <div>
          <p class="pct" style="color: ${globalColor};">
            ${esc(formatRate(globalScore))}
          </p>
          <p class="sub">${esc(d.synthGlobalRate)}</p>
        </div>
        <div style="flex: 1;">
          <p class="label" style="color: ${globalColor};">
            ${esc(globalLabel)}
          </p>
          <p class="sub">${esc(d.synthFormula)}</p>
        </div>
      </div>

      <dl class="stats-grid">
        <div class="stat">
          <dt class="name">${esc(d.synthEvaluated)}</dt>
          <dd class="value">${global.total}</dd>
        </div>
        <div class="stat">
          <dt class="name">${esc(d.synthCompliant)}</dt>
          <dd class="value" style="color: ${COLORS.green};">${global.compliant}</dd>
        </div>
        <div class="stat">
          <dt class="name">${esc(d.synthNonCompliant)}</dt>
          <dd class="value" style="color: ${COLORS.red};">${global.nonCompliant}</dd>
        </div>
        <div class="stat">
          <dt class="name">${esc(d.synthNotApplicable)}</dt>
          <dd class="value" style="color: ${COLORS.muted};">${global.notApplicable}</dd>
        </div>
      </dl>

      <h2>${esc(d.synthByThematic)}</h2>
      <table class="report">
        <caption class="sr-only">${esc(d.synthByThematicCaption)}</caption>
        <thead>
          <tr>
            <th scope="col">${esc(d.synthThematic)}</th>
            <th scope="col" class="num">${esc(d.synthEvaluated)}</th>
            <th scope="col" class="num">${esc(d.synthCompliant)}</th>
            <th scope="col" class="num">${esc(d.synthNC)}</th>
            <th scope="col" class="num">${esc(d.synthNA)}</th>
            <th scope="col" class="num">${esc(d.synthRate)}</th>
          </tr>
        </thead>
        <tbody>
          ${thematicRows || `<tr><td colspan="6" style="text-align:center; color:${COLORS.muted};">${esc(d.synthNoConformity)}</td></tr>`}
        </tbody>
      </table>

      <h2>${esc(d.synthByPage)}</h2>
      <table class="report">
        <caption class="sr-only">${esc(d.synthByPageCaption)}</caption>
        <thead>
          <tr>
            <th scope="col">${esc(d.synthPage)}</th>
            <th scope="col">${esc(d.synthType)}</th>
            <th scope="col" class="num">${esc(d.synthEvaluated)}</th>
            <th scope="col" class="num">${esc(d.synthRate)}</th>
          </tr>
        </thead>
        <tbody>
          ${pageRows || `<tr><td colspan="4" style="text-align:center; color:${COLORS.muted};">${esc(d.synthNoSample)}</td></tr>`}
        </tbody>
      </table>

      <h2>${esc(d.synthBySeverity)}</h2>
      <dl class="severity-row" aria-label="${esc(d.synthBySeverity)}">
        <div class="sev critical">
          <dt class="name">${esc(d.severity.CRITICAL)}</dt>
          <dd class="count">${ncBySeverity.CRITICAL}</dd>
        </div>
        <div class="sev high">
          <dt class="name">${esc(d.severity.HIGH)}</dt>
          <dd class="count">${ncBySeverity.HIGH}</dd>
        </div>
        <div class="sev medium">
          <dt class="name">${esc(d.severity.MEDIUM)}</dt>
          <dd class="count">${ncBySeverity.MEDIUM}</dd>
        </div>
        <div class="sev low">
          <dt class="name">${esc(d.severity.LOW)}</dt>
          <dd class="count">${ncBySeverity.LOW}</dd>
        </div>
      </dl>
    </section>
  `;
}

// ============================================================================
// Détail par page
// ============================================================================
function statusBadge(status: ConformityStatus | null, d: Dict): string {
  if (status === "COMPLIANT") {
    return `<span class="badge compliant">${esc(d.badgeCompliant)}</span>`;
  }
  if (status === "NON_COMPLIANT") {
    return `<span class="badge non-compliant">${esc(d.badgeNonCompliant)}</span>`;
  }
  if (status === "NOT_APPLICABLE") {
    return `<span class="badge not-applicable">${esc(d.badgeNotApplicable)}</span>`;
  }
  return `<span class="badge unevaluated">${esc(d.badgeUnevaluated)}</span>`;
}

function levelBadge(level: WCAGLevel | null): string {
  if (!level) return "";
  return `<span class="badge level">${esc(level)}</span>`;
}

function renderPagesDetail(
  data: ReportData,
  locale: ReportLocale,
  d: Dict,
): string {
  const { pages, thematics, criteria, pageConformities, reference } = data;
  if (pages.length === 0) return "";

  const showLevelColumn = reference.type === "WCAG";

  const criteriaByThematic = new Map<string, ReportData["criteria"]>();
  for (const t of thematics) criteriaByThematic.set(t.id, []);
  for (const c of criteria) {
    const list = criteriaByThematic.get(c.thematicId);
    if (list) list.push(c);
  }
  for (const list of criteriaByThematic.values()) {
    list.sort((a, b) =>
      a.identifier.localeCompare(b.identifier, intlLocale(locale), {
        numeric: true,
      }),
    );
  }

  const statusByPage = new Map<string, Map<string, ConformityStatus>>();
  for (const conf of pageConformities) {
    let inner = statusByPage.get(conf.pageId);
    if (!inner) {
      inner = new Map();
      statusByPage.set(conf.pageId, inner);
    }
    inner.set(conf.criteriaId, conf.status);
  }

  const sortedThematics = thematics
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const sortedPages = pages.slice().sort((a, b) => a.sortOrder - b.sortOrder);

  if (sortedPages.length === 0) {
    return `
      <section class="pages-section" aria-labelledby="pages-section-title">
        <h1 id="pages-section-title">${esc(d.pagesTitle)}</h1>
        <p class="intro">${esc(d.synthNoSample)}</p>
      </section>
    `;
  }

  const pageBlocks = sortedPages
    .map((page) => {
      const statusMap = statusByPage.get(page.id) ?? new Map();
      const counts = emptyCounts();
      for (const status of statusMap.values()) addStatus(counts, status);
      const pageScore = rate(counts);
      const pageColor = colorForScore(pageScore);
      const pageLabel = getConformityLabel(pageScore);
      const hasAnyEval = counts.total > 0;

      const thematicBlocks = sortedThematics
        .map((t) => {
          const critsOfThematic = criteriaByThematic.get(t.id) ?? [];
          if (critsOfThematic.length === 0) return "";

          const hasEvaluated = critsOfThematic.some((c) =>
            statusMap.has(c.id),
          );

          if (!hasEvaluated) {
            return `
              <h3 class="thematic-title">${esc(t.identifier)} <span aria-hidden="true">·</span> ${esc(t.name)}</h3>
              <p class="thematic-empty">${esc(d.thematicNotEvaluated)}</p>
            `;
          }

          const rows = critsOfThematic
            .map((c) => {
              const status = statusMap.get(c.id) ?? null;
              // En anglais : on affiche `name_en` comme libellé principal
              // (avec fallback `name` si absent), pas de seconde ligne.
              // En français : libellé FR avec libellé EN en seconde ligne.
              const primary =
                locale === "en" ? c.nameEn?.trim() || c.name : c.name;
              const secondaryRaw =
                locale === "en"
                  ? null
                  : c.nameEn && c.nameEn.trim() && c.nameEn.trim() !== c.name
                    ? c.nameEn.trim()
                    : null;
              const secondaryLine = secondaryRaw
                ? `<span class="crit-name-en">${esc(secondaryRaw)}</span>`
                : "";
              const levelCell = showLevelColumn
                ? `<td>${levelBadge(c.level)}</td>`
                : "";
              return `
                <tr>
                  <td class="identifier">${esc(c.identifier)}</td>
                  <td>
                    ${esc(primary)}
                    ${secondaryLine}
                  </td>
                  <td>${statusBadge(status, d)}</td>
                  ${levelCell}
                </tr>`;
            })
            .join("");

          const levelColgroup = showLevelColumn
            ? `<col class="col-level" />`
            : "";
          const levelHead = showLevelColumn
            ? `<th scope="col">${esc(d.colLevel)}</th>`
            : "";

          return `
            <h3 class="thematic-title">${esc(t.identifier)} <span aria-hidden="true">·</span> ${esc(t.name)}</h3>
            <table class="criteria">
              <caption class="sr-only">
                ${esc(fmt(d.thematicCaption, { id: t.identifier, name: t.name }))}
              </caption>
              <colgroup>
                <col class="col-num" />
                <col />
                <col class="col-status" />
                ${levelColgroup}
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">${esc(d.colNum)}</th>
                  <th scope="col">${esc(d.colCriterion)}</th>
                  <th scope="col">${esc(d.colStatus)}</th>
                  ${levelHead}
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>`;
        })
        .join("");

      const url = page.url
        ? `<span class="url"><span aria-hidden="true">·&nbsp;</span><a href="${esc(page.url)}" rel="noopener noreferrer">${esc(page.url)}</a></span>`
        : "";

      const headingId = `page-${esc(page.id)}-title`;
      const scoreAria = fmt(d.pageScoreAria, { name: page.name });
      return `
        <section class="page-detail" aria-labelledby="${headingId}">
          <div class="page-head">
            <div class="titles">
              <h2 id="${headingId}">${esc(d.pageLabel)} ${esc(page.name)}</h2>
              <p class="subtitle">
                ${esc(d.pageType[page.pageType])}
                ${url}
              </p>
            </div>
            <aside class="score-mini" aria-label="${esc(scoreAria)}">
              <p class="pct" style="color: ${pageColor};"${hasAnyEval ? "" : ` aria-hidden="true"`}>
                ${hasAnyEval ? esc(formatRate(pageScore)) : "—"}
              </p>
              <p class="lbl" style="color: ${hasAnyEval ? pageColor : COLORS.muted};">
                ${hasAnyEval ? esc(pageLabel) : esc(d.pageNotEvaluated)}
              </p>
              <p class="counts">
                ${counts.compliant} ${esc(d.pageCompliants)}
                <span aria-hidden="true">·</span> ${counts.nonCompliant} ${esc(d.pageNCShort)}
                <span aria-hidden="true">·</span> ${counts.notApplicable} ${esc(d.pageNAShort)}
                <span aria-hidden="true">·</span> ${counts.total} ${esc(d.pageEvaluatedShort)}
              </p>
            </aside>
          </div>

          ${thematicBlocks}
        </section>
      `;
    })
    .join("");

  return `
    <section class="pages-section" aria-labelledby="pages-section-title">
      <h1 id="pages-section-title">${esc(d.pagesTitle)}</h1>
      <p class="intro">${esc(d.pagesIntro)}</p>
      ${pageBlocks}
    </section>
  `;
}

// ============================================================================
// Non-conformités détaillées
// ============================================================================

const SEVERITY_BADGE_CLASS: Record<NCSeverity, string> = {
  CRITICAL: "sev-critical",
  HIGH: "sev-high",
  MEDIUM: "sev-medium",
  LOW: "sev-low",
};

const STATUS_BADGE_CLASS: Record<NCStatus, string> = {
  OPEN: "status-open",
  IN_PROGRESS: "status-progress",
  CORRECTED: "status-done",
  RESOLVED: "status-done",
  FIXED: "status-done",
  NON_REPRODUCIBLE: "status-rejected",
  REJECTED: "status-rejected",
  CANCELLED: "status-rejected",
  TO_FIX: "status-open",
};

function severityBadge(severity: NCSeverity, d: Dict): string {
  const cls = SEVERITY_BADGE_CLASS[severity];
  return `<span class="badge ${cls}">${esc(d.severity[severity])}</span>`;
}

function ncStatusBadge(status: NCStatus, d: Dict): string {
  const cls = STATUS_BADGE_CLASS[status];
  return `<span class="badge ${cls}">${esc(d.ncStatus[status])}</span>`;
}

function isImage(mimeType: string | null): boolean {
  if (!mimeType) return false;
  return mimeType.startsWith("image/");
}

function attachmentDisplayName(
  fileName: string | null,
  storagePath: string,
): string {
  if (fileName && fileName.trim()) return fileName.trim();
  const parts = storagePath.split("/");
  return parts[parts.length - 1] || "file";
}

function renderAttachment(
  attachment: ReportData["nonConformities"][number]["attachments"][number],
  ncTitle: string,
  d: Dict,
): string {
  const name = attachmentDisplayName(attachment.fileName, attachment.storagePath);
  const figcaption = `<figcaption class="caption">${esc(name)}</figcaption>`;

  if (isImage(attachment.mimeType) && attachment.signedUrl) {
    const altText = fmt(d.ncAttachmentImgAlt, { title: ncTitle, name });
    return `
      <figure class="nc-attach">
        <img src="${esc(attachment.signedUrl)}" alt="${esc(altText)}" />
        ${figcaption}
      </figure>`;
  }

  const pdfLabel = fmt(d.ncAttachmentPdfLabel, { name });
  return `
    <figure class="nc-attach">
      <div class="pdf-fallback" role="img" aria-label="${esc(pdfLabel)}">
        <span class="pdf-icon" aria-hidden="true">PDF</span>
        <span class="pdf-name">${esc(name)}</span>
      </div>
      ${figcaption}
    </figure>`;
}

function renderNCBlock(
  nc: ReportData["nonConformities"][number],
  number: number,
  d: Dict,
): string {
  const ncNumber = `NC-${String(number).padStart(3, "0")}`;
  const ncTitleId = `nc-${esc(nc.id)}-title`;

  const criterionLabel = `${esc(nc.criterion.identifier)} <span aria-hidden="true">·</span> ${esc(nc.criterion.name)}`;
  const criterionCell = nc.criterion.url
    ? `<a href="${esc(nc.criterion.url)}" rel="noopener noreferrer">${criterionLabel}</a>`
    : criterionLabel;

  const sections: string[] = [];
  if (nc.description?.trim()) {
    sections.push(`
      <p class="nc-section-title">${esc(d.ncDescription)}</p>
      <p class="nc-prose">${esc(nc.description.trim())}</p>
    `);
  }
  if (nc.actualResult?.trim()) {
    sections.push(`
      <p class="nc-section-title">${esc(d.ncActualResult)}</p>
      <p class="nc-prose">${esc(nc.actualResult.trim())}</p>
    `);
  }
  if (nc.recommendation?.trim()) {
    sections.push(`
      <p class="nc-section-title">${esc(d.ncRecommendation)}</p>
      <p class="nc-prose">${esc(nc.recommendation.trim())}</p>
    `);
  }

  const attachmentsBlock =
    nc.attachments.length > 0
      ? `
        <section aria-label="${esc(d.ncAttachments)}">
          <p class="nc-section-title">${esc(d.ncAttachments)}</p>
          <div class="nc-attachments">
            ${nc.attachments.map((a) => renderAttachment(a, nc.title, d)).join("")}
          </div>
        </section>`
      : "";

  const referenceRow = nc.criterion.url
    ? `<tr><th scope="row">${esc(d.ncOfficialRef)}</th><td><a href="${esc(nc.criterion.url)}" rel="noopener noreferrer">${esc(nc.criterion.url)}</a></td></tr>`
    : "";

  const severityAria = fmt(d.ncSeverityAria, { label: d.severity[nc.severity] });
  const statusAria = fmt(d.ncStatusAria, { label: d.ncStatus[nc.status] });
  const referenceAria = fmt(d.ncReferenceAria, { nc: ncNumber });
  const metaCaption = fmt(d.ncMetaCaption, { nc: ncNumber });

  return `
    <article class="nc-block" aria-labelledby="${ncTitleId}">
      <div class="nc-head-group">
        <p class="nc-head">
          <span aria-label="${esc(severityAria)}">${severityBadge(nc.severity, d)}</span>
          <span class="nc-number" aria-label="${esc(referenceAria)}">${esc(ncNumber)}</span>
          <span aria-label="${esc(statusAria)}">${ncStatusBadge(nc.status, d)}</span>
        </p>
        <h3 id="${ncTitleId}">${esc(nc.title)}</h3>

        <table class="nc-meta">
          <caption class="sr-only">${esc(metaCaption)}</caption>
          <tbody>
            <tr>
              <th scope="row">${esc(d.ncCriterion)}</th>
              <td>${criterionCell}</td>
            </tr>
            ${
              nc.testReference
                ? `<tr><th scope="row">${esc(d.ncTest)}</th><td>${esc(nc.testReference)}</td></tr>`
                : ""
            }
            <tr>
              <th scope="row">${esc(d.ncPage)}</th>
              <td>${nc.page ? esc(nc.page.name) : esc(d.ncTransversal)}</td>
            </tr>
            ${referenceRow}
          </tbody>
        </table>
      </div>

      ${sections.join("\n")}
      ${attachmentsBlock}
    </article>
  `;
}

function renderNonConformities(data: ReportData, d: Dict): string {
  const { nonConformities } = data;

  if (nonConformities.length === 0) {
    return `
      <section class="nc-section" aria-labelledby="ncs-section-title">
        <h1 id="ncs-section-title">${esc(d.ncTitle)}</h1>
        <p class="nc-empty">${esc(d.ncEmpty)}</p>
      </section>
    `;
  }

  const sorted = nonConformities.slice().sort((a, b) => {
    const pageA = a.page?.sortOrder ?? Number.POSITIVE_INFINITY;
    const pageB = b.page?.sortOrder ?? Number.POSITIVE_INFINITY;
    if (pageA !== pageB) return pageA - pageB;

    const sevA = NC_SEVERITY_ORDER[a.severity];
    const sevB = NC_SEVERITY_ORDER[b.severity];
    if (sevA !== sevB) return sevA - sevB;

    return a.criterion.identifier.localeCompare(
      b.criterion.identifier,
      "fr",
      { numeric: true },
    );
  });

  type Group = { key: string; label: string; items: typeof sorted };
  const groups: Group[] = [];
  for (const nc of sorted) {
    const key = nc.page?.name ?? "__transversal__";
    const label = nc.page?.name ?? d.ncTransversalGroup;
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.items.push(nc);
    } else {
      groups.push({ key, label, items: [nc] });
    }
  }

  let counter = 0;
  const groupBlocks = groups
    .map((group, gIdx) => {
      const groupId = `nc-group-${gIdx}`;
      const items = group.items
        .map((nc) => {
          counter += 1;
          return renderNCBlock(nc, counter, d);
        })
        .join("");
      const heading =
        group.key === "__transversal__"
          ? esc(d.ncTransversalGroup)
          : esc(fmt(d.ncPageGroup, { name: group.label }));
      return `
        <section class="nc-group" aria-labelledby="${groupId}">
          <h2 id="${groupId}">${heading}</h2>
          ${items}
        </section>
      `;
    })
    .join("");

  return `
    <section class="nc-section" aria-labelledby="ncs-section-title">
      <h1 id="ncs-section-title">${esc(d.ncTitle)}</h1>
      <p class="nc-intro">${esc(plural(d.ncIntro, sorted.length))}</p>
      ${groupBlocks}
    </section>
  `;
}

// ============================================================================
// Entrée publique
// ============================================================================
export function renderReportHTML(
  data: ReportData,
  locale: ReportLocale = "fr",
): string {
  const d = getDict(locale);
  const htmlLang = locale === "en" ? "en-US" : "fr-FR";

  const title = fmt(d.docTitle, { project: data.project.name });
  const subject = d.docSubject;
  const description = fmt(d.docDescription, {
    project: data.project.name,
    client: data.client.name,
    reference: d.reference[data.reference.type],
    version: data.reference.version,
    platform: d.platform[data.audit.platform],
  });
  const keywords = [
    locale === "en" ? "accessibility" : "accessibilité",
    locale === "en" ? "audit" : "audit",
    d.reference[data.reference.type],
    "WCAG",
    locale === "en" ? "report" : "rapport",
    data.client.name,
    data.project.name,
  ].join(", ");

  return `<!doctype html>
<html lang="${esc(htmlLang)}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(subject)}" />
    <meta name="author" content="${esc(data.branding.brandName)}" />
    <meta name="keywords" content="${esc(keywords)}" />

    <meta name="dc.title" content="${esc(title)}" />
    <meta name="dc.creator" content="${esc(data.branding.brandName)}" />
    <meta name="dc.subject" content="${esc(subject)}" />
    <meta name="dc.description" content="${esc(description)}" />
    <meta name="dc.language" content="${esc(htmlLang)}" />
    <meta name="dc.date" content="${esc(data.generatedAt)}" />
    <meta name="dc.publisher" content="${esc(data.branding.brandName)}" />
    <meta name="dcterms.created" content="${esc(data.generatedAt)}" />

    <style>${PRINT_CSS}</style>
  </head>
  <body>
    ${renderCover(data, locale, d)}
    <main>
      ${renderSynthesis(data, d)}
      ${renderPagesDetail(data, locale, d)}
      ${renderNonConformities(data, d)}
    </main>
  </body>
</html>`;
}
