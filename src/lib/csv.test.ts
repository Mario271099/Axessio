import { describe, it, expect } from "vitest";
import { escapeCsv, escapeCsvCell } from "./csv";

describe("escapeCsv - RFC 4180", () => {
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

  it("convertit les nombres en chaîne", () => {
    expect(escapeCsv(42)).toBe("42");
  });
});

describe("escapeCsv - anti-injection de formule", () => {
  it("préfixe d'une apostrophe une cellule commençant par =", () => {
    expect(escapeCsv("=1+1")).toBe("'=1+1");
  });

  it("désamorce les déclencheurs + - @", () => {
    expect(escapeCsv("+1")).toBe("'+1");
    expect(escapeCsv("-1")).toBe("'-1");
    expect(escapeCsv("@SUM(A1)")).toBe("'@SUM(A1)");
  });

  it("désamorce une attaque HYPERLINK et la guillemette (virgule présente)", () => {
    expect(escapeCsv('=HYPERLINK("http://evil","x")')).toBe(
      '"\'=HYPERLINK(""http://evil"",""x"")"',
    );
  });

  it("désamorce les déclencheurs tabulation et retour chariot", () => {
    // \r entraîne aussi le guillemetage RFC 4180.
    expect(escapeCsv("\rcmd")).toBe('"\'\rcmd"');
    expect(escapeCsv("\t=cmd")).toBe("'\t=cmd");
  });

  it("ne touche pas une valeur dont le déclencheur n'est pas en tête", () => {
    expect(escapeCsv("a=b")).toBe("a=b");
    expect(escapeCsv("note +1")).toBe("note +1");
  });

  it("traite un nombre négatif sérialisé comme une formule (préfixe ')", () => {
    // String(-5) === "-5" → commence par '-' → désamorcé. Acceptable : les
    // colonnes numériques de nos exports passent des libellés, pas des calculs.
    expect(escapeCsv(-5)).toBe("'-5");
  });
});

describe("escapeCsvCell - sérialisation des valeurs non-textuelles", () => {
  it("retourne une chaîne vide pour null / undefined", () => {
    expect(escapeCsvCell(null)).toBe("");
    expect(escapeCsvCell(undefined)).toBe("");
  });

  it("passe les chaînes à escapeCsv", () => {
    expect(escapeCsvCell("=1+1")).toBe("'=1+1");
  });

  it("sérialise un objet en JSON puis échappe", () => {
    expect(escapeCsvCell({ email: "a@b.fr" })).toBe(
      '"{""email"":""a@b.fr""}"',
    );
  });

  it("guillemette un tableau JSON (virgule interne) sans le préfixer", () => {
    // JSON.stringify([1,2]) === "[1,2]" : commence par '[' (pas un déclencheur)
    // mais contient une virgule → guillemetage RFC 4180 seul.
    expect(escapeCsvCell([1, 2])).toBe('"[1,2]"');
  });
});
