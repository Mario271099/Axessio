import { describe, expect, it } from "vitest";
import { cn, formatDate, formatScore, initials } from "./utils";

// ============================================================================
// cn() - wrapper clsx + tailwind-merge
// ============================================================================
describe("cn", () => {
  it("concatène deux chaînes simples", () => {
    expect(cn("p-2", "text-sm")).toBe("p-2 text-sm");
  });

  it("ignore undefined, null et false (clsx)", () => {
    expect(cn("p-2", undefined, null, false, "text-sm")).toBe("p-2 text-sm");
  });

  it("supporte une expression ternaire conditionnelle", () => {
    const isError = true;
    const isWarn = false;
    expect(cn("p-2", isError && "text-red-500", isWarn && "text-amber-500"))
      .toBe("p-2 text-red-500");
  });

  it("supporte la syntaxe objet de clsx", () => {
    expect(
      cn("p-2", {
        "text-red-500": true,
        "text-green-500": false,
        underline: true,
      }),
    ).toBe("p-2 text-red-500 underline");
  });

  it("supporte les tableaux imbriqués", () => {
    expect(cn(["p-2", ["text-sm", ["font-bold"]]])).toBe("p-2 text-sm font-bold");
  });

  it("résout les conflits Tailwind via tailwind-merge (dernière classe gagne)", () => {
    // p-2 et p-4 sont incompatibles → seul p-4 doit rester
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("résout aussi les conflits sur les couleurs de texte", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("retourne une chaîne vide sans argument", () => {
    expect(cn()).toBe("");
  });

  it("retourne une chaîne vide avec uniquement des valeurs falsy", () => {
    expect(cn(undefined, null, false, "")).toBe("");
  });

  it("préserve les classes non-Tailwind", () => {
    expect(cn("my-custom-class", "p-2")).toBe("my-custom-class p-2");
  });
});

// ============================================================================
// formatDate()
// ============================================================================
describe("formatDate", () => {
  it("retourne - pour null", () => {
    expect(formatDate(null)).toBe("—");
  });

  it("retourne - pour undefined", () => {
    expect(formatDate(undefined)).toBe("—");
  });

  it("formate une chaîne ISO en français (jour court, mois abrégé, année)", () => {
    const formatted = formatDate("2026-05-12T10:00:00Z");
    // Le format est "12 mai 2026" - locale fr-FR, mois court.
    // On vérifie la présence des trois parties pour être robuste aux variations
    // d'environnement (espace insécable, point après le mois, etc.).
    expect(formatted).toMatch(/12/);
    expect(formatted).toMatch(/2026/);
    expect(formatted.toLowerCase()).toMatch(/mai/);
  });

  it("accepte un objet Date", () => {
    const formatted = formatDate(new Date("2026-01-01T00:00:00Z"));
    expect(formatted).toMatch(/2026/);
  });
});

// ============================================================================
// formatScore()
// ============================================================================
describe("formatScore", () => {
  it("retourne - pour null", () => {
    expect(formatScore(null)).toBe("—");
  });

  it("retourne - pour undefined", () => {
    expect(formatScore(undefined)).toBe("—");
  });

  it("formate un score entier sans décimales superflues", () => {
    expect(formatScore(100)).toBe("100%");
    expect(formatScore(0)).toBe("0%");
  });

  it("conserve les décimales significatives", () => {
    expect(formatScore(82.5)).toBe("82.5%");
    expect(formatScore(69.77)).toBe("69.77%");
  });

  it("supprime les zéros finaux après la virgule", () => {
    // 50.00 → "50%", 50.10 → "50.1%"
    expect(formatScore(50)).toBe("50%");
    expect(formatScore(50.1)).toBe("50.1%");
  });
});

// ============================================================================
// initials()
// ============================================================================
describe("initials", () => {
  it("renvoie les deux premières lettres en majuscules", () => {
    expect(initials("camille", "martin")).toBe("CM");
  });

  it("respecte les caractères déjà en majuscules", () => {
    expect(initials("Mario", "Harimanitra")).toBe("MH");
  });

  it("gère les prénoms/noms vides en renvoyant une chaîne vide", () => {
    expect(initials("", "")).toBe("");
  });

  it("gère un seul nom (initiale unique)", () => {
    expect(initials("Anne", "")).toBe("A");
  });
});
