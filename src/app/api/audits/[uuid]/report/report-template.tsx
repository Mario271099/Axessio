// Template HTML du rapport PDF — point d'entrée `renderReportHTML`.
// Découpé en modules (gros fichiers) :
//   - report-types.ts      (ReportData, ReportLocale)
//   - report-strings.ts    (dictionnaires FR/EN, fmt, plural)
//   - report-helpers.ts    (esc, dates, compteurs, couleurs)
//   - report-css.ts        (feuille de style d'impression)
//   - report-nc-section.ts (section non-conformités)
// Ici : page de garde, synthèse, détail par page, assemblage du document.

import { getConformityLabel } from "@/lib/score";
import type { ConformityStatus, NCSeverity, WCAGLevel } from "@/types/domain";
import {
  COLORS,
  addStatus,
  colorForScore,
  emptyCounts,
  esc,
  formatDate,
  formatRate,
  intlLocale,
  rate,
  type ConformityCounts,
} from "./report-helpers";
import { fmt, getDict, type Dict } from "./report-strings";
import { PRINT_CSS } from "./report-css";
import { renderNonConformities } from "./report-nc-section";
import type { ReportData, ReportLocale } from "./report-types";

// Ré-export pour les consommateurs existants (la route importe les types ici).
export type { ReportData, ReportLocale } from "./report-types";

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
