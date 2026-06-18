// Feuille de style d'impression du rapport PDF (A4, Puppeteer).
// Extraite de report-template.tsx (découpage des gros fichiers) - contenu
// strictement identique.

import { COLORS } from "./report-helpers";

export const PRINT_CSS = `
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
