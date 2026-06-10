import { describe, it, expect } from "vitest";
import { localizeProcedure, parseMethodology } from "./methodology";

// ============================================================================
// parseMethodology — découpage des blocs "Test X.Y.Z" + question
// ============================================================================
describe("parseMethodology", () => {
  it("retourne un tableau vide pour null / undefined / vide", () => {
    expect(parseMethodology(null)).toEqual([]);
    expect(parseMethodology(undefined)).toEqual([]);
    expect(parseMethodology("")).toEqual([]);
  });

  it("parse un test unique", () => {
    const src = "Test 1.1.1\nChaque image a-t-elle une alternative ?";
    expect(parseMethodology(src)).toEqual([
      { reference: "Test 1.1.1", question: "Chaque image a-t-elle une alternative ?" },
    ]);
  });

  it("parse plusieurs tests séparés par des lignes vides", () => {
    const src = [
      "Test 1.1.1",
      "Question A ?",
      "",
      "Test 1.1.2",
      "Question B ?",
    ].join("\n");
    expect(parseMethodology(src)).toEqual([
      { reference: "Test 1.1.1", question: "Question A ?" },
      { reference: "Test 1.1.2", question: "Question B ?" },
    ]);
  });

  it("agrège une question multi-lignes en normalisant les espaces", () => {
    const src = "Test 2.1.1\nDébut de question\n   suite   de   la question\nfin ?";
    expect(parseMethodology(src)).toEqual([
      { reference: "Test 2.1.1", question: "Début de question suite de la question fin ?" },
    ]);
  });

  it("supporte les références à 4 segments (Test 1.1.1.1)", () => {
    const src = "Test 1.1.1.1\nQuestion ?";
    expect(parseMethodology(src)).toEqual([
      { reference: "Test 1.1.1.1", question: "Question ?" },
    ]);
  });

  it("ignore un en-tête de test sans question (pas de bloc vide)", () => {
    const src = "Test 1.1.1\n\nTest 1.1.2\nUne vraie question ?";
    expect(parseMethodology(src)).toEqual([
      { reference: "Test 1.1.2", question: "Une vraie question ?" },
    ]);
  });

  it("gère les fins de ligne Windows (\\r\\n)", () => {
    const src = "Test 1.1.1\r\nQuestion CRLF ?";
    expect(parseMethodology(src)).toEqual([
      { reference: "Test 1.1.1", question: "Question CRLF ?" },
    ]);
  });

  it("ignore le texte précédant le premier en-tête de test", () => {
    const src = "Préambule à ignorer\nTest 1.1.1\nQuestion ?";
    expect(parseMethodology(src)).toEqual([
      { reference: "Test 1.1.1", question: "Question ?" },
    ]);
  });
});

// ============================================================================
// localizeProcedure — résolution string | { en, fr? } selon la locale
// ============================================================================
describe("localizeProcedure", () => {
  it("retourne null pour null / undefined", () => {
    expect(localizeProcedure(null, "fr")).toBeNull();
    expect(localizeProcedure(undefined, "en")).toBeNull();
  });

  it("retourne la chaîne telle quelle (référentiels FR)", () => {
    expect(localizeProcedure("Procédure RGAA", "fr")).toBe("Procédure RGAA");
    expect(localizeProcedure("Procédure RGAA", "en")).toBe("Procédure RGAA");
  });

  it("retourne la version FR pour une locale française", () => {
    expect(localizeProcedure({ en: "EN proc", fr: "FR proc" }, "fr")).toBe("FR proc");
    expect(localizeProcedure({ en: "EN proc", fr: "FR proc" }, "fr-FR")).toBe("FR proc");
  });

  it("retombe sur l'anglais si la traduction FR est absente", () => {
    expect(localizeProcedure({ en: "EN only" }, "fr")).toBe("EN only");
  });

  it("retourne la version EN pour une locale anglaise", () => {
    expect(localizeProcedure({ en: "EN proc", fr: "FR proc" }, "en")).toBe("EN proc");
  });

  it("ne retombe PAS sur le français si l'anglais est une chaîne vide (?? ignore '')", () => {
    // `??` ne se déclenche que sur null/undefined : une chaîne vide est conservée.
    expect(localizeProcedure({ en: "", fr: "FR proc" }, "en")).toBe("");
  });
});
