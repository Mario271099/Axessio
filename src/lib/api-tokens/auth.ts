// Middleware d'authentification pour les routes /api/v1/*.
//
// Valide le header `Authorization: Bearer axe_live_...`, vérifie le hash en
// DB, et retourne le contexte (org_id + scopes) ou un échec 401/403.
// Tous les checks passent par la service-role (createAdminClient) parce
// que les routes API ne sont pas authentifiées via Supabase Auth.

import "server-only";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit, retryAfterSeconds } from "@/lib/rate-limit";
import { extractBearerToken, hashApiToken, type ApiScope } from "./server";

// Quota par token : 100 requêtes / minute. Compteur global (Redis via S1.3)
// → la limite tient même réparti sur plusieurs lambdas.
export const API_RATE_LIMIT = 100;
const API_RATE_WINDOW_MS = 60_000;

export interface ApiTokenContext {
  tokenId: string;
  organizationId: string;
  scopes: ApiScope[];
  /** État du quota au moment de l'authentification (pour les headers RateLimit-*). */
  rateLimit: { limit: number; remaining: number; resetSeconds: number };
}

export interface ApiAuthSuccess {
  ok: true;
  ctx: ApiTokenContext;
}
export interface ApiAuthFailure {
  ok: false;
  response: NextResponse;
}
export type ApiAuthResult = ApiAuthSuccess | ApiAuthFailure;

function unauthorized(message: string): ApiAuthFailure {
  return {
    ok: false,
    response: NextResponse.json(
      { error: message },
      {
        status: 401,
        headers: { "WWW-Authenticate": 'Bearer realm="axessyo"' },
      },
    ),
  };
}

function forbidden(message: string): ApiAuthFailure {
  return {
    ok: false,
    response: NextResponse.json({ error: message }, { status: 403 }),
  };
}

function tooManyRequests(resetSeconds: number): ApiAuthFailure {
  return {
    ok: false,
    response: NextResponse.json(
      { error: "Rate limit exceeded" },
      {
        status: 429,
        headers: {
          "RateLimit-Limit": String(API_RATE_LIMIT),
          "RateLimit-Remaining": "0",
          "RateLimit-Reset": String(resetSeconds),
          "Retry-After": String(resetSeconds),
        },
      },
    ),
  };
}

/**
 * Headers RateLimit-* (IETF draft) à attacher aux réponses de succès d'un
 * endpoint API, à partir du contexte d'authentification.
 */
export function apiRateLimitHeaders(
  ctx: ApiTokenContext,
): Record<string, string> {
  return {
    "RateLimit-Limit": String(ctx.rateLimit.limit),
    "RateLimit-Remaining": String(ctx.rateLimit.remaining),
    "RateLimit-Reset": String(ctx.rateLimit.resetSeconds),
  };
}

/**
 * Authentifie une requête API. Si succès, le caller dispose du contexte.
 * Si échec, le caller doit retourner `result.response` tel quel.
 *
 * Usage :
 *   const auth = await authenticateApi(req);
 *   if (!auth.ok) return auth.response;
 *   // utiliser auth.ctx.organizationId, auth.ctx.scopes
 */
export async function authenticateApi(req: Request): Promise<ApiAuthResult> {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) return unauthorized("Missing or malformed Authorization header");

  const tokenHash = hashApiToken(token);
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("validate_api_token", {
    p_token_hash: tokenHash,
  });
  if (error) {
    return unauthorized("Token validation failed");
  }
  if (!Array.isArray(data) || data.length === 0) {
    return unauthorized("Invalid or expired token");
  }
  const row = data[0] as {
    token_id: string;
    organization_id: string;
    scopes: string[];
  };

  // Quota par token (après validation, avant tout traitement métier).
  const rl = await rateLimit(
    `apitoken:${row.token_id}`,
    API_RATE_LIMIT,
    API_RATE_WINDOW_MS,
  );
  if (!rl.ok) {
    return tooManyRequests(retryAfterSeconds(rl.resetMs));
  }

  // Bump usage sans bloquer la réponse (fire-and-forget).
  void admin.rpc("touch_api_token", { p_token_id: row.token_id });

  return {
    ok: true,
    ctx: {
      tokenId: row.token_id,
      organizationId: row.organization_id,
      scopes: (row.scopes ?? []) as ApiScope[],
      rateLimit: {
        limit: API_RATE_LIMIT,
        remaining: rl.remaining,
        resetSeconds: retryAfterSeconds(rl.resetMs),
      },
    },
  };
}

/** Vérifie qu'un scope précis est présent. Retourne une réponse 403 sinon. */
export function requireScope(
  ctx: ApiTokenContext,
  scope: ApiScope,
): ApiAuthResult {
  if (!ctx.scopes.includes(scope)) {
    return forbidden(`Missing scope: ${scope}`);
  }
  return { ok: true, ctx };
}
