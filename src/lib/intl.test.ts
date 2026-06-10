import { describe, it, expect } from "vitest";
import { intlLocale } from "./intl";

describe("intlLocale", () => {
  it("mappe 'en' vers en-US", () => {
    expect(intlLocale("en")).toBe("en-US");
  });

  it("mappe 'fr' vers fr-FR", () => {
    expect(intlLocale("fr")).toBe("fr-FR");
  });

  it("retombe sur fr-FR pour toute locale non anglaise (défaut produit)", () => {
    expect(intlLocale("es")).toBe("fr-FR");
    expect(intlLocale("")).toBe("fr-FR");
  });

  it("produit un tag exploitable par Intl.NumberFormat", () => {
    const formatted = new Intl.NumberFormat(intlLocale("fr")).format(1234.5);
    // fr-FR utilise l'espace insécable comme séparateur de milliers.
    expect(formatted).toMatch(/1\s?234/);
  });
});
