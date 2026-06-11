import { describe, it, expect } from "vitest";
import ExcelJS from "exceljs";
import {
  buildMatrixXlsx,
  MATRIX_SHEET_NAME,
  NC_SHEET_NAME,
  NC_SHEET_HEADER,
  type MatrixXlsxNc,
} from "./export-matrix-xlsx";
import type {
  MatrixCsvConformity,
  MatrixCsvCriterion,
  MatrixCsvPage,
} from "./export-matrix-csv";

function page(over: Partial<MatrixCsvPage> = {}): MatrixCsvPage {
  return {
    id: "p1",
    name: "Accueil",
    url: "https://ex.fr",
    pageType: "MANDATORY",
    sortOrder: 0,
    ...over,
  };
}

function criterion(over: Partial<MatrixCsvCriterion> = {}): MatrixCsvCriterion {
  return {
    id: "c1",
    identifier: "1.1",
    name: "Image porteuse d'information",
    level: "A",
    thematicIdentifier: "1",
    thematicName: "Images",
    thematicSort: 0,
    ...over,
  };
}

function nc(over: Partial<MatrixXlsxNc> = {}): MatrixXlsxNc {
  return {
    displayNumber: 1,
    pageName: "Accueil",
    criterionIdentifier: "1.1",
    criterionName: "Image porteuse d'information",
    severity: "HIGH",
    status: "OPEN",
    title: "Alt manquant",
    description: "L'image du logo n'a pas d'alternative.",
    recommendation: "Ajouter un attribut alt.",
    ...over,
  };
}

async function buildAndRead(input: {
  pages: MatrixCsvPage[];
  criteria: MatrixCsvCriterion[];
  conformities: MatrixCsvConformity[];
  nonConformities: MatrixXlsxNc[];
}): Promise<ExcelJS.Workbook> {
  const buffer = await buildMatrixXlsx(input);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  return workbook;
}

describe("buildMatrixXlsx", () => {
  it("produit un classeur avec les deux feuilles attendues", async () => {
    const wb = await buildAndRead({
      pages: [page()],
      criteria: [criterion()],
      conformities: [],
      nonConformities: [],
    });
    expect(wb.worksheets.map((ws) => ws.name)).toEqual([
      MATRIX_SHEET_NAME,
      NC_SHEET_NAME,
    ]);
  });

  it("écrit le libellé de statut dans la cellule page × critère", async () => {
    const wb = await buildAndRead({
      pages: [page()],
      criteria: [criterion()],
      conformities: [{ pageId: "p1", criteriaId: "c1", status: "COMPLIANT" }],
      nonConformities: [],
    });
    const ws = wb.getWorksheet(MATRIX_SHEET_NAME)!;
    // Ligne 1 = en-tête, ligne 2 = scores, ligne 3 = premier critère.
    // Colonne 5 = première page.
    expect(ws.getRow(3).getCell(5).value).toBe("Conforme");
  });

  it("marque « Non évalué » les cellules sans saisie", async () => {
    const wb = await buildAndRead({
      pages: [page()],
      criteria: [criterion()],
      conformities: [],
      nonConformities: [],
    });
    const ws = wb.getWorksheet(MATRIX_SHEET_NAME)!;
    expect(ws.getRow(3).getCell(5).value).toBe("Non évalué");
  });

  it("colore les cellules selon le statut (vert conforme, rouge NC)", async () => {
    const wb = await buildAndRead({
      pages: [page(), page({ id: "p2", name: "Contact", sortOrder: 1 })],
      criteria: [criterion()],
      conformities: [
        { pageId: "p1", criteriaId: "c1", status: "COMPLIANT" },
        { pageId: "p2", criteriaId: "c1", status: "NON_COMPLIANT" },
      ],
      nonConformities: [],
    });
    const ws = wb.getWorksheet(MATRIX_SHEET_NAME)!;
    const fillP1 = ws.getRow(3).getCell(5).fill as ExcelJS.FillPattern;
    const fillP2 = ws.getRow(3).getCell(6).fill as ExcelJS.FillPattern;
    expect(fillP1.fgColor?.argb).toBe("FFD9EAD3");
    expect(fillP2.fgColor?.argb).toBe("FFF4CCCC");
  });

  it("calcule le score par page avec la formule officielle", async () => {
    // 4 critères : 1 conforme, 1 NC, 1 NA, 1 non évalué
    // → score = 1 / (4 - 1) * 100 = 33.33
    const criteria = [
      criterion(),
      criterion({ id: "c2", identifier: "1.2" }),
      criterion({ id: "c3", identifier: "1.3" }),
      criterion({ id: "c4", identifier: "1.4" }),
    ];
    const wb = await buildAndRead({
      pages: [page()],
      criteria,
      conformities: [
        { pageId: "p1", criteriaId: "c1", status: "COMPLIANT" },
        { pageId: "p1", criteriaId: "c2", status: "NON_COMPLIANT" },
        { pageId: "p1", criteriaId: "c3", status: "NOT_APPLICABLE" },
      ],
      nonConformities: [],
    });
    const ws = wb.getWorksheet(MATRIX_SHEET_NAME)!;
    expect(ws.getRow(2).getCell(5).value).toBe(33.33);
  });

  it("trie les critères par thématique puis identifiant numérique", async () => {
    const wb = await buildAndRead({
      pages: [page()],
      criteria: [
        criterion({ id: "c10", identifier: "1.10" }),
        criterion({ id: "c2", identifier: "1.2" }),
        criterion({
          id: "c0",
          identifier: "0.1",
          thematicIdentifier: "0",
          thematicName: "Avant",
          thematicSort: -1,
        }),
      ],
      conformities: [],
      nonConformities: [],
    });
    const ws = wb.getWorksheet(MATRIX_SHEET_NAME)!;
    const identifiers = [3, 4, 5].map((r) => ws.getRow(r).getCell(2).value);
    expect(identifiers).toEqual(["0.1", "1.2", "1.10"]);
  });

  it("remplit la feuille des non-conformités avec libellés FR", async () => {
    const wb = await buildAndRead({
      pages: [page()],
      criteria: [criterion()],
      conformities: [],
      nonConformities: [nc()],
    });
    const ws = wb.getWorksheet(NC_SHEET_NAME)!;
    const header = NC_SHEET_HEADER.map((_, i) =>
      ws.getRow(1).getCell(i + 1).value,
    );
    expect(header).toEqual([...NC_SHEET_HEADER]);
    const row = ws.getRow(2);
    expect(row.getCell(1).value).toBe(1);
    expect(row.getCell(2).value).toBe("Accueil");
    expect(row.getCell(3).value).toBe("1.1");
    // Sévérité / statut traduits via les labels FR de lib/constants.
    expect(typeof row.getCell(5).value).toBe("string");
    expect(row.getCell(5).value).not.toBe("HIGH");
    expect(row.getCell(6).value).not.toBe("OPEN");
  });

  it("n'interprète pas une valeur commençant par = comme une formule", async () => {
    const wb = await buildAndRead({
      pages: [page()],
      criteria: [criterion({ name: "=cmd|' /C calc'!A0" })],
      conformities: [],
      nonConformities: [],
    });
    const ws = wb.getWorksheet(MATRIX_SHEET_NAME)!;
    const cell = ws.getRow(3).getCell(3);
    expect(cell.value).toBe("=cmd|' /C calc'!A0");
    expect(cell.formula).toBeFalsy();
  });
});
