// Client Supabase service-role pour le NETTOYAGE des donnees de test E2E.
//
// Les tests qui creent des audits (audit-flow, verify-create-flow) supprimeraient
// sinon le quota du plan (max_active_audits / max_audits_per_month). On nettoie
// donc en afterAll. Les FK vers `audits` sont ON DELETE CASCADE (pages, NC,
// conformites...) et `clients` cascade vers projects -> audits : une suppression
// de client/audit efface tout le contenu rattache.
//
// Necessite SUPABASE_SERVICE_ROLE_KEY (jamais expose au navigateur) :
//   - en local : .env.test.local
//   - en CI    : secret GitHub, injecte dans e2e.yml
// Sans la cle, les helpers sont des no-op (les tests passent, le nettoyage est
// juste saute) pour ne pas casser un environnement qui ne l'a pas configuree.

import path from "node:path";
import { config } from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Playwright ne propage pas toujours aux workers les variables chargees par le
// dotenv de playwright.config.ts. On (re)charge ici, de maniere idempotente,
// pour garantir l'acces a SUPABASE_SERVICE_ROLE_KEY au moment du nettoyage.
config({ path: path.resolve(process.cwd(), ".env.test.local") });
config({ path: path.resolve(process.cwd(), ".env.local") });

// Lu a l'appel (et non au chargement du module) : l'env peut etre complete
// apres l'import.
function url(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL;
}
function serviceKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export function hasAdminClient(): boolean {
  return Boolean(url() && serviceKey());
}

let cached: SupabaseClient | null = null;

function admin(): SupabaseClient {
  const u = url();
  const k = serviceKey();
  if (!u || !k) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY requis pour le nettoyage E2E.");
  }
  cached ??= createClient(u, k, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

let warned = false;
function warnSkipped(): void {
  if (warned) return;
  warned = true;
  console.warn(
    "[e2e cleanup] SUPABASE_SERVICE_ROLE_KEY absent - nettoyage des donnees " +
      "de test saute. Le quota du plan finira par saturer.",
  );
}

/** Supprime un audit par id (cascade pages/conformites/NC). No-op sans cle. */
export async function deleteAuditById(id: string): Promise<void> {
  if (!hasAdminClient()) return warnSkipped();
  await admin().from("audits").delete().eq("id", id);
}

/** Supprime un client par nom exact (cascade projets -> audits). No-op sans cle. */
export async function deleteClientByName(name: string): Promise<void> {
  if (!hasAdminClient()) return warnSkipped();
  await admin().from("clients").delete().eq("name", name);
}

/**
 * Purge large par prefixe — filet de securite / nettoyage ponctuel des donnees
 * laissees par d'anciens runs. Renvoie le nombre de lignes supprimees.
 */
export async function purgeTestData(): Promise<{
  audits: number;
  clients: number;
}> {
  if (!hasAdminClient()) return { audits: 0, clients: 0 };
  const db = admin();

  // Audits crees par audit-flow ("Site E2E") et verify-create-flow ("Verify
  // Site ..."). Ceux rattaches a un "Verify Client" partiront aussi via la
  // cascade du client ci-dessous, mais on les vise ici aussi (idempotent).
  const { data: a1 } = await db
    .from("audits")
    .delete()
    .like("site_name", "Site E2E%")
    .select("id");
  const { data: a2 } = await db
    .from("audits")
    .delete()
    .like("site_name", "Verify Site%")
    .select("id");

  // Clients de verify-create-flow (cascade projets + audits restants).
  const { data: c } = await db
    .from("clients")
    .delete()
    .like("name", "Verify Client%")
    .select("id");

  return {
    audits: (a1?.length ?? 0) + (a2?.length ?? 0),
    clients: c?.length ?? 0,
  };
}
