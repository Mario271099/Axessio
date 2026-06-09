// Génère la migration 82 : peuple `criteria.test_procedures` pour WCAG 2.2
// (référentiel 33333333-…) à partir des sources extraites de BDD_WCAG.xlsx.
//
// Contrairement aux référentiels francophones (RGAA/RAWeb/RAAM) dont la valeur
// est une simple chaîne FR, WCAG est **bilingue** : chaque technique vaut
// { en, fr } (fr omis tant que non traduit → l'UI retombe sur en).
//
//   test_procedures = { "G94": { "en": "...", "fr": "..." }, "ARIA6": {...} }
//
// Source de vérité résumable :
//   - scripts/wcag/wcag-techniques.json    (code -> { url, en, fr })
//   - scripts/wcag/criteria-techniques.json (critère -> [codes])
//
// Relancer après chaque lot de traduction : node scripts/wcag/gen-wcag-migration.mjs
import { readFileSync, writeFileSync } from "node:fs";

const WCAG_REF = "33333333-3333-3333-3333-333333333333";

const here = (p) => new URL(p, import.meta.url);
const techniques = JSON.parse(readFileSync(here("./wcag-techniques.json")));
const mapping = JSON.parse(readFileSync(here("./criteria-techniques.json")));
// Critères WCAG non couverts par le fichier de techniques : on stocke leur
// « Intent » officiel (bilingue, clé = identifiant du critère) pour que l'UI
// affiche un contenu FR au lieu de retomber sur la méthodologie EN.
const intent = JSON.parse(readFileSync(here("./wcag-intent.json")));

const sqlEscape = (s) => s.replace(/'/g, "''");

let translated = 0;
let total = 0;

let body = "";
for (const crit of Object.keys(mapping)) {
  const obj = {};
  for (const code of mapping[crit]) {
    const tech = techniques[code];
    if (!tech) continue;
    total++;
    const entry = { en: tech.en };
    if (tech.fr && tech.fr.trim()) {
      entry.fr = tech.fr;
      translated++;
    }
    obj[code] = entry;
  }
  const json = JSON.stringify(obj);
  body += `update public.criteria set test_procedures = '${sqlEscape(json)}'::jsonb\n`;
  body += `where identifier = '${crit}' and thematic_id in (select id from public.thematics where reference_id = '${WCAG_REF}');\n\n`;
}

// Critères sans techniques : entrée unique au niveau critère (clé = identifiant)
// avec l'« Intent » bilingue. L'UI l'affiche directement (mode critère).
for (const crit of Object.keys(intent)) {
  const tech = intent[crit];
  if (!tech || !tech.en) continue;
  total++;
  const entry = { en: tech.en };
  if (tech.fr && tech.fr.trim()) {
    entry.fr = tech.fr;
    translated++;
  }
  const json = JSON.stringify({ [crit]: entry });
  body += `update public.criteria set test_procedures = '${sqlEscape(json)}'::jsonb\n`;
  body += `where identifier = '${crit}' and thematic_id in (select id from public.thematics where reference_id = '${WCAG_REF}');\n\n`;
}

const out = `-- ============================================================================
-- Axessyo · Procédures de test détaillées WCAG 2.2 (bilingue FR/EN)
-- ----------------------------------------------------------------------------
-- Peuple \`criteria.test_procedures\` pour le référentiel WCAG 2.2
-- (${WCAG_REF}). Pour chaque critère, un objet
-- { code_technique -> { en, fr } } : la procédure officielle W3C par technique
-- (G94, ARIA6, H37, F38…). L'UI affiche \`fr\` si présent, sinon \`en\` (repli).
--
-- Source : BDD_WCAG.xlsx → scripts/wcag/*.json. Généré par
-- scripts/wcag/gen-wcag-migration.mjs (ne pas éditer à la main).
-- Traductions FR : ${translated}/${total} techniques.
--
-- Idempotent · transaction unique.
-- ============================================================================

begin;

alter table public.criteria
  add column if not exists test_procedures jsonb;

${body}-- Vérification : au moins 45 critères WCAG enrichis.
do $$
declare n integer;
begin
  select count(*) into n
  from public.criteria c
  join public.thematics t on t.id = c.thematic_id
  where t.reference_id = '${WCAG_REF}' and c.test_procedures is not null;
  if n < 45 then
    raise exception 'WCAG test_procedures: seulement % critères enrichis (attendu >= 45)', n;
  end if;
end $$;

commit;
`;

writeFileSync(
  here("../../supabase/migrations/82_wcag_test_procedures.sql"),
  out,
  "utf8",
);
console.log(
  `Migration 82 générée : ${Object.keys(mapping).length} critères, ${total} techniques, ${translated} traduites FR, ${out.length} octets.`,
);
