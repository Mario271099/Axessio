// API tokens — génération, hash, validation.
//
// Conventions :
//   - Token format : `axe_<env>_<32 bytes base64url>`. Env = "live" (prod) /
//     "test" (sandbox). Pour l'instant on n'utilise que "live" — la
//     distinction sera utile plus tard pour les comptes test.
//   - Stockage : token complet jamais en clair. SHA-256 hex dans la colonne
//     `token_hash`. Préfixe public = 12 premiers caractères du token
//     (pour reconnaissance dans l'UI : "axe_live_abc1...").
//   - Comparaison : hash + lookup unique → résistant au timing attack par
//     construction (pas de boucle byte-à-byte côté code).

import "server-only";
import crypto from "node:crypto";

// ============================================================================
// Catalogue des scopes
// ============================================================================
export type ApiScope =
  | "audits:read"
  | "audits:write"
  | "nc:read"
  | "nc:write"
  | "webhooks:read";

export const API_SCOPES: ReadonlyArray<ApiScope> = [
  "audits:read",
  "audits:write",
  "nc:read",
  "nc:write",
  "webhooks:read",
];

// ============================================================================
// Génération
// ============================================================================
export interface GeneratedToken {
  /** Le token complet à montrer à l'utilisateur (UNE seule fois). */
  plaintext: string;
  /** Préfixe public à stocker pour identification. */
  prefix: string;
  /** SHA-256 hex à stocker en DB. */
  hash: string;
}

export function generateApiToken(env: "live" | "test" = "live"): GeneratedToken {
  const random = crypto.randomBytes(32).toString("base64url");
  const plaintext = `axe_${env}_${random}`;
  return {
    plaintext,
    prefix: plaintext.slice(0, 12),
    hash: hashApiToken(plaintext),
  };
}

export function hashApiToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// ============================================================================
// Parsing du header Authorization
// ============================================================================

/**
 * Extrait le token brut depuis un header HTTP `Authorization: Bearer ...`.
 * Retourne null si le header est manquant ou mal formé. Le caller doit
 * traiter null comme "401 Unauthorized".
 */
export function extractBearerToken(authorizationHeader: string | null): string | null {
  if (!authorizationHeader) return null;
  const match = /^Bearer\s+(\S+)$/i.exec(authorizationHeader.trim());
  return match?.[1] ?? null;
}
