import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Normalise le paramètre `next` en chemin interne sûr. On n'accepte qu'un
 * chemin relatif à la racine (`/...`) et on rejette tout ce qui pourrait
 * provoquer une redirection ouverte :
 *   - URL absolue (`https://evil.com`)
 *   - chemin protocole-relatif (`//evil.com`)
 *   - astuce backslash (`/\evil.com`) que les navigateurs traitent comme `//`
 *   - userinfo (`/@evil.com` ne pose pas de souci seul, mais on reste strict)
 * Toute valeur invalide retombe sur `/dashboard`.
 */
function safeNext(raw: string | null): string {
  if (!raw) return "/dashboard";
  if (!raw.startsWith("/")) return "/dashboard";
  if (raw.startsWith("//") || raw.startsWith("/\\")) return "/dashboard";
  return raw;
}

/**
 * Callback OAuth / magic link.
 * Échange le code contre une session puis redirige vers la home (ou ?next=).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
