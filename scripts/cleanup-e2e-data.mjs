// Nettoyage ponctuel des donnees laissees par les tests E2E (audits "Site E2E"
// et "Verify Site ...", clients "Verify Client ..."). A lancer quand le quota
// d'audits actifs est sature par d'anciens runs :
//
//   node scripts/cleanup-e2e-data.mjs
//
// Lit SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL depuis .env.local
// (ou l'environnement). Les FK ON DELETE CASCADE effacent pages/NC/projets lies.

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });
config({ path: ".env.test.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis (.env.local).",
  );
  process.exit(1);
}

const db = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

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
const { data: c } = await db
  .from("clients")
  .delete()
  .like("name", "Verify Client%")
  .select("id");

console.log(
  `Nettoyage E2E : ${(a1?.length ?? 0) + (a2?.length ?? 0)} audit(s) + ${
    c?.length ?? 0
  } client(s) supprime(s).`,
);
