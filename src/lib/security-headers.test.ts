import { describe, it, expect } from "vitest";
import { SECURITY_HEADERS } from "./security-headers";

// On résout chaque header par clé pour des assertions lisibles.
function header(key: string): string | undefined {
  return SECURITY_HEADERS.find((h) => h.key === key)?.value;
}

describe("SECURITY_HEADERS - en-têtes statiques", () => {
  it("bloque le rendu en iframe (anti-clickjacking)", () => {
    expect(header("X-Frame-Options")).toBe("DENY");
  });

  it("empêche le sniffing MIME", () => {
    expect(header("X-Content-Type-Options")).toBe("nosniff");
  });

  it("restreint le Referer en cross-origin", () => {
    expect(header("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
  });

  it("désactive les capteurs sensibles via Permissions-Policy", () => {
    const pp = header("Permissions-Policy") ?? "";
    expect(pp).toContain("camera=()");
    expect(pp).toContain("microphone=()");
    expect(pp).toContain("geolocation=()");
    expect(pp).toContain("payment=()");
  });

  it("ne déclare aucune clé en double", () => {
    const keys = SECURITY_HEADERS.map((h) => h.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("SECURITY_HEADERS - Content-Security-Policy", () => {
  const csp = header("Content-Security-Policy") ?? "";

  it("est présente", () => {
    expect(csp.length).toBeGreaterThan(0);
  });

  it("verrouille default-src sur 'self'", () => {
    expect(csp).toContain("default-src 'self'");
  });

  it("interdit l'embedding (frame-ancestors 'none')", () => {
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it("interdit les plugins/objets (object-src 'none')", () => {
    expect(csp).toContain("object-src 'none'");
  });

  it("contraint form-action et base-uri à 'self'", () => {
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain("base-uri 'self'");
  });

  it("autorise l'origine Supabase en connect-src (REST + WebSocket)", () => {
    const connect = csp
      .split(";")
      .map((d) => d.trim())
      .find((d) => d.startsWith("connect-src"));
    expect(connect).toBeDefined();
    expect(connect).toContain("https://");
    expect(connect).toContain("wss://");
  });

  it("conditionne 'unsafe-eval' au mode non-production (isDev = NODE_ENV !== 'production')", () => {
    // Le module considère tout NODE_ENV != 'production' comme du dev. Sous Vitest
    // NODE_ENV vaut 'test' → unsafe-eval est donc attendu ici ; en prod il disparaît.
    const scriptSrc =
      csp
        .split(";")
        .map((d) => d.trim())
        .find((d) => d.startsWith("script-src")) ?? "";
    const isProd = process.env.NODE_ENV === "production";
    if (isProd) {
      expect(scriptSrc).not.toContain("'unsafe-eval'");
    } else {
      expect(scriptSrc).toContain("'unsafe-eval'");
    }
  });
});
