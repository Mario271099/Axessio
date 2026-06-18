// Utilitaire d'échappement CSV partagé par tous les exports (matrice de
// conformité, journaux d'audit, anomalies…).
//
// Deux protections distinctes, toutes deux nécessaires :
//
//   1. RFC 4180 - guillemeter dès qu'un séparateur, un guillemet ou un saut de
//      ligne apparaît, et doubler les guillemets internes. Garantit un fichier
//      relisible.
//
//   2. Anti-injection de formule (CSV / "formula injection") - une cellule qui
//      commence par `=`, `+`, `-`, `@`, une tabulation ou un retour chariot est
//      interprétée comme une FORMULE par Excel / Google Sheets / LibreOffice à
//      l'ouverture. Comme nos exports contiennent des données saisies par des
//      tiers (emails, noms d'organisation, IP, noms de page, payloads de logs),
//      un attaquant peut y glisser `=HYPERLINK(...)` ou `=cmd|'/c calc'!A1`.
//      On désamorce en préfixant ces cellules d'une apostrophe simple, ce qui
//      force le tableur à traiter la valeur comme du texte sans en altérer le
//      rendu visible (l'apostrophe de tête n'est pas affichée).

// Caractères qui, en tête de cellule, déclenchent l'évaluation d'une formule.
const FORMULA_TRIGGERS = new Set(["=", "+", "-", "@", "\t", "\r"]);

/**
 * Échappe une valeur pour une cellule CSV : neutralise l'injection de formule
 * puis applique le guillemetage RFC 4180. Retourne "" pour null/undefined.
 */
export function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return "";

  let str = typeof value === "string" ? value : String(value);

  // 1) Anti-injection de formule : préfixe ' si la valeur démarre par un
  //    caractère dangereux. Fait AVANT le guillemetage pour que l'apostrophe
  //    se retrouve bien à l'intérieur des guillemets le cas échéant.
  if (str.length > 0 && FORMULA_TRIGGERS.has(str[0]!)) {
    str = `'${str}`;
  }

  // 2) RFC 4180 : guillemeter si nécessaire, en doublant les guillemets.
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Sérialise une valeur non-textuelle (objet/tableau) en JSON avant échappement.
 * Utile pour les colonnes `payload` des journaux d'audit. Les chaînes passent
 * telles quelles à `escapeCsv`.
 */
export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return escapeCsv(value);
  return escapeCsv(JSON.stringify(value));
}
