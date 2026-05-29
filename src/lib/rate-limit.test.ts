import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { rateLimit, retryAfterSeconds } from "./rate-limit";

// Ces tests valident le backend IN-MEMORY (fallback). Aucune variable Upstash
// n'étant définie dans l'environnement de test, `rateLimit` retombe dessus.
// On utilise des clés uniques par test car le store est un singleton de module.

let keyCounter = 0;
function uniqueKey(): string {
  keyCounter += 1;
  return `test:${Date.now()}:${keyCounter}`;
}

describe("rateLimit (in-memory)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("autorise le premier appel et décrémente remaining", async () => {
    const r = await rateLimit(uniqueKey(), 3, 60_000);
    expect(r.ok).toBe(true);
    expect(r.remaining).toBe(2);
    expect(r.resetMs).toBe(60_000);
  });

  it("autorise jusqu'à `limit` appels puis refuse", async () => {
    const key = uniqueKey();
    const r1 = await rateLimit(key, 2, 60_000);
    const r2 = await rateLimit(key, 2, 60_000);
    const r3 = await rateLimit(key, 2, 60_000);

    expect(r1.ok).toBe(true);
    expect(r1.remaining).toBe(1);
    expect(r2.ok).toBe(true);
    expect(r2.remaining).toBe(0);
    expect(r3.ok).toBe(false);
    expect(r3.remaining).toBe(0);
  });

  it("isole les compteurs par clé", async () => {
    const a = uniqueKey();
    const b = uniqueKey();
    await rateLimit(a, 1, 60_000); // épuise a
    const blockedA = await rateLimit(a, 1, 60_000);
    const freshB = await rateLimit(b, 1, 60_000);

    expect(blockedA.ok).toBe(false);
    expect(freshB.ok).toBe(true);
  });

  it("réinitialise après expiration de la fenêtre", async () => {
    const key = uniqueKey();
    await rateLimit(key, 1, 1_000); // épuise
    expect((await rateLimit(key, 1, 1_000)).ok).toBe(false);

    // Au-delà de la fenêtre, le compteur repart à zéro.
    vi.advanceTimersByTime(1_001);
    const after = await rateLimit(key, 1, 1_000);
    expect(after.ok).toBe(true);
  });

  it("resetMs décroît au fil de la fenêtre", async () => {
    const key = uniqueKey();
    await rateLimit(key, 5, 10_000);
    vi.advanceTimersByTime(3_000);
    const r = await rateLimit(key, 5, 10_000);
    expect(r.resetMs).toBeLessThanOrEqual(7_000);
    expect(r.resetMs).toBeGreaterThan(0);
  });
});

describe("retryAfterSeconds", () => {
  it("arrondit au supérieur et plancher à 1s", () => {
    expect(retryAfterSeconds(0)).toBe(1);
    expect(retryAfterSeconds(1)).toBe(1);
    expect(retryAfterSeconds(1_000)).toBe(1);
    expect(retryAfterSeconds(1_001)).toBe(2);
    expect(retryAfterSeconds(59_000)).toBe(59);
  });
});
