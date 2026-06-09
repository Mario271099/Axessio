// Fusionne un lot de traductions FR dans scripts/wcag/wcag-techniques.json.
//
// Usage : node scripts/wcag/apply-translations.mjs <fichier-lot.json>
// où le fichier lot est un objet { "<code>": "<procédure traduite FR>", ... }.
//
// Après fusion, régénère la migration 82 :
//   node scripts/wcag/gen-wcag-migration.mjs
import { readFileSync, writeFileSync } from "node:fs";

const batchPath = process.argv[2];
if (!batchPath) {
  console.error("Usage: node apply-translations.mjs <batch.json>");
  process.exit(1);
}

const techPath = new URL("./wcag-techniques.json", import.meta.url);
const techniques = JSON.parse(readFileSync(techPath));
const batch = JSON.parse(readFileSync(batchPath));

let applied = 0;
let unknown = [];
for (const [code, fr] of Object.entries(batch)) {
  if (!techniques[code]) {
    unknown.push(code);
    continue;
  }
  techniques[code].fr = fr;
  applied++;
}

writeFileSync(techPath, JSON.stringify(techniques, null, 2));

const totalFr = Object.values(techniques).filter(
  (t) => t.fr && t.fr.trim(),
).length;
console.log(
  `Appliqué ${applied} traductions. Total FR : ${totalFr}/${Object.keys(techniques).length}.`,
);
if (unknown.length) console.log("Codes inconnus ignorés :", unknown.join(", "));
