import { createBrowserClient } from "@supabase/ssr";
import { STORAGE_KEY } from "./storage-key";

let client: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Client Supabase pour les Client Components.
 * Singleton + cookie storage explicite pour qu'on ait LE MÊME cookie
 * que celui que voit le middleware côté serveur.
 */
export function createClient() {
  if (client) return client;
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        name: STORAGE_KEY,
        sameSite: "lax",
        secure: false, // true en prod (HTTPS), false en local
        path: "/",
      },
    },
  );
  return client;
}
