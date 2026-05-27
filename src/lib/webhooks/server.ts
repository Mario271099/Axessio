// Helpers serveur pour les webhooks sortants. Couvre :
//   - signature HMAC SHA-256 d'un payload
//   - calcul du back-off exponentiel
//   - constantes partagées (catalogue d'événements, limites retry)
//
// La logique CRUD (création/suppression d'endpoints) reste dans les server
// actions de la page UI — ce module n'expose que les utilitaires bas niveau.

import "server-only";
import crypto from "node:crypto";

// ============================================================================
// Catalogue d'événements émis (doit rester aligné avec les triggers SQL
// de la migration 57).
// ============================================================================
export type WebhookEventType =
  | "nc.created"
  | "nc.status_changed"
  | "audit.status_changed"
  | "audit.delivered";

export const WEBHOOK_EVENTS: ReadonlyArray<WebhookEventType> = [
  "nc.created",
  "nc.status_changed",
  "audit.status_changed",
  "audit.delivered",
];

// ============================================================================
// Retry policy
// ============================================================================
export const MAX_ATTEMPTS = 5;

/**
 * Délai avant la prochaine tentative, en secondes. Back-off exponentiel
 * borné : 0, 60s, 300s, 1800s, 7200s.
 *
 * `attemptCount` = nombre de tentatives DÉJÀ effectuées (commence à 0).
 */
export function nextAttemptDelaySec(attemptCount: number): number {
  const schedule = [60, 300, 1800, 7200, 21600];
  return schedule[Math.min(attemptCount, schedule.length - 1)] ?? 21600;
}

// ============================================================================
// HMAC signature
// ============================================================================

/**
 * Signe le payload avec le secret de l'endpoint en HMAC-SHA256.
 *
 * Format de l'en-tête retourné : "t=<unix>,v1=<hex>" (inspiré Stripe).
 * Le t= empêche le rejouage en permettant à l'abonné de vérifier la
 * fraîcheur (rejeter si > 5 min, par exemple).
 */
export function signWebhookPayload(
  rawBody: string,
  secret: string,
  timestamp = Math.floor(Date.now() / 1000),
): string {
  const toSign = `${timestamp}.${rawBody}`;
  const sig = crypto
    .createHmac("sha256", secret)
    .update(toSign)
    .digest("hex");
  return `t=${timestamp},v1=${sig}`;
}

/**
 * Génère un secret aléatoire à présenter à l'abonné. 32 bytes = 256 bits
 * d'entropie, encodé en base64url pour rester URL-safe.
 */
export function generateWebhookSecret(): string {
  return `whsec_${crypto.randomBytes(32).toString("base64url")}`;
}
