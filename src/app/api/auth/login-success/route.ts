// Journalise une connexion réussie. Appelée par le formulaire de login juste
// après signInWithPassword (fire-and-forget, keepalive).
//
// Contrairement à login-attempt/login-failed (anonymes), cette route EXIGE une
// session valide : l'événement `login.success` porte donc un actor_id fiable
// — c'est lui qui alimente la carte « Connexions récentes » des Settings.
// Impossible à forger sans être réellement connecté.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/login-audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  // Garde anti-flood : un user légitime ne se connecte pas 5 fois par minute.
  // Au-delà, on répond ok sans logger (pas de quoi gonfler audit_logs).
  const limit = await rateLimit(`login-success:${user.id}`, 5, 60_000);
  if (!limit.ok) {
    return NextResponse.json({ ok: true });
  }

  try {
    // audit_logs est en RLS SELECT-only → insert via service-role.
    const admin = createAdminClient();
    await admin.from("audit_logs").insert({
      actor_id: user.id,
      action: "login.success",
      payload: {
        ip: clientIp(req),
        user_agent: req.headers.get("user-agent")?.slice(0, 300) ?? null,
      },
    });
  } catch {
    // best-effort : un échec de log ne doit pas perturber la connexion.
  }

  return NextResponse.json({ ok: true });
}
