// Logique pure de construction du classeur Excel (.xlsx) de la matrice de
// conformité. Séparée de la server action pour les mêmes raisons que le CSV :
// un fichier "use server" n'autorise que des exports async, et le builder doit
// être testable sans Supabase.
//
// Format « grille » (différent du CSV « long ») : une ligne par critère, une
// colonne par page, cellules colorées par statut - directement lisible par un
// client. Deuxième feuille : la liste des non-conformités.
//
// Pas de risque d'injection de formule ici : exceljs ne traite une valeur
// comme formule que si on passe explicitement `{ formula: ... }` - les chaînes
// restent des chaînes.

import ExcelJS from "exceljs";
import {
  CONFORMITY_STATUS_LABELS,
  NC_SEVERITY_LABELS,
  NC_STATUS_LABELS,
  PAGE_TYPE_LABELS,
} from "@/lib/constants";
import { calculateScore } from "@/lib/score";
import type {
  ConformityStatus,
  NCSeverity,
  NCStatus,
} from "@/types/domain";
import {
  NOT_EVALUATED_LABEL,
  sortMatrixCriteria,
  sortMatrixPages,
  type MatrixCsvConformity,
  type MatrixCsvCriterion,
  type MatrixCsvPage,
} from "./export-matrix-csv";

export interface MatrixXlsxNc {
  displayNumber: number | null;
  pageName: string | null;
  criterionIdentifier: string | null;
  criterionName: string | null;
  severity: NCSeverity;
  status: NCStatus;
  title: string | null;
  description: string | null;
  recommendation: string | null;
}

export const MATRIX_SHEET_NAME = "Matrice de conformité";
export const NC_SHEET_NAME = "Non-conformités";

export const NC_SHEET_HEADER = [
  "N°",
  "Page",
  "Critère",
  "Intitulé du critère",
  "Sévérité",
  "Statut",
  "Titre",
  "Description",
  "Recommandation",
] as const;

// Remplissages par statut (ARGB) - mêmes teintes que les badges de la matrice
// web : vert conforme, rouge non conforme, gris non applicable.
const STATUS_FILLS: Record<ConformityStatus, string> = {
  COMPLIANT: "FFD9EAD3",
  NON_COMPLIANT: "FFF4CCCC",
  NOT_APPLICABLE: "FFEFEFEF",
};

const HEADER_FILL = "FFE8EAED";

function solidFill(argb: string): ExcelJS.Fill {
  return { type: "pattern", pattern: "solid", fgColor: { argb } };
}

/**
 * Construit le classeur .xlsx et le retourne en Buffer (à encoder en base64
 * côté server action pour le transfert vers le client).
 */
export async function buildMatrixXlsx(input: {
  pages: MatrixCsvPage[];
  criteria: MatrixCsvCriterion[];
  conformities: MatrixCsvConformity[];
  nonConformities: MatrixXlsxNc[];
}): Promise<Buffer> {
  const { pages, criteria, conformities, nonConformities } = input;

  const sortedPages = sortMatrixPages(pages);
  const sortedCriteria = sortMatrixCriteria(criteria);

  const statusByCell = new Map<string, ConformityStatus>();
  for (const c of conformities) {
    statusByCell.set(`${c.pageId}:${c.criteriaId}`, c.status);
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Axessyo";
  workbook.created = new Date();

  // --------------------------------------------------------------------
  // Feuille 1 - grille critères × pages
  // --------------------------------------------------------------------
  const matrix = workbook.addWorksheet(MATRIX_SHEET_NAME, {
    // 4 colonnes de description + 2 lignes (en-tête + scores) figées.
    views: [{ state: "frozen", xSplit: 4, ySplit: 2 }],
  });

  const headerRow = matrix.addRow([
    "Thématique",
    "Critère",
    "Intitulé du critère",
    "Niveau WCAG",
    ...sortedPages.map((p) =>
      p.url ? `${p.name}\n${p.url}` : `${p.name}\n${PAGE_TYPE_LABELS[p.pageType] ?? ""}`,
    ),
  ]);
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: "top", wrapText: true };
  headerRow.eachCell((cell) => {
    cell.fill = solidFill(HEADER_FILL);
  });

  // Ligne 2 : taux de conformité par page (formule officielle, src/lib/score.ts).
  const scoreRow = matrix.addRow([
    "Taux de conformité (%)",
    "",
    "",
    "",
    ...sortedPages.map((page) => {
      let compliant = 0;
      let notApplicable = 0;
      for (const criterion of sortedCriteria) {
        const status = statusByCell.get(`${page.id}:${criterion.id}`);
        if (status === "COMPLIANT") compliant += 1;
        else if (status === "NOT_APPLICABLE") notApplicable += 1;
      }
      return calculateScore({
        compliant,
        notApplicable,
        totalCriteria: sortedCriteria.length,
      });
    }),
  ]);
  scoreRow.font = { bold: true };
  scoreRow.eachCell((cell) => {
    cell.fill = solidFill(HEADER_FILL);
  });

  for (const criterion of sortedCriteria) {
    const row = matrix.addRow([
      `${criterion.thematicIdentifier} ${criterion.thematicName}`.trim(),
      criterion.identifier,
      criterion.name,
      criterion.level ?? "",
      ...sortedPages.map((page) => {
        const status = statusByCell.get(`${page.id}:${criterion.id}`);
        return status ? CONFORMITY_STATUS_LABELS[status] : NOT_EVALUATED_LABEL;
      }),
    ]);
    row.alignment = { vertical: "top", wrapText: true };
    sortedPages.forEach((page, index) => {
      const status = statusByCell.get(`${page.id}:${criterion.id}`);
      if (status) {
        row.getCell(5 + index).fill = solidFill(STATUS_FILLS[status]);
      }
    });
  }

  matrix.getColumn(1).width = 28;
  matrix.getColumn(2).width = 10;
  matrix.getColumn(3).width = 60;
  matrix.getColumn(4).width = 12;
  for (let i = 0; i < sortedPages.length; i++) {
    matrix.getColumn(5 + i).width = 22;
  }

  // --------------------------------------------------------------------
  // Feuille 2 - non-conformités
  // --------------------------------------------------------------------
  const ncSheet = workbook.addWorksheet(NC_SHEET_NAME, {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  const ncHeader = ncSheet.addRow([...NC_SHEET_HEADER]);
  ncHeader.font = { bold: true };
  ncHeader.eachCell((cell) => {
    cell.fill = solidFill(HEADER_FILL);
  });

  for (const nc of nonConformities) {
    const row = ncSheet.addRow([
      nc.displayNumber ?? "",
      nc.pageName ?? "",
      nc.criterionIdentifier ?? "",
      nc.criterionName ?? "",
      NC_SEVERITY_LABELS[nc.severity] ?? nc.severity,
      NC_STATUS_LABELS[nc.status] ?? nc.status,
      nc.title ?? "",
      nc.description ?? "",
      nc.recommendation ?? "",
    ]);
    row.alignment = { vertical: "top", wrapText: true };
  }

  ncSheet.getColumn(1).width = 6;
  ncSheet.getColumn(2).width = 24;
  ncSheet.getColumn(3).width = 10;
  ncSheet.getColumn(4).width = 44;
  ncSheet.getColumn(5).width = 12;
  ncSheet.getColumn(6).width = 14;
  ncSheet.getColumn(7).width = 40;
  ncSheet.getColumn(8).width = 60;
  ncSheet.getColumn(9).width = 60;

  const out = await workbook.xlsx.writeBuffer();
  return Buffer.isBuffer(out) ? out : Buffer.from(out as ArrayBuffer);
}
