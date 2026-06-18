// Section « Non-conformités détaillées » du rapport PDF.
// Extraite de report-template.tsx (découpage des gros fichiers) - markup
// strictement identique.

import { NC_SEVERITY_ORDER } from "@/lib/constants";
import type { NCSeverity, NCStatus } from "@/types/domain";
import { esc } from "./report-helpers";
import { fmt, plural, type Dict } from "./report-strings";
import type { ReportData } from "./report-types";

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

export function renderNonConformities(data: ReportData, d: Dict): string {
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
