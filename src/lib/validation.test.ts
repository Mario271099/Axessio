import { describe, it, expect } from "vitest";
import { isValidEmail, isValidUuid } from "./validation";

describe("isValidEmail", () => {
  it("accepte une adresse standard", () => {
    expect(isValidEmail("mario@example.com")).toBe(true);
  });

  it("accepte les sous-domaines et le plus-addressing", () => {
    expect(isValidEmail("a.b+tag@mail.sub.example.co")).toBe(true);
  });

  it("rejette une adresse sans arobase", () => {
    expect(isValidEmail("marioexample.com")).toBe(false);
  });

  it("rejette une adresse sans domaine de premier niveau", () => {
    expect(isValidEmail("mario@example")).toBe(false);
  });

  it("rejette une adresse contenant un espace", () => {
    expect(isValidEmail("mar io@example.com")).toBe(false);
  });

  it("rejette une chaîne vide", () => {
    expect(isValidEmail("")).toBe(false);
  });

  it("rejette une double arobase", () => {
    expect(isValidEmail("a@@example.com")).toBe(false);
  });
});

describe("isValidUuid", () => {
  it("accepte un UUID v4 minuscule", () => {
    expect(isValidUuid("3f2504e0-4f89-41d3-9a0c-0305e82c3301")).toBe(true);
  });

  it("est insensible à la casse", () => {
    expect(isValidUuid("3F2504E0-4F89-41D3-9A0C-0305E82C3301")).toBe(true);
  });

  it("accepte l'UUID nul (org Axessyo Internal de référence)", () => {
    expect(isValidUuid("00000000-0000-0000-0000-000000000001")).toBe(true);
  });

  it("rejette un UUID trop court", () => {
    expect(isValidUuid("3f2504e0-4f89-41d3-9a0c-0305e82c330")).toBe(false);
  });

  it("rejette un UUID sans tirets", () => {
    expect(isValidUuid("3f2504e04f8941d39a0c0305e82c3301")).toBe(false);
  });

  it("rejette un caractère non hexadécimal", () => {
    expect(isValidUuid("3f2504e0-4f89-41d3-9a0c-0305e82c330g")).toBe(false);
  });

  it("rejette une chaîne vide", () => {
    expect(isValidUuid("")).toBe(false);
  });
});
