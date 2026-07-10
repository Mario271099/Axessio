import { afterEach, describe, expect, it, vi } from "vitest";
import { checkCronAuth } from "./cron-auth";

function reqWith(authorization?: string): Request {
  return new Request("https://axessyo.com/api/cron/audit-status-auto", {
    method: "GET",
    headers: authorization ? { authorization } : {},
  });
}

describe("checkCronAuth", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("retourne unconfigured si CRON_SECRET est absent", () => {
    vi.stubEnv("CRON_SECRET", "");
    expect(checkCronAuth(reqWith("Bearer whatever"))).toBe("unconfigured");
  });

  it("accepte le bon secret avec préfixe Bearer", () => {
    vi.stubEnv("CRON_SECRET", "s3cret-token");
    expect(checkCronAuth(reqWith("Bearer s3cret-token"))).toBe("ok");
  });

  it("accepte le jeton nu (sans préfixe Bearer)", () => {
    vi.stubEnv("CRON_SECRET", "s3cret-token");
    expect(checkCronAuth(reqWith("s3cret-token"))).toBe("ok");
  });

  it("refuse un secret différent de même longueur", () => {
    vi.stubEnv("CRON_SECRET", "s3cret-token");
    expect(checkCronAuth(reqWith("Bearer s3cret-tokem"))).toBe("forbidden");
  });

  it("refuse un secret de longueur différente", () => {
    vi.stubEnv("CRON_SECRET", "s3cret-token");
    expect(checkCronAuth(reqWith("Bearer court"))).toBe("forbidden");
  });

  it("refuse une requête sans header Authorization", () => {
    vi.stubEnv("CRON_SECRET", "s3cret-token");
    expect(checkCronAuth(reqWith(undefined))).toBe("forbidden");
  });

  it("ne confond pas le préfixe Bearer avec le secret", () => {
    vi.stubEnv("CRON_SECRET", "Bearer s3cret-token");
    // Le header brut vaut exactement le secret : après strip du préfixe,
    // la comparaison doit toujours réussir sur le jeton complet fourni nu.
    expect(checkCronAuth(reqWith("Bearer Bearer s3cret-token"))).toBe("ok");
  });
});
