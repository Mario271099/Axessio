// Middleware d'authentification pour les routes /api/v1/*.
//
// Valide le header `Authorization: Bearer axe_live_...`, vérifie le hash en
// DB, et retourne le contexte (org_id + scopes) ou un échec 401/403.
// Tous les checks passent par la service-role (createAdminClient) parce
// que les routes API ne sont pas authentifiées via Supabase Auth.

import "server-only";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractBearerToken, hashApiToken, type ApiScope } from "./server";

export interface ApiTokenContext {
  tokenId: string;
  organizationId: string;
  scopes: ApiScope[];
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
        headers: { "WWW-Authenticate": 'Bearer realm="axessio"' },
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

  // Bump usage sans bloquer la réponse (fire-and-forget).
  void admin.rpc("touch_api_token", { p_token_id: row.token_id });

  return {
    ok: true,
    ctx: {
      tokenId: row.token_id,
      organizationId: row.organization_id,
      scopes: (row.scopes ?? []) as ApiScope[],
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
