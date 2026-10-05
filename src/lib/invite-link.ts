// Liens d'email d'invitation / de connexion envoyés par l'app (Resend).
//
// On n'utilise PAS `properties.action_link` de `generateLink` : il passe par
// /auth/v1/verify puis renvoie les jetons dans le fragment d'URL vers
// `redirectTo`, flux implicite incompatible avec @supabase/ssr (et la page
// `/auth/callback` visée historiquement n'existe pas → 404). Comme pour le
// reset de mot de passe, on pointe sur `/api/auth/confirm` avec le
// `hashed_token` : `verifyOtp` côté serveur pose la session SSR puis
// redirige vers `next`. Fonctionne aussi en cross-device.

import "server-only";

function appBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return base.replace(/\/$/, "");
}

function confirmUrl(
  hashedToken: string,
  type: "invite" | "magiclink",
  next: string,
): string {
  const params = new URLSearchParams({ token_hash: hashedToken, type, next });
  return `${appBaseUrl()}/api/auth/confirm?${params.toString()}`;
}

/**
 * Nouveau compte : session ouverte, puis choix du mot de passe sur
 * `/setup-password`, puis redirection vers `afterSetup` (chemin interne).
 */
export function buildInviteUrl(hashedToken: string, afterSetup = "/dashboard"): string {
  const next = `/setup-password?${new URLSearchParams({ next: afterSetup }).toString()}`;
  return confirmUrl(hashedToken, "invite", next);
}

/** Compte existant : connexion directe puis redirection vers `next`. */
export function buildMagicLinkUrl(hashedToken: string, next = "/dashboard"): string {
  return confirmUrl(hashedToken, "magiclink", next);
}
