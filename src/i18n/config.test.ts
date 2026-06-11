import { describe, it, expect } from "vitest";
import { detectLocaleFromHeader, isLocale } from "./config";

describe("isLocale", () => {
  it("accepte fr et en, rejette le reste", () => {
    expect(isLocale("fr")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("de")).toBe(false);
    expect(isLocale(null)).toBe(false);
    expect(isLocale(42)).toBe(false);
  });
});

describe("detectLocaleFromHeader", () => {
  it("retombe sur fr sans header", () => {
    expect(detectLocaleFromHeader(null)).toBe("fr");
    expect(detectLocaleFromHeader("")).toBe("fr");
  });

  it("détecte l'anglais d'un navigateur anglophone", () => {
    expect(detectLocaleFromHeader("en-US,en;q=0.9")).toBe("en");
  });

  it("détecte le français d'un navigateur francophone", () => {
    expect(detectLocaleFromHeader("fr-FR,fr;q=0.9,en-US;q=0.8")).toBe("fr");
  });

  it("respecte l'ordre de qualité q", () => {
    expect(detectLocaleFromHeader("en;q=0.5,fr;q=0.9")).toBe("fr");
    expect(detectLocaleFromHeader("fr;q=0.3,en;q=0.7")).toBe("en");
  });

  it("saute les langues non supportées", () => {
    expect(detectLocaleFromHeader("de-DE,de;q=0.9,en;q=0.5")).toBe("en");
    expect(detectLocaleFromHeader("de-DE,ja;q=0.8")).toBe("fr");
  });

  it("ignore les entrées q=0 (langue explicitement refusée)", () => {
    expect(detectLocaleFromHeader("en;q=0,fr;q=0.8")).toBe("fr");
  });

  it("tolère un header malformé", () => {
    expect(detectLocaleFromHeader(";;;,,q=,en")).toBe("en");
    expect(detectLocaleFromHeader("*")).toBe("fr");
  });
});
