import { describe, it, expect, afterEach, vi } from "vitest";
import { SITE, siteUrl } from "./site";

// ============================================================================
// siteUrl — concatène le chemin à l'URL canonique en garantissant un seul "/"
// ============================================================================
describe("siteUrl", () => {
  it("retourne l'URL racine par défaut (chemin '/')", () => {
    expect(siteUrl()).toBe(`${SITE.url}/`);
  });

  it("préfixe un chemin sans slash de tête", () => {
    expect(siteUrl("pricing")).toBe(`${SITE.url}/pricing`);
  });

  it("préserve un chemin qui commence déjà par '/'", () => {
    expect(siteUrl("/legal")).toBe(`${SITE.url}/legal`);
  });

  it("conserve un sous-chemin profond", () => {
    expect(siteUrl("/audits/123/report")).toBe(`${SITE.url}/audits/123/report`);
  });
});

// ============================================================================
// SITE — invariants du catalogue SEO
// ============================================================================
describe("SITE", () => {
  it("expose une URL canonique sans slash final", () => {
    expect(SITE.url).not.toMatch(/\/$/);
  });

  it("fournit nom, description et tagline en FR et EN", () => {
    expect(SITE.name).toBe("Axessyo");
    expect(SITE.tagline.fr.length).toBeGreaterThan(0);
    expect(SITE.tagline.en.length).toBeGreaterThan(0);
    expect(SITE.description.fr.length).toBeGreaterThan(0);
    expect(SITE.description.en.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// resolveSiteUrl — priorité d'environnement (réévaluée à l'import du module).
// On recharge le module avec un env stubbé pour observer la résolution.
// ============================================================================
describe("résolution de l'URL canonique (priorité d'env)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  async function loadWithEnv(env: {
    NEXT_PUBLIC_APP_URL?: string;
    VERCEL_PROJECT_PRODUCTION_URL?: string;
  }) {
    vi.resetModules();
    // On force les deux variables à une valeur connue (undefined = absente).
    vi.stubEnv("NEXT_PUBLIC_APP_URL", env.NEXT_PUBLIC_APP_URL ?? "");
    vi.stubEnv(
      "VERCEL_PROJECT_PRODUCTION_URL",
      env.VERCEL_PROJECT_PRODUCTION_URL ?? "",
    );
    return import("./site");
  }

  it("priorise NEXT_PUBLIC_APP_URL quand elle est posée", async () => {
    const mod = await loadWithEnv({
      NEXT_PUBLIC_APP_URL: "https://app.axessyo.com",
      VERCEL_PROJECT_PRODUCTION_URL: "prod.vercel.app",
    });
    expect(mod.SITE.url).toBe("https://app.axessyo.com");
  });

  it("normalise le slash final de NEXT_PUBLIC_APP_URL", async () => {
    const mod = await loadWithEnv({
      NEXT_PUBLIC_APP_URL: "https://app.axessyo.com/",
    });
    expect(mod.SITE.url).toBe("https://app.axessyo.com");
  });

  it("retombe sur le domaine de prod Vercel si NEXT_PUBLIC_APP_URL est absente", async () => {
    const mod = await loadWithEnv({
      VERCEL_PROJECT_PRODUCTION_URL: "axessyo.vercel.app",
    });
    expect(mod.SITE.url).toBe("https://axessyo.vercel.app");
  });

  it("retombe sur le fallback quand aucune variable n'est posée", async () => {
    const mod = await loadWithEnv({});
    expect(mod.SITE.url).toBe("https://axessyo.com");
  });
});
