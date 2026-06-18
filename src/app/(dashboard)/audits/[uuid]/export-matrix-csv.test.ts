import { describe, it, expect } from "vitest";
import {
  buildMatrixCsv,
  escapeCsv,
  slugify,
  MATRIX_CSV_HEADER,
  type MatrixCsvConformity,
  type MatrixCsvCriterion,
  type MatrixCsvPage,
} from "./export-matrix-csv";

const BOM = "﻿";

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

// Découpe le CSV (sans BOM) en lignes puis en cellules - suffisant ici car nos
// fixtures n'embarquent pas de séparateur dans les valeurs sauf test dédié.
function rows(csv: string): string[][] {
  return csv
    .replace(BOM, "")
    .split("\r\n")
    .map((line) => line.split(","));
}

// ============================================================================
// escapeCsv - RFC 4180
// ============================================================================
describe("escapeCsv", () => {
  it("retourne une chaîne vide pour null / undefined", () => {
    expect(escapeCsv(null)).toBe("");
    expect(escapeCsv(undefined)).toBe("");
  });

  it("laisse une valeur simple intacte", () => {
    expect(escapeCsv("Accueil")).toBe("Accueil");
  });

  it("guillemette une valeur contenant une virgule", () => {
    expect(escapeCsv("Images, liens")).toBe('"Images, liens"');
  });

  it("double les guillemets internes", () => {
    expect(escapeCsv('Le "menu"')).toBe('"Le ""menu"""');
  });

  it("guillemette une valeur contenant un saut de ligne", () => {
    expect(escapeCsv("ligne1\nligne2")).toBe('"ligne1\nligne2"');
  });
});

// ============================================================================
// slugify - nom de fichier
// ============================================================================
describe("slugify", () => {
  it("translittère les accents et abaisse la casse", () => {
    expect(slugify("Société Générale")).toBe("societe-generale");
  });

  it("retombe sur 'audit' quand il ne reste rien d'exploitable", () => {
    expect(slugify("—")).toBe("audit");
    expect(slugify("")).toBe("audit");
  });
});

// ============================================================================
// buildMatrixCsv
// ============================================================================
describe("buildMatrixCsv", () => {
  it("commence par un BOM UTF-8 puis l'en-tête attendu", () => {
    const csv = buildMatrixCsv({ pages: [], criteria: [], conformities: [] });
    expect(csv.startsWith(BOM)).toBe(true);
    expect(csv.slice(BOM.length)).toBe(MATRIX_CSV_HEADER.join(","));
  });

  it("utilise des fins de ligne CRLF", () => {
    const csv = buildMatrixCsv({
      pages: [page()],
      criteria: [criterion()],
      conformities: [],
    });
    expect(csv).toContain("\r\n");
    expect(csv.split("\r\n")).toHaveLength(2);
  });

  it("émet une ligne par cellule (page × critère)", () => {
    const csv = buildMatrixCsv({
      pages: [page({ id: "p1" }), page({ id: "p2", name: "Contact" })],
      criteria: [
        criterion({ id: "c1", identifier: "1.1" }),
        criterion({ id: "c2", identifier: "1.2" }),
      ],
      conformities: [],
    });
    // 1 en-tête + 2 critères × 2 pages = 5 lignes.
    expect(rows(csv)).toHaveLength(5);
  });

  it("traduit le statut de conformité en libellé FR", () => {
    const csv = buildMatrixCsv({
      pages: [page({ id: "p1" })],
      criteria: [criterion({ id: "c1" })],
      conformities: [
        { pageId: "p1", criteriaId: "c1", status: "COMPLIANT" },
      ] satisfies MatrixCsvConformity[],
    });
    const dataRow = rows(csv)[1]!;
    expect(dataRow[dataRow.length - 1]).toBe("Conforme");
  });

  it("marque 'Non évalué' une cellule sans saisie", () => {
    const csv = buildMatrixCsv({
      pages: [page({ id: "p1" })],
      criteria: [criterion({ id: "c1" })],
      conformities: [],
    });
    const dataRow = rows(csv)[1]!;
    expect(dataRow[dataRow.length - 1]).toBe("Non évalué");
  });

  it("traduit le type de page en libellé FR", () => {
    const csv = buildMatrixCsv({
      pages: [page({ id: "p1", pageType: "TRANSVERSAL" })],
      criteria: [criterion({ id: "c1" })],
      conformities: [],
    });
    expect(csv).toContain("Transversale");
  });

  it("trie par thématique puis critère en ordre numérique (10 après 2)", () => {
    const csv = buildMatrixCsv({
      pages: [page({ id: "p1" })],
      criteria: [
        criterion({ id: "c10", identifier: "1.10", thematicSort: 0 }),
        criterion({ id: "c2", identifier: "1.2", thematicSort: 0 }),
      ],
      conformities: [],
    });
    const data = rows(csv).slice(1);
    // colonne 1 = identifiant du critère
    expect(data.map((r) => r[1])).toEqual(["1.2", "1.10"]);
  });

  it("trie les thématiques par sort_order avant l'identifiant", () => {
    const csv = buildMatrixCsv({
      pages: [page({ id: "p1" })],
      criteria: [
        criterion({ id: "cB", identifier: "2.1", thematicSort: 1 }),
        criterion({ id: "cA", identifier: "1.1", thematicSort: 0 }),
      ],
      conformities: [],
    });
    const data = rows(csv).slice(1);
    expect(data.map((r) => r[1])).toEqual(["1.1", "2.1"]);
  });

  it("trie les pages par sortOrder", () => {
    const csv = buildMatrixCsv({
      pages: [
        page({ id: "p2", name: "Contact", sortOrder: 1 }),
        page({ id: "p1", name: "Accueil", sortOrder: 0 }),
      ],
      criteria: [criterion({ id: "c1" })],
      conformities: [],
    });
    const data = rows(csv).slice(1);
    // colonne 4 = nom de la page
    expect(data.map((r) => r[4])).toEqual(["Accueil", "Contact"]);
  });

  it("échappe un nom de critère contenant une virgule", () => {
    const csv = buildMatrixCsv({
      pages: [page({ id: "p1" })],
      criteria: [criterion({ id: "c1", name: "Images, liens et zones" })],
      conformities: [],
    });
    expect(csv).toContain('"Images, liens et zones"');
  });

  it("concatène identifiant et nom de thématique dans la 1re colonne", () => {
    const csv = buildMatrixCsv({
      pages: [page({ id: "p1" })],
      criteria: [
        criterion({ id: "c1", thematicIdentifier: "1", thematicName: "Images" }),
      ],
      conformities: [],
    });
    expect(rows(csv)[1]![0]).toBe("1 Images");
  });
});
