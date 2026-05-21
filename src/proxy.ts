import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Convention Next 16 : fichier renommé de `middleware.ts` en `proxy.ts`.
// La fonction exportée doit s'appeler `proxy` pour ne pas redéclencher le
// warning "middleware" file convention is deprecated.
export async function proxy(request: NextRequest) {
  return updateSession(request);
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
