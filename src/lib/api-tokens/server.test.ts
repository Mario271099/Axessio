import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  API_SCOPES,
  extractBearerToken,
  generateApiToken,
  hashApiToken,
} from "./server";

// ============================================================================
// API_SCOPES — catalogue
// ============================================================================
describe("API_SCOPES catalogue", () => {
  it("inclut les scopes attendus", () => {
    expect(new Set(API_SCOPES)).toEqual(
      new Set([
        "audits:read",
        "audits:write",
        "nc:read",
        "nc:write",
        "webhooks:read",
      ]),
    );
  });
});

// ============================================================================
// generateApiToken
// ============================================================================
describe("generateApiToken", () => {
  it("produit un token live par défaut (préfixe axe_live_)", () => {
    const { plaintext } = generateApiToken();
    expect(plaintext).toMatch(/^axe_live_/);
  });

  it("respecte le paramètre env=test", () => {
    const { plaintext } = generateApiToken("test");
    expect(plaintext).toMatch(/^axe_test_/);
  });

  it("génère un préfixe public de 12 caractères", () => {
    const { plaintext, prefix } = generateApiToken();
    expect(prefix.length).toBe(12);
    expect(plaintext.startsWith(prefix)).toBe(true);
  });

  it("génère un hash SHA-256 hex (64 caractères)", () => {
    const { hash } = generateApiToken();
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("le hash correspond bien au SHA-256 du plaintext", () => {
    const { plaintext, hash } = generateApiToken();
    const expected = crypto.createHash("sha256").update(plaintext).digest("hex");
    expect(hash).toBe(expected);
  });

  it("la partie aléatoire du token utilise base64url (URL-safe)", () => {
    const { plaintext } = generateApiToken();
    const random = plaintext.slice("axe_live_".length);
    expect(random).toMatch(/^[A-Za-z0-9_-]+$/);
    // 32 bytes en base64url ≈ 43 chars
    expect(random.length).toBeGreaterThanOrEqual(40);
  });

  it("génère des tokens distincts à chaque appel", () => {
    const a = generateApiToken();
    const b = generateApiToken();
    expect(a.plaintext).not.toBe(b.plaintext);
    expect(a.hash).not.toBe(b.hash);
    expect(a.prefix).not.toBe(b.prefix);
  });
});

// ============================================================================
// hashApiToken
// ============================================================================
describe("hashApiToken", () => {
  it("est déterministe (même input → même hash)", () => {
    const token = "axe_live_static_value";
    expect(hashApiToken(token)).toBe(hashApiToken(token));
  });

  it("change radicalement avec un seul caractère modifié (effet avalanche)", () => {
    const a = hashApiToken("axe_live_a");
    const b = hashApiToken("axe_live_b");
    expect(a).not.toBe(b);
  });

  it("retourne 64 caractères hex (SHA-256)", () => {
    const hash = hashApiToken("anything");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});

// ============================================================================
// extractBearerToken — parsing du header Authorization
// ============================================================================
describe("extractBearerToken", () => {
  it("extrait correctement un Bearer simple", () => {
    expect(extractBearerToken("Bearer axe_live_abc")).toBe("axe_live_abc");
  });

  it("est insensible à la casse du schéma", () => {
    expect(extractBearerToken("bearer axe_live_abc")).toBe("axe_live_abc");
    expect(extractBearerToken("BEARER axe_live_abc")).toBe("axe_live_abc");
  });

  it("accepte plusieurs espaces ou tabulations entre Bearer et le token", () => {
    expect(extractBearerToken("Bearer   axe_live_abc")).toBe("axe_live_abc");
    expect(extractBearerToken("Bearer\taxe_live_abc")).toBe("axe_live_abc");
  });

  it("ignore les espaces autour du header", () => {
    expect(extractBearerToken("  Bearer axe_live_abc  ")).toBe("axe_live_abc");
  });

  it("retourne null si le header est null", () => {
    expect(extractBearerToken(null)).toBeNull();
  });

  it("retourne null si le header est vide", () => {
    expect(extractBearerToken("")).toBeNull();
  });

  it("retourne null pour un schéma autre (Basic, Token)", () => {
    expect(extractBearerToken("Basic dXNlcjpwYXNz")).toBeNull();
    expect(extractBearerToken("Token axe_live_abc")).toBeNull();
  });

  it("retourne null si le token contient des espaces (multi-tokens malformés)", () => {
    expect(extractBearerToken("Bearer axe_live_abc def")).toBeNull();
  });

  it("retourne null si le token est manquant après Bearer", () => {
    expect(extractBearerToken("Bearer")).toBeNull();
    expect(extractBearerToken("Bearer ")).toBeNull();
  });
});
