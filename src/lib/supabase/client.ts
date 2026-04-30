import { createBrowserClient } from "@supabase/ssr";

/**
 * Client Supabase pour les Client Components.
 * Utilise le cookie de session géré par `@supabase/ssr`.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
