import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Normalise le paramètre `next` en chemin interne sûr (anti open-redirect).
 * Toute valeur invalide retombe sur `/dashboard`.
 */
function safeNext(raw: string | null): string {
  if (!raw) return "/dashboard";
  if (!raw.startsWith("/")) return "/dashboard";
  if (raw.startsWith("//") || raw.startsWith("/\\")) return "/dashboard";
  return raw;
}

/**
 * Confirmation des liens email (recovery / signup / magic link / email change).
 *
 * Méthode officielle Supabase pour @supabase/ssr : le template d'email pointe
 * ici avec `token_hash` + `type`, on échange le jeton via `verifyOtp` côté
 * serveur, ce qui pose la session dans les cookies SSR puis redirige vers
 * `next` (ex. /reset-password) où l'utilisateur définit son mot de passe.
 *
 * Avantages vs `{{ .ConfirmationURL }}` :
 *  - fonctionne en cross-device (pas de code-verifier PKCE lié au navigateur)
 *  - établit une vraie session SSR lisible par les Server Components
 *
 * En cas d'échec (jeton expiré, déjà utilisé, invalide) → /reset-password sans
 * session, qui affiche l'écran « lien expiré » avec un lien pour en redemander.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(searchParams.get("next"));

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/reset-password?error=expired`);
}
