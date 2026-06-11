import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { LOCALE_COOKIE, detectLocaleFromHeader } from "@/i18n/config";

// Convention Next 16 : fichier renommé de `middleware.ts` en `proxy.ts`.
// La fonction exportée doit s'appeler `proxy` pour ne pas redéclencher le
// warning "middleware" file convention is deprecated.
export async function proxy(request: NextRequest) {
  const response = await updateSession(request);

  // Premier chargement sans cookie de langue : on détecte la préférence du
  // navigateur (Accept-Language) au lieu d'imposer le français. Le cookie posé
  // ici est ensuite la source de vérité — un choix explicite via le
  // LanguageToggle le remplace et n'est jamais écrasé.
  if (!request.cookies.get(LOCALE_COOKIE)) {
    response.cookies.set(
      LOCALE_COOKIE,
      detectLocaleFromHeader(request.headers.get("accept-language")),
      { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" },
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Tout sauf :
     * - les fichiers statiques (_next/static, _next/image, favicon, etc)
     * - les ressources publiques
     */
    "/((?!_next/static|_next/image|favicon.ico|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
