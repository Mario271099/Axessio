import {
  calculateScore,
  getConformityLabel,
  getConformityLevel,
} from "@/lib/score";
import {
  NC_SEVERITY_LABELS,
  NC_SEVERITY_ORDER,
  NC_STATUS_LABELS,
  PAGE_TYPE_LABELS,
  PLATFORM_LABELS,
  REFERENCE_TYPE_LABELS,
  SERVICE_TYPE_LABELS,
} from "@/lib/constants";
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

export interface ReportData {
  generatedAt: string;
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

function formatDateFr(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
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

  /* Réservé aux lecteurs d'écran — n'apparaît pas visuellement, mais reste
     dans l'arbre de structure du tagged PDF. */
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

  /* ---------- Page de garde ---------- */
  .cover {
    height: 257mm; /* A4 - marges 20mm * 2 */
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

  /* ---------- Pages de contenu ---------- */
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

  /* ---------- Détail par page (P3) ---------- */
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

  /* Tableau des critères par thématique */
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

  /* Badges — l'information n'est jamais portée par la couleur seule :
     chaque badge contient un libellé textuel explicite. */
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
  .badge.compliant {
    /* Contraste ~6.5:1 */
    background: #dcfce7;
    color: #15803d;
  }
  .badge.non-compliant {
    /* Contraste ~6.4:1 */
    background: #fee2e2;
    color: #b91c1c;
  }
  .badge.not-applicable {
    /* Contraste ~9:1 */
    background: #f3f4f6;
    color: #374151;
  }
  .badge.unevaluated {
    /* Pas de fond — un libellé "Non évalué" suffit. */
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

  /* ---------- Section P4 : Non-conformités détaillées ---------- */
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
    /* Le break-inside reste un best-effort : si le contenu déborde, on autorise
       quand même la coupure pour ne pas perdre de pages entières blanches. */
    page-break-inside: auto;
  }
  .nc-block:first-of-type {
    page-break-before: avoid;
    break-before: avoid;
  }

  /* Bloc "header + premières infos" : on essaie de garder ces 3-4 lignes
     ensemble en début de page pour ne pas isoler un titre. */
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

  /* Badges sévérité spécifiques P4 (plus visibles que dans la synthèse) */
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
// Page de garde (p. 1)
// ============================================================================
function renderCover(data: ReportData): string {
  const { audit, project, client, reference, auditor, generatedAt } = data;
  return `
    <header class="cover" role="banner">
      <div class="brand">
        <p class="logo">Axessio</p>
        <p class="tagline">Rapport d'audit d'accessibilité</p>
      </div>

      <div class="hero">
        <p class="kicker" aria-hidden="true">Rapport d'audit</p>
        <h1>${esc(project.name)}</h1>
        <p class="client-name">${esc(client.name)}</p>

        <dl>
          <dt>Type d'audit</dt>
          <dd>${esc(SERVICE_TYPE_LABELS[audit.serviceType])}</dd>

          <dt>Référentiel</dt>
          <dd>${esc(REFERENCE_TYPE_LABELS[reference.type])} ${esc(reference.version)}</dd>

          <dt>Plateforme</dt>
          <dd>${esc(PLATFORM_LABELS[audit.platform])}</dd>
        </dl>
      </div>

      <p class="signature">
        Réalisé par <span class="auditor">${esc(auditor.name)}</span><br />
        <time datetime="${esc(generatedAt)}">${esc(formatDateFr(generatedAt))}</time>
      </p>
    </header>
  `;
}

// ============================================================================
// Synthèse (p. 2)
// ============================================================================
function renderSynthesis(data: ReportData): string {
  const { pageConformities, thematics, criteria, pages, nonConformities } = data;

  // Stats globales
  const global = emptyCounts();
  for (const conf of pageConformities) addStatus(global, conf.status);
  const globalScore = rate(global);
  const globalColor = colorForScore(globalScore);
  const globalLabel = getConformityLabel(globalScore);

  // Stats par thématique
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
                ? `<span aria-hidden="true">—</span><span class="sr-only">Non évalué</span>`
                : esc(formatRate(score))
            }
          </td>
        </tr>`;
    })
    .join("");

  // Stats par page
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
          <td>${esc(PAGE_TYPE_LABELS[p.pageType])}</td>
          <td class="num">${counts.total}</td>
          <td class="num" style="color: ${colorForScore(score)}; font-weight: 600;">
            ${
              counts.total === 0
                ? `<span aria-hidden="true">—</span><span class="sr-only">Non évalué</span>`
                : esc(formatRate(score))
            }
          </td>
        </tr>`;
    })
    .join("");

  // NC par sévérité
  const ncBySeverity: Record<NCSeverity, number> = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
  };
  for (const nc of nonConformities) ncBySeverity[nc.severity] += 1;

  return `
    <section class="page" aria-labelledby="synthese-title">
      <h1 id="synthese-title">Synthèse</h1>

      <div class="score-card" role="group" aria-label="Score global de conformité">
        <div>
          <p class="pct" style="color: ${globalColor};">
            ${esc(formatRate(globalScore))}
          </p>
          <p class="sub">Taux de conformité global</p>
        </div>
        <div style="flex: 1;">
          <p class="label" style="color: ${globalColor};">
            ${esc(globalLabel)}
          </p>
          <p class="sub">
            Formule : conformes <span aria-hidden="true">/</span><span class="sr-only"> divisé par </span> (total <span aria-hidden="true">−</span><span class="sr-only"> moins </span> non applicables) <span aria-hidden="true">×</span><span class="sr-only"> multiplié par </span> 100
          </p>
        </div>
      </div>

      <dl class="stats-grid">
        <div class="stat">
          <dt class="name">Évalués</dt>
          <dd class="value">${global.total}</dd>
        </div>
        <div class="stat">
          <dt class="name">Conformes</dt>
          <dd class="value" style="color: ${COLORS.green};">${global.compliant}</dd>
        </div>
        <div class="stat">
          <dt class="name">Non conformes</dt>
          <dd class="value" style="color: ${COLORS.red};">${global.nonCompliant}</dd>
        </div>
        <div class="stat">
          <dt class="name">Non applicables</dt>
          <dd class="value" style="color: ${COLORS.muted};">${global.notApplicable}</dd>
        </div>
      </dl>

      <h2>Détail par thématique</h2>
      <table class="report">
        <caption class="sr-only">
          Taux de conformité par thématique du référentiel
        </caption>
        <thead>
          <tr>
            <th scope="col">Thématique</th>
            <th scope="col" class="num">Évalués</th>
            <th scope="col" class="num">Conformes</th>
            <th scope="col" class="num">NC</th>
            <th scope="col" class="num">NA</th>
            <th scope="col" class="num">Taux</th>
          </tr>
        </thead>
        <tbody>
          ${thematicRows || `<tr><td colspan="6" style="text-align:center; color:${COLORS.muted};">Aucune évaluation enregistrée.</td></tr>`}
        </tbody>
      </table>

      <h2>Détail par page</h2>
      <table class="report">
        <caption class="sr-only">
          Taux de conformité par page de l'échantillon
        </caption>
        <thead>
          <tr>
            <th scope="col">Page</th>
            <th scope="col">Type</th>
            <th scope="col" class="num">Évalués</th>
            <th scope="col" class="num">Taux</th>
          </tr>
        </thead>
        <tbody>
          ${pageRows || `<tr><td colspan="4" style="text-align:center; color:${COLORS.muted};">Aucune page dans l'échantillon.</td></tr>`}
        </tbody>
      </table>

      <h2>Répartition des non-conformités par sévérité</h2>
      <dl class="severity-row" aria-label="Répartition des non-conformités par sévérité">
        <div class="sev critical">
          <dt class="name">${esc(NC_SEVERITY_LABELS.CRITICAL)}</dt>
          <dd class="count">${ncBySeverity.CRITICAL}</dd>
        </div>
        <div class="sev high">
          <dt class="name">${esc(NC_SEVERITY_LABELS.HIGH)}</dt>
          <dd class="count">${ncBySeverity.HIGH}</dd>
        </div>
        <div class="sev medium">
          <dt class="name">${esc(NC_SEVERITY_LABELS.MEDIUM)}</dt>
          <dd class="count">${ncBySeverity.MEDIUM}</dd>
        </div>
        <div class="sev low">
          <dt class="name">${esc(NC_SEVERITY_LABELS.LOW)}</dt>
          <dd class="count">${ncBySeverity.LOW}</dd>
        </div>
      </dl>
    </section>
  `;
}

// ============================================================================
// Détail par page (P3)
// ============================================================================
function statusBadge(status: ConformityStatus | null): string {
  if (status === "COMPLIANT") {
    return `<span class="badge compliant">Conforme</span>`;
  }
  if (status === "NON_COMPLIANT") {
    return `<span class="badge non-compliant">Non conforme</span>`;
  }
  if (status === "NOT_APPLICABLE") {
    return `<span class="badge not-applicable">Non applicable</span>`;
  }
  return `<span class="badge unevaluated">Non évalué</span>`;
}

function levelBadge(level: WCAGLevel | null): string {
  if (!level) return "";
  return `<span class="badge level">${esc(level)}</span>`;
}

function renderPagesDetail(data: ReportData): string {
  const { pages, thematics, criteria, pageConformities, reference } = data;
  if (pages.length === 0) return "";

  const showLevelColumn = reference.type === "WCAG";

  // Indexation des critères par thématique (ordonnés)
  const criteriaByThematic = new Map<string, ReportData["criteria"]>();
  for (const t of thematics) criteriaByThematic.set(t.id, []);
  for (const c of criteria) {
    const list = criteriaByThematic.get(c.thematicId);
    if (list) list.push(c);
  }
  for (const list of criteriaByThematic.values()) {
    list.sort((a, b) =>
      a.identifier.localeCompare(b.identifier, "fr", { numeric: true }),
    );
  }

  // Indexation { pageId → { criteriaId → status } } pour O(1) en rendu
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

  const sortedPages = pages
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (sortedPages.length === 0) {
    return `
      <section class="pages-section" aria-labelledby="pages-section-title">
        <h1 id="pages-section-title">Détail par page</h1>
        <p class="intro">Aucune page dans l'échantillon.</p>
      </section>
    `;
  }

  const pageBlocks = sortedPages
    .map((page, idx) => {
      const statusMap = statusByPage.get(page.id) ?? new Map();

      // Stats de la page
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

          // Tous les critères de la thématique sans statut sur cette page ?
          const hasEvaluated = critsOfThematic.some((c) =>
            statusMap.has(c.id),
          );

          if (!hasEvaluated) {
            return `
              <h3 class="thematic-title">${esc(t.identifier)} <span aria-hidden="true">·</span> ${esc(t.name)}</h3>
              <p class="thematic-empty">Thématique non évaluée sur cette page.</p>
            `;
          }

          const rows = critsOfThematic
            .map((c) => {
              const status = statusMap.get(c.id) ?? null;
              const nameEnLine = c.nameEn
                ? `<span class="crit-name-en">${esc(c.nameEn)}</span>`
                : "";
              const levelCell = showLevelColumn
                ? `<td>${levelBadge(c.level)}</td>`
                : "";
              return `
                <tr>
                  <td class="identifier">${esc(c.identifier)}</td>
                  <td>
                    ${esc(c.name)}
                    ${nameEnLine}
                  </td>
                  <td>${statusBadge(status)}</td>
                  ${levelCell}
                </tr>`;
            })
            .join("");

          const levelColgroup = showLevelColumn
            ? `<col class="col-level" />`
            : "";
          const levelHead = showLevelColumn
            ? `<th scope="col">Niveau</th>`
            : "";

          return `
            <h3 class="thematic-title">${esc(t.identifier)} <span aria-hidden="true">·</span> ${esc(t.name)}</h3>
            <table class="criteria">
              <caption class="sr-only">
                Critères de la thématique ${esc(t.identifier)} ${esc(t.name)}
              </caption>
              <colgroup>
                <col class="col-num" />
                <col />
                <col class="col-status" />
                ${levelColgroup}
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">N°</th>
                  <th scope="col">Critère</th>
                  <th scope="col">Statut</th>
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

      // first-of-type est géré en CSS (pas de page-break-before pour la 1ʳᵉ).
      // On laisse Puppeteer respecter `page-break-before: always` sur les autres.
      void idx;

      const headingId = `page-${esc(page.id)}-title`;
      return `
        <section class="page-detail" aria-labelledby="${headingId}">
          <div class="page-head">
            <div class="titles">
              <h2 id="${headingId}">Page : ${esc(page.name)}</h2>
              <p class="subtitle">
                ${esc(PAGE_TYPE_LABELS[page.pageType])}
                ${url}
              </p>
            </div>
            <aside class="score-mini" aria-label="Score de la page ${esc(page.name)}">
              <p class="pct" style="color: ${pageColor};"${hasAnyEval ? "" : ` aria-hidden="true"`}>
                ${hasAnyEval ? esc(formatRate(pageScore)) : "—"}
              </p>
              <p class="lbl" style="color: ${hasAnyEval ? pageColor : COLORS.muted};">
                ${hasAnyEval ? esc(pageLabel) : "Non évaluée"}
              </p>
              <p class="counts">
                ${counts.compliant} conformes
                <span aria-hidden="true">·</span> ${counts.nonCompliant} NC
                <span aria-hidden="true">·</span> ${counts.notApplicable} NA
                <span aria-hidden="true">·</span> ${counts.total} évalués
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
      <h1 id="pages-section-title">Détail par page</h1>
      <p class="intro">
        Conformité de chaque page de l'échantillon, critère par critère,
        regroupée par thématique du référentiel.
      </p>
      ${pageBlocks}
    </section>
  `;
}

// ============================================================================
// Non-conformités détaillées (P4)
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
  NON_REPRODUCIBLE: "status-rejected",
  REJECTED: "status-rejected",
  CANCELLED: "status-rejected",
};

function severityBadge(severity: NCSeverity): string {
  const cls = SEVERITY_BADGE_CLASS[severity];
  return `<span class="badge ${cls}">${esc(NC_SEVERITY_LABELS[severity])}</span>`;
}

function ncStatusBadge(status: NCStatus): string {
  const cls = STATUS_BADGE_CLASS[status];
  return `<span class="badge ${cls}">${esc(NC_STATUS_LABELS[status])}</span>`;
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
  // Fallback : dernier segment du storage_path
  const parts = storagePath.split("/");
  return parts[parts.length - 1] || "fichier";
}

function renderAttachment(
  attachment: ReportData["nonConformities"][number]["attachments"][number],
  ncTitle: string,
): string {
  const name = attachmentDisplayName(attachment.fileName, attachment.storagePath);
  // figcaption (visible) + alt sur l'image qui contextualise la NC. Le tagged
  // PDF expose alt à AT et figcaption comme légende ancrée à la figure.
  const figcaption = `<figcaption class="caption">${esc(name)}</figcaption>`;

  if (isImage(attachment.mimeType) && attachment.signedUrl) {
    const altText = `Capture d'écran liée à la non-conformité « ${ncTitle} » : ${name}`;
    return `
      <figure class="nc-attach">
        <img src="${esc(attachment.signedUrl)}" alt="${esc(altText)}" />
        ${figcaption}
      </figure>`;
  }

  // PDF ou autre type non affichable inline. Le libellé "PDF" est purement
  // décoratif : l'info est portée par le nom du fichier juste à côté.
  return `
    <figure class="nc-attach">
      <div class="pdf-fallback" role="img" aria-label="Pièce jointe PDF : ${esc(name)}">
        <span class="pdf-icon" aria-hidden="true">PDF</span>
        <span class="pdf-name">${esc(name)}</span>
      </div>
      ${figcaption}
    </figure>`;
}

function renderNCBlock(
  nc: ReportData["nonConformities"][number],
  number: number,
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
      <p class="nc-section-title">Description</p>
      <p class="nc-prose">${esc(nc.description.trim())}</p>
    `);
  }
  if (nc.actualResult?.trim()) {
    sections.push(`
      <p class="nc-section-title">Résultat obtenu</p>
      <p class="nc-prose">${esc(nc.actualResult.trim())}</p>
    `);
  }
  if (nc.recommendation?.trim()) {
    sections.push(`
      <p class="nc-section-title">Recommandation</p>
      <p class="nc-prose">${esc(nc.recommendation.trim())}</p>
    `);
  }

  const attachmentsBlock =
    nc.attachments.length > 0
      ? `
        <section aria-label="Pièces jointes">
          <p class="nc-section-title">Pièces jointes</p>
          <div class="nc-attachments">
            ${nc.attachments.map((a) => renderAttachment(a, nc.title)).join("")}
          </div>
        </section>`
      : "";

  const referenceRow = nc.criterion.url
    ? `<tr><th scope="row">Référence officielle</th><td><a href="${esc(nc.criterion.url)}" rel="noopener noreferrer">${esc(nc.criterion.url)}</a></td></tr>`
    : "";

  // Libellés des badges relus à voix haute dans l'ordre logique :
  // sévérité, numéro, statut.
  const severityAria = `Sévérité ${esc(NC_SEVERITY_LABELS[nc.severity])}`;
  const statusAria = `Statut ${esc(NC_STATUS_LABELS[nc.status])}`;

  return `
    <article class="nc-block" aria-labelledby="${ncTitleId}">
      <div class="nc-head-group">
        <p class="nc-head">
          <span aria-label="${severityAria}">${severityBadge(nc.severity)}</span>
          <span class="nc-number" aria-label="Référence ${esc(ncNumber)}">${esc(ncNumber)}</span>
          <span aria-label="${statusAria}">${ncStatusBadge(nc.status)}</span>
        </p>
        <h3 id="${ncTitleId}">${esc(nc.title)}</h3>

        <table class="nc-meta">
          <caption class="sr-only">Métadonnées de la non-conformité ${esc(ncNumber)}</caption>
          <tbody>
            <tr>
              <th scope="row">Critère</th>
              <td>${criterionCell}</td>
            </tr>
            <tr>
              <th scope="row">Page</th>
              <td>${nc.page ? esc(nc.page.name) : "Transversale"}</td>
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

function renderNonConformities(data: ReportData): string {
  const { nonConformities } = data;

  if (nonConformities.length === 0) {
    return `
      <section class="nc-section" aria-labelledby="ncs-section-title">
        <h1 id="ncs-section-title">Non-conformités détaillées</h1>
        <p class="nc-empty">Aucune non-conformité relevée.</p>
      </section>
    `;
  }

  // Tri : page (sortOrder asc, transversales en dernier) → sévérité desc → critère asc
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

  // Groupement par page tout en conservant l'ordre du tri.
  type Group = { key: string; label: string; items: typeof sorted };
  const groups: Group[] = [];
  for (const nc of sorted) {
    const key = nc.page?.name ?? "__transversal__";
    const label = nc.page?.name ?? "Non-conformités transversales";
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.items.push(nc);
    } else {
      groups.push({ key, label, items: [nc] });
    }
  }

  // Numérotation séquentielle globale (NC-001, NC-002, ...).
  let counter = 0;
  const groupBlocks = groups
    .map((group, gIdx) => {
      const groupId = `nc-group-${gIdx}`;
      const items = group.items
        .map((nc) => {
          counter += 1;
          return renderNCBlock(nc, counter);
        })
        .join("");
      const heading =
        group.key === "__transversal__"
          ? `Non-conformités transversales`
          : `Page : ${esc(group.label)}`;
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
      <h1 id="ncs-section-title">Non-conformités détaillées</h1>
      <p class="nc-intro">
        ${sorted.length} non-conformité${sorted.length > 1 ? "s" : ""} relevée${sorted.length > 1 ? "s" : ""},
        ordonnée${sorted.length > 1 ? "s" : ""} par page puis par sévérité.
      </p>
      ${groupBlocks}
    </section>
  `;
}

// ============================================================================
// Entrée publique
// ============================================================================
export function renderReportHTML(data: ReportData): string {
  const title = `Rapport d'audit — ${data.project.name}`;
  const subject = "Rapport d'audit d'accessibilité numérique";
  const description = `Rapport d'audit d'accessibilité numérique pour ${data.project.name} (${data.client.name}). Référentiel ${REFERENCE_TYPE_LABELS[data.reference.type]} ${data.reference.version}, plateforme ${PLATFORM_LABELS[data.audit.platform]}.`;
  const keywords = [
    "accessibilité",
    "audit",
    REFERENCE_TYPE_LABELS[data.reference.type],
    "WCAG",
    "rapport",
    data.client.name,
    data.project.name,
  ].join(", ");

  // Métadonnées du PDF généré par Chromium :
  //   <title>            → DocumentInfo /Title
  //   <meta name="author">     → DocumentInfo /Author
  //   <meta name="description">→ DocumentInfo /Subject
  //   <meta name="keywords">   → DocumentInfo /Keywords
  //   html lang="fr"          → catalogue /Lang
  // Les <meta name="dc.*"> sont ajoutés pour couvrir XMP Dublin Core (PDF/UA-1
  // les recommande même si Chromium ne sérialise pas tous les champs dans XMP).
  return `<!doctype html>
<html lang="fr-FR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(subject)}" />
    <meta name="author" content="Axessio" />
    <meta name="keywords" content="${esc(keywords)}" />

    <meta name="dc.title" content="${esc(title)}" />
    <meta name="dc.creator" content="Axessio" />
    <meta name="dc.subject" content="${esc(subject)}" />
    <meta name="dc.description" content="${esc(description)}" />
    <meta name="dc.language" content="fr-FR" />
    <meta name="dc.date" content="${esc(data.generatedAt)}" />
    <meta name="dc.publisher" content="Axessio" />
    <meta name="dcterms.created" content="${esc(data.generatedAt)}" />

    <style>${PRINT_CSS}</style>
  </head>
  <body>
    ${renderCover(data)}
    <main>
      ${renderSynthesis(data)}
      ${renderPagesDetail(data)}
      ${renderNonConformities(data)}
    </main>
  </body>
</html>`;
}
