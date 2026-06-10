import { describe, it, expect } from "vitest";
import {
  apiRateLimitHeaders,
  requireScope,
  type ApiTokenContext,
} from "./auth";

function ctx(overrides: Partial<ApiTokenContext> = {}): ApiTokenContext {
  return {
    tokenId: "tok_123",
    organizationId: "org_123",
    scopes: ["audits:read"],
    rateLimit: { limit: 100, remaining: 42, resetSeconds: 30 },
    ...overrides,
  };
}

// ============================================================================
// requireScope — garde de scope (pas d'I/O)
// ============================================================================
describe("requireScope", () => {
  it("laisse passer quand le scope demandé est présent", () => {
    const result = requireScope(ctx({ scopes: ["audits:read", "nc:read"] }), "nc:read");
    expect(result.ok).toBe(true);
  });

  it("refuse avec une réponse 403 quand le scope manque", async () => {
    const result = requireScope(ctx({ scopes: ["audits:read"] }), "audits:write");
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("attendu: échec");
    expect(result.response.status).toBe(403);
    const body = await result.response.json();
    expect(body.error).toContain("audits:write");
  });

  it("refuse quand la liste de scopes est vide", () => {
    const result = requireScope(ctx({ scopes: [] }), "audits:read");
    expect(result.ok).toBe(false);
  });

  it("conserve le contexte d'origine en cas de succès", () => {
    const c = ctx({ scopes: ["webhooks:read"] });
    const result = requireScope(c, "webhooks:read");
    if (!result.ok) throw new Error("attendu: succès");
    expect(result.ctx).toBe(c);
  });
});

// ============================================================================
// apiRateLimitHeaders — sérialisation des en-têtes IETF RateLimit-*
// ============================================================================
describe("apiRateLimitHeaders", () => {
  it("projette le contexte sur les en-têtes RateLimit-* en chaînes", () => {
    const headers = apiRateLimitHeaders(
      ctx({ rateLimit: { limit: 100, remaining: 42, resetSeconds: 30 } }),
    );
    expect(headers).toEqual({
      "RateLimit-Limit": "100",
      "RateLimit-Remaining": "42",
      "RateLimit-Reset": "30",
    });
  });

  it("sérialise un quota épuisé (remaining = 0)", () => {
    const headers = apiRateLimitHeaders(
      ctx({ rateLimit: { limit: 100, remaining: 0, resetSeconds: 12 } }),
    );
    expect(headers["RateLimit-Remaining"]).toBe("0");
    expect(headers["RateLimit-Reset"]).toBe("12");
  });
});
