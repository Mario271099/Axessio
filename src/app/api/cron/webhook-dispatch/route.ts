import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  MAX_ATTEMPTS,
  nextAttemptDelaySec,
  signWebhookPayload,
} from "@/lib/webhooks/server";
import { assertPublicUrl } from "@/lib/webhooks/ssrf";

// Cron de dispatch des webhooks sortants. Tourne fréquemment (every minute)
// pour rester réactif. À chaque tick :
//
//   1) Pop jusqu'à BATCH_SIZE deliveries pending/retry dont next_attempt_at <= now
//   2) Pour chaque : POST le payload signé HMAC à l'endpoint
//   3) Selon le retour HTTP :
//        - 2xx           → status='success', delivered_at=now
//        - 4xx (sauf 429)→ status='failed' (erreur permanente, on n'insiste pas)
//        - 5xx, 429, net → status='retry', next_attempt_at programmé en back-off
//   4) Si attempt_count >= MAX_ATTEMPTS → status='failed' définitivement
//
// Auth : Authorization: Bearer <CRON_SECRET> (injecté par Vercel Cron).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BATCH_SIZE = 25;
const REQUEST_TIMEOUT_MS = 10_000;

interface DeliveryRow {
  id: string;
  endpoint_id: string;
  organization_id: string;
  event_type: string;
  payload: unknown;
  attempt_count: number;
  status: string;
}

interface EndpointRow {
  id: string;
  url: string;
  secret: string;
  is_active: boolean;
  consecutive_failures: number;
}

export async function GET(req: Request) {
  // 1) Auth
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "CRON_SECRET non configuré." },
      { status: 503 },
    );
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();

  // 2) Pop la queue. On lit en LIMIT BATCH_SIZE et on ne se soucie pas d'un
  // verrou explicite (FOR UPDATE SKIP LOCKED non exposé par PostgREST) : si
  // deux dispatchers tournent en parallèle, ils traiteront éventuellement la
  // même delivery deux fois — le pire cas est un double POST, l'abonné doit
  // déduper sur le delivery_id (envoyé en header).
  const nowIso = new Date().toISOString();
  const { data: deliveries, error: queueError } = await admin
    .from("webhook_deliveries")
    .select(
      "id, endpoint_id, organization_id, event_type, payload, attempt_count, status",
    )
    .in("status", ["pending", "retry"])
    .lte("next_attempt_at", nowIso)
    .order("next_attempt_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (queueError) {
    return NextResponse.json({ error: queueError.message }, { status: 500 });
  }

  const rows = (deliveries ?? []) as DeliveryRow[];
  if (rows.length === 0) {
    return NextResponse.json({ processed: 0 });
  }

  // 3) Préchargement des endpoints (jointure manuelle pour limiter les
  // round-trips dans la boucle ci-dessous).
  const endpointIds = Array.from(new Set(rows.map((r) => r.endpoint_id)));
  const { data: endpoints } = await admin
    .from("webhook_endpoints")
    .select("id, url, secret, is_active, consecutive_failures")
    .in("id", endpointIds);
  const endpointMap = new Map<string, EndpointRow>(
    (endpoints ?? []).map((e) => [e.id, e as EndpointRow]),
  );

  // 4) Dispatch séquentiel. On évite Promise.all pour ne pas saturer un
  // endpoint qui aurait plusieurs deliveries en attente.
  const results: Array<{ id: string; status: string; http?: number }> = [];

  for (const delivery of rows) {
    const endpoint = endpointMap.get(delivery.endpoint_id);
    if (!endpoint || !endpoint.is_active) {
      await admin
        .from("webhook_deliveries")
        .update({
          status: "failed",
          error_message: "Endpoint disabled or missing",
        })
        .eq("id", delivery.id);
      results.push({ id: delivery.id, status: "failed" });
      continue;
    }

    const attemptCount = delivery.attempt_count + 1;
    const rawBody = JSON.stringify({
      id: delivery.id,
      event: delivery.event_type,
      created_at: nowIso,
      organization_id: delivery.organization_id,
      data: delivery.payload,
    });
    const signature = signWebhookPayload(rawBody, endpoint.secret);

    let httpStatus: number | undefined;
    let responseExcerpt = "";
    let errorMessage: string | null = null;

    // Recheck SSRF juste avant l'envoi : un endpoint validé à la création peut
    // depuis avoir migré son DNS vers une IP privée (DNS rebinding). On bloque
    // ici aussi pour fermer la fenêtre.
    const ssrf = await assertPublicUrl(endpoint.url);
    if (!ssrf.ok) {
      errorMessage = `SSRF blocked: ${ssrf.reason} (${ssrf.detail})`;
    } else {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        const response = await fetch(endpoint.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "Axessio-Webhooks/1.0",
            "X-Axessio-Event": delivery.event_type,
            "X-Axessio-Delivery": delivery.id,
            "X-Axessio-Signature": signature,
          },
          body: rawBody,
          signal: controller.signal,
          // Pas de follow : un endpoint public ne doit pas pouvoir rediriger
          // vers une cible privée. Toute 3xx sera comptée comme failure ci-dessous.
          redirect: "manual",
        });
        clearTimeout(timer);
        httpStatus = response.status;
        // On lit un extrait court pour le debug, on ne stocke pas la réponse
        // intégrale (le serveur abonné peut renvoyer du contenu volumineux).
        responseExcerpt = (await response.text()).slice(0, 1024);
      } catch (err) {
        errorMessage =
          err instanceof Error ? err.message : "Network error";
      }
    }

    const isSuccess =
      typeof httpStatus === "number" && httpStatus >= 200 && httpStatus < 300;
    // 3xx : avec redirect=manual, fetch renvoie le statut sans suivre.
    // On le traite comme une erreur permanente (endpoint mal configuré).
    const isRedirect =
      typeof httpStatus === "number" && httpStatus >= 300 && httpStatus < 400;
    const isPermanentFailure =
      isRedirect ||
      (typeof httpStatus === "number" &&
        httpStatus >= 400 &&
        httpStatus < 500 &&
        httpStatus !== 429) ||
      // SSRF block = échec permanent : l'URL ne sera jamais valide.
      (!ssrf.ok);

    let nextStatus: "success" | "retry" | "failed";
    let nextAttemptAt: string | null = null;

    if (isSuccess) {
      nextStatus = "success";
    } else if (isPermanentFailure || attemptCount >= MAX_ATTEMPTS) {
      nextStatus = "failed";
    } else {
      nextStatus = "retry";
      const delay = nextAttemptDelaySec(delivery.attempt_count);
      nextAttemptAt = new Date(Date.now() + delay * 1000).toISOString();
    }

    await admin
      .from("webhook_deliveries")
      .update({
        status: nextStatus,
        attempt_count: attemptCount,
        http_status: httpStatus ?? null,
        response_excerpt: responseExcerpt || null,
        error_message: errorMessage,
        delivered_at: isSuccess ? new Date().toISOString() : null,
        next_attempt_at: nextAttemptAt ?? new Date().toISOString(),
      })
      .eq("id", delivery.id);

    // Maj des compteurs côté endpoint.
    if (isSuccess) {
      await admin
        .from("webhook_endpoints")
        .update({
          last_delivery_at: new Date().toISOString(),
          last_success_at: new Date().toISOString(),
          consecutive_failures: 0,
        })
        .eq("id", endpoint.id);
    } else if (nextStatus !== "retry") {
      await admin
        .from("webhook_endpoints")
        .update({
          last_delivery_at: new Date().toISOString(),
          last_failure_at: new Date().toISOString(),
          consecutive_failures: endpoint.consecutive_failures + 1,
        })
        .eq("id", endpoint.id);
    }

    results.push({ id: delivery.id, status: nextStatus, http: httpStatus });
  }

  return NextResponse.json({ processed: results.length, results });
}
