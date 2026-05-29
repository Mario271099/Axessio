// Journalise un échec de connexion. Appelé par le formulaire de login
// (fire-and-forget) quand signInWithPassword renvoie une erreur. Sépare les
// échecs des tentatives pour que l'admin puisse repérer un ciblage (beaucoup
// de login.failed sur un même email/IP).
//
// Pas de rate-limit ici : le throttling est porté par /login-attempt, qui est
// appelé en amont de chaque connexion.

import { NextResponse } from "next/server";
import { clientIp, sanitizeLoginEmail, logLoginEvent } from "@/lib/login-audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = clientIp(req);
  const userAgent = req.headers.get("user-agent");

  let email: string | null = null;
  try {
    const body = (await req.json()) as { email?: unknown };
    email = sanitizeLoginEmail(body?.email);
  } catch {
    // corps optionnel / malformé.
  }

  await logLoginEvent("login.failed", { email, ip, userAgent });
  return NextResponse.json({ ok: true });
}
