import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  generateWebhookSecret,
  MAX_ATTEMPTS,
  nextAttemptDelaySec,
  signWebhookPayload,
  WEBHOOK_EVENTS,
} from "./server";

// ============================================================================
// Catalogue d'événements
// ============================================================================
describe("WEBHOOK_EVENTS catalogue", () => {
  it("contient les 4 événements émis par les triggers SQL", () => {
    expect(new Set(WEBHOOK_EVENTS)).toEqual(
      new Set([
        "nc.created",
        "nc.status_changed",
        "audit.status_changed",
        "audit.delivered",
      ]),
    );
  });
});

// ============================================================================
// nextAttemptDelaySec — back-off exponentiel borné
// ============================================================================
describe("nextAttemptDelaySec", () => {
  it("démarre à 60s après la première tentative", () => {
    expect(nextAttemptDelaySec(0)).toBe(60);
  });

  it("monte progressivement (60s → 300s → 1800s → 7200s → 21600s)", () => {
    const expected = [60, 300, 1800, 7200, 21600];
    for (let i = 0; i < expected.length; i++) {
      expect(nextAttemptDelaySec(i)).toBe(expected[i]);
    }
  });

  it("est borné à 21600s (6h) au-delà de la 5e tentative", () => {
    expect(nextAttemptDelaySec(6)).toBe(21600);
    expect(nextAttemptDelaySec(100)).toBe(21600);
  });

  it("MAX_ATTEMPTS est configuré à 5", () => {
    expect(MAX_ATTEMPTS).toBe(5);
  });
});

// ============================================================================
// signWebhookPayload — HMAC SHA-256 format Stripe
// ============================================================================
describe("signWebhookPayload", () => {
  const SECRET = "whsec_test_secret_for_unit_tests";
  const BODY = '{"event":"audit.delivered","id":"abc-123"}';

  it("produit un header de la forme t=<unix>,v1=<64 hex chars>", () => {
    const header = signWebhookPayload(BODY, SECRET, 1716_810_000);
    expect(header).toMatch(/^t=1716810000,v1=[0-9a-f]{64}$/);
  });

  it("la signature v1 est bien le HMAC-SHA256(secret, '<t>.<body>')", () => {
    const timestamp = 1716_810_000;
    const header = signWebhookPayload(BODY, SECRET, timestamp);
    const v1Match = /v1=([0-9a-f]+)$/.exec(header);
    const v1 = v1Match?.[1];

    const expected = crypto
      .createHmac("sha256", SECRET)
      .update(`${timestamp}.${BODY}`)
      .digest("hex");
    expect(v1).toBe(expected);
  });

  it("change si le body change (un seul bit suffit)", () => {
    const ts = 1716_810_000;
    const a = signWebhookPayload(BODY, SECRET, ts);
    const b = signWebhookPayload(BODY + "x", SECRET, ts);
    expect(a).not.toBe(b);
  });

  it("change si le secret change", () => {
    const ts = 1716_810_000;
    const a = signWebhookPayload(BODY, SECRET, ts);
    const b = signWebhookPayload(BODY, SECRET + "x", ts);
    expect(a).not.toBe(b);
  });

  it("change si le timestamp change", () => {
    const a = signWebhookPayload(BODY, SECRET, 1000);
    const b = signWebhookPayload(BODY, SECRET, 2000);
    expect(a).not.toBe(b);
  });

  it("utilise Date.now() par défaut quand le timestamp n'est pas fourni", () => {
    const header = signWebhookPayload(BODY, SECRET);
    const match = /^t=(\d+),v1=/.exec(header);
    const t = Number(match?.[1]);
    const now = Math.floor(Date.now() / 1000);
    expect(t).toBeGreaterThanOrEqual(now - 5);
    expect(t).toBeLessThanOrEqual(now + 5);
  });
});

// ============================================================================
// generateWebhookSecret
// ============================================================================
describe("generateWebhookSecret", () => {
  it("commence par le préfixe whsec_", () => {
    const secret = generateWebhookSecret();
    expect(secret).toMatch(/^whsec_/);
  });

  it("contient au moins 40 caractères (32 bytes base64url ≈ 43 chars)", () => {
    const secret = generateWebhookSecret();
    expect(secret.length).toBeGreaterThanOrEqual(40);
  });

  it("est URL-safe (base64url : pas de +, /, =)", () => {
    const secret = generateWebhookSecret();
    expect(secret).toMatch(/^whsec_[A-Za-z0-9_-]+$/);
  });

  it("génère une valeur unique à chaque appel (collisions hautement improbables)", () => {
    const a = generateWebhookSecret();
    const b = generateWebhookSecret();
    expect(a).not.toBe(b);
  });
});
