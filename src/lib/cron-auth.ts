// Authentification partagée des routes /api/cron/* (Vercel Cron + GitHub
// Actions). Le caller envoie `Authorization: Bearer <CRON_SECRET>`.
//
// La comparaison passe par timingSafeEqual (temps constant) : un `!==` naïf
// s'arrête au premier octet différent, ce qui laisse fuiter la position du
// premier caractère faux et ouvre une attaque par timing sur le secret.

import "server-only";
import { timingSafeEqual } from "node:crypto";

export type CronAuthResult = "ok" | "unconfigured" | "forbidden";

/**
 * Vérifie le header Authorization d'une requête cron contre CRON_SECRET.
 * Accepte le préfixe `Bearer ` (Vercel Cron) comme le jeton nu.
 *
 * - "unconfigured" : CRON_SECRET absent de l'environnement (mauvais setup).
 * - "forbidden"    : jeton absent ou différent du secret.
 */
export function checkCronAuth(req: Request): CronAuthResult {
  const expected = process.env.CRON_SECRET;
  if (!expected) return "unconfigured";

  const header = req.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : header;

  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(expected);
  // timingSafeEqual exige deux buffers de même taille. Ce pré-check ne fuit
  // que la longueur du secret, pas son contenu.
  if (providedBuf.length !== expectedBuf.length) return "forbidden";
  return timingSafeEqual(providedBuf, expectedBuf) ? "ok" : "forbidden";
}
