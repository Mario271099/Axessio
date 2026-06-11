// Logique pure de construction du CSV de matrice de conformité.
// Séparée de la server action (`export-matrix-actions.ts`) car un fichier
// "use server" n'autorise que des exports async — et pour pouvoir tester le
// builder sans toucher à Supabase.

import {
  CONFORMITY_STATUS_LABELS,
  PAGE_TYPE_LABELS,
} from "@/lib/constants";
import type { ConformityStatus, PageType, WCAGLevel } from "@/types/domain";

// Échappement CSV (RFC 4180) : on guillemet dès qu'un séparateur, un guillemet
// ou un saut de ligne apparaît, et on double les guillemets internes.
export function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function slugify(value: string): string {
  return (
    value
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "audit"
  );
}

export interface MatrixCsvPage {
  id: string;
  name: string;
  url: string | null;
  pageType: PageType;
  sortOrder: number;
}

export interface MatrixCsvCriterion {
  id: string;
  identifier: string;
  name: string;
  level: WCAGLevel | null;
  thematicIdentifier: string;
  thematicName: string;
  thematicSort: number;
}

export interface MatrixCsvConformity {
  pageId: string;
  criteriaId: string;
  status: ConformityStatus;
}

export const NOT_EVALUATED_LABEL = "Non évalué";

export const MATRIX_CSV_HEADER = [
  "Thématique",
  "Critère",
  "Intitulé du critère",
  "Niveau WCAG",
  "Page",
  "Type de page",
  "URL de la page",
  "Statut de conformité",
] as const;

/**
 * Construit le CSV (format « long ») de la matrice de conformité : une ligne
 * par cellule (page × critère). Les cellules sans saisie en base reçoivent le
 * statut « Non évalué ». Tri stable : thématique → critère (ordre numérique) →
 * page. Préfixé d'un BOM UTF-8 pour qu'Excel lise correctement les accents.
 */
export function buildMatrixCsv(input: {
  pages: MatrixCsvPage[];
  criteria: MatrixCsvCriterion[];
  conformities: MatrixCsvConformity[];
}): string {
  const { pages, criteria, conformities } = input;

  const statusByCell = new Map<string, ConformityStatus>();
  for (const c of conformities) {
    statusByCell.set(`${c.pageId}:${c.criteriaId}`, c.status);
  }

  const sortedPages = [...pages].sort((a, b) => a.sortOrder - b.sortOrder);
  const sortedCriteria = [...criteria].sort(
    (a, b) =>
      a.thematicSort - b.thematicSort ||
      a.thematicIdentifier.localeCompare(b.thematicIdentifier, undefined, {
        numeric: true,
      }) ||
      a.identifier.localeCompare(b.identifier, undefined, { numeric: true }),
  );

  const lines = [MATRIX_CSV_HEADER.join(",")];

  for (const criterion of sortedCriteria) {
    for (const page of sortedPages) {
      const status = statusByCell.get(`${page.id}:${criterion.id}`);
      const statusLabel = status
        ? CONFORMITY_STATUS_LABELS[status]
        : NOT_EVALUATED_LABEL;
      lines.push(
        [
          escapeCsv(
            `${criterion.thematicIdentifier} ${criterion.thematicName}`.trim(),
          ),
          escapeCsv(criterion.identifier),
          escapeCsv(criterion.name),
          escapeCsv(criterion.level),
          escapeCsv(page.name),
          escapeCsv(PAGE_TYPE_LABELS[page.pageType] ?? page.pageType),
          escapeCsv(page.url),
          escapeCsv(statusLabel),
        ].join(","),
      );
    }
  }

  // BOM UTF-8 pour qu'Excel ouvre correctement les accents.
  return "﻿" + lines.join("\r\n");
}
