import { describe, expect, it } from "vitest";
import { clientIp, sanitizeLoginEmail } from "./login-audit";

function reqWith(headers: Record<string, string>): Request {
  return new Request("https://axessyo.com/api/auth/login-attempt", {
    method: "POST",
    headers,
  });
}

describe("clientIp", () => {
  it("prend la première IP de x-forwarded-for", () => {
    const req = reqWith({ "x-forwarded-for": "203.0.113.7, 10.0.0.1, 10.0.0.2" });
    expect(clientIp(req)).toBe("203.0.113.7");
  });

  it("trim les espaces", () => {
    const req = reqWith({ "x-forwarded-for": "  203.0.113.7  " });
    expect(clientIp(req)).toBe("203.0.113.7");
  });

  it("retombe sur x-real-ip si pas de XFF", () => {
    const req = reqWith({ "x-real-ip": "198.51.100.4" });
    expect(clientIp(req)).toBe("198.51.100.4");
  });

  it("retourne 'unknown' sans en-tête d'IP", () => {
    expect(clientIp(reqWith({}))).toBe("unknown");
  });
});

describe("sanitizeLoginEmail", () => {
  it("trim + lowercase", () => {
    expect(sanitizeLoginEmail("  Marie@Example.COM ")).toBe("marie@example.com");
  });

  it("borne à 254 caractères", () => {
    const long = "a".repeat(300) + "@x.com";
    expect(sanitizeLoginEmail(long)?.length).toBe(254);
  });

  it("retourne null si vide ou non-string", () => {
    expect(sanitizeLoginEmail("")).toBeNull();
    expect(sanitizeLoginEmail("   ")).toBeNull();
    expect(sanitizeLoginEmail(null)).toBeNull();
    expect(sanitizeLoginEmail(undefined)).toBeNull();
    expect(sanitizeLoginEmail(123)).toBeNull();
  });
});
