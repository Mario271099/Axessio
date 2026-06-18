// Endpoint API v1 - exemple d'utilisation des tokens scoped.
//
// GET /api/v1/audits?limit=50
//   Headers : Authorization: Bearer axe_live_...
//   Scope requis : audits:read
//
// Réponse : { data: Audit[], pagination: { ... } }
//
// Cet endpoint sert de référence pour les futures routes /api/v1/*. La même
// recette s'applique : authenticateApi → requireScope → service-role
// scopée à ctx.organizationId.

import { NextResponse } from "next/server";
import {
  authenticateApi,
  requireScope,
  apiRateLimitHeaders,
} from "@/lib/api-tokens/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export async function GET(req: Request) {
  // 1) Auth Bearer
  const auth = await authenticateApi(req);
  if (!auth.ok) return auth.response;

  const scoped = requireScope(auth.ctx, "audits:read");
  if (!scoped.ok) return scoped.response;

  // 2) Parse query
  const url = new URL(req.url);
  const limitRaw = Number.parseInt(url.searchParams.get("limit") ?? "", 10);
  const limit = Number.isFinite(limitRaw)
    ? Math.max(1, Math.min(MAX_LIMIT, limitRaw))
    : DEFAULT_LIMIT;
  const cursor = url.searchParams.get("cursor"); // ISO date

  // 3) Lecture scopée à l'organisation du token (service-role bypasse RLS,
  //    mais on filtre explicitement par organization_id : c'est notre
  //    seconde ligne de défense).
  const admin = createAdminClient();
  let query = admin
    .from("audits")
    .select(
      "id, project_id, reference_id, service_type, platform, status, language, expected_start_at, expected_end_at, delivered_at, initial_score, final_score, created_at, updated_at",
    )
    .eq("organization_id", auth.ctx.organizationId)
    .order("created_at", { ascending: false })
    .limit(limit + 1); // +1 pour détecter has_more

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const headers = apiRateLimitHeaders(auth.ctx);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers },
    );
  }

  const rows = data ?? [];
  const hasMore = rows.length > limit;
  const slice = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? slice[slice.length - 1]?.created_at : null;

  return NextResponse.json(
    {
      data: slice,
      pagination: {
        limit,
        has_more: hasMore,
        next_cursor: nextCursor,
      },
    },
    { headers },
  );
}
