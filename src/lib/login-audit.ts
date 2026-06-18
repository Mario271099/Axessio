// Helpers partagés par les routes /api/auth/login-attempt et login-failed.
//
// Objectif : tracer et freiner le brute-force sur le login. Le login lui-même
// reste côté client (signInWithPassword) - ces endpoints ajoutent une couche
// serveur Axessyo : rate-limit par IP + journalisation dans audit_logs.
//
// audit_logs est en RLS SELECT-only → l'insert DOIT passer par la service-role
// (createAdminClient). Ces routes sont de toute façon non authentifiées
// (aucune session au moment du login).

import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Extrait l'IP cliente. Sur Vercel, `x-forwarded-for` contient la chaîne des
 * proxies ; la première entrée est l'IP d'origine. Fallback `x-real-ip` puis
 * "unknown" (dev local sans proxy → tout le monde partage un bucket, sans
 * conséquence en dev).
 */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Normalise l'email fourni par le client. On borne la longueur (254 = max
 * RFC 5321) pour empêcher un attaquant de gonfler les logs avec des chaînes
 * énormes. Retourne null si vide/absent.
 */
export function sanitizeLoginEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const e = raw.trim().toLowerCase().slice(0, 254);
  return e.length > 0 ? e : null;
}

export type LoginAuditAction = "login.attempt" | "login.failed";

/**
 * Journalise un évènement de login dans audit_logs (best-effort : ne jette
 * jamais). `actor_id` reste null - au moment du login on ne connaît que
 * l'email saisi, pas l'identité authentifiée.
 */
export async function logLoginEvent(
  action: LoginAuditAction,
  data: { email: string | null; ip: string; userAgent: string | null; blocked?: boolean },
): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("audit_logs").insert({
      action,
      payload: {
        email: data.email,
        ip: data.ip,
        user_agent: data.userAgent?.slice(0, 300) ?? null,
        ...(data.blocked !== undefined ? { blocked: data.blocked } : {}),
      },
    });
  } catch {
    // best-effort : un échec de log ne doit pas casser le flow de login.
  }
}
