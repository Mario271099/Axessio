import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Client Supabase pour Server Components, Server Actions et Route Handlers.
 *
 * Note : `cookies()` est un proxy d'I/O, il faut donc l'`await` à chaque appel.
 * Ce client lit/écrit les cookies de session pour permettre à RLS d'identifier
 * l'utilisateur courant via `auth.uid()`.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll a été appelé depuis un Server Component (lecture seule).
            // Ignoré : le middleware rafraîchira la session.
          }
        },
      },
    },
  );
}
