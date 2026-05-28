import { describe, expect, it } from "vitest";
import fr from "../../messages/fr.json";
import en from "../../messages/en.json";

// Garde anti-régression i18n : fr.json et en.json doivent exposer EXACTEMENT
// le même ensemble de clés. Une clé ajoutée d'un côté sans l'autre produit en
// prod soit un fallback silencieux soit la clé brute affichée à l'écran. Ce
// test casse le CI avant que ça parte en prod.
//
// On compare les chemins de clés "feuilles" (leaf) — c.-à-d. les clés qui
// portent une string, pas les objets de namespace intermédiaires.

type Json = string | number | boolean | null | { [k: string]: Json } | Json[];

function flattenKeys(obj: Json, prefix = ""): string[] {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    return [prefix];
  }
  const out: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    out.push(...flattenKeys(value as Json, path));
  }
  return out;
}

describe("parité i18n fr ↔ en", () => {
  const frKeys = new Set(flattenKeys(fr as Json));
  const enKeys = new Set(flattenKeys(en as Json));

  it("a au moins quelques centaines de clés (sanity check du chargement)", () => {
    expect(frKeys.size).toBeGreaterThan(100);
    expect(enKeys.size).toBeGreaterThan(100);
  });

  it("ne contient aucune clé présente en FR mais absente en EN", () => {
    const missingInEn = [...frKeys].filter((k) => !enKeys.has(k)).sort();
    expect(missingInEn, `Clés à ajouter dans en.json :\n${missingInEn.join("\n")}`).toEqual([]);
  });

  it("ne contient aucune clé présente en EN mais absente en FR", () => {
    const missingInFr = [...enKeys].filter((k) => !frKeys.has(k)).sort();
    expect(missingInFr, `Clés à ajouter dans fr.json :\n${missingInFr.join("\n")}`).toEqual([]);
  });

  it("a un nombre de clés identique des deux côtés", () => {
    expect(frKeys.size).toBe(enKeys.size);
  });
});
