// Garde anti-brute-force appelée par le formulaire de login AVANT
// signInWithPassword. Rate-limite par IP et journalise la tentative.
//
//   - Sous la limite  → 200 { ok: true }, le client poursuit la connexion.
//   - Au-delà         → 429 { ok: false, retryAfter }, le client bloque.
//
// Le login restant côté client (Supabase Auth), c'est notre seul point de
// contrôle serveur sur le volume de tentatives.

import { NextResponse } from "next/server";
import { rateLimit, retryAfterSeconds } from "@/lib/rate-limit";
import { clientIp, sanitizeLoginEmail, logLoginEvent } from "@/lib/login-audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 10 tentatives / 5 min / IP : assez large pour ne pas gêner un humain qui se
// trompe, assez serré pour freiner un script qui boucle.
const LOGIN_LIMIT = 10;
const LOGIN_WINDOW_MS = 5 * 60_000;

export async function POST(req: Request) {
  const ip = clientIp(req);
  const userAgent = req.headers.get("user-agent");

  let email: string | null = null;
  try {
    const body = (await req.json()) as { email?: unknown };
    email = sanitizeLoginEmail(body?.email);
  } catch {
    // corps optionnel / malformé : on rate-limite quand même par IP.
  }

  const limit = await rateLimit(`login:${ip}`, LOGIN_LIMIT, LOGIN_WINDOW_MS);

  if (!limit.ok) {
    // Bloqué : on ne journalise PAS chaque tentative au-delà de la limite
    // (sinon un attaquant pourrait gonfler audit_logs en bouclant). Le 429 +
    // le compteur Redis suffisent comme signal.
    const retryAfter = retryAfterSeconds(limit.resetMs);
    return NextResponse.json(
      { ok: false, retryAfter },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  await logLoginEvent("login.attempt", { email, ip, userAgent });
  return NextResponse.json({ ok: true });
}
