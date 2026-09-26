// ==========================================================================
// Verification des contrastes du design system « Pro H ».
//
// Lit les tokens de src/app/globals.css (blocs :root et .dark) et mesure le
// ratio WCAG 2.1 de chaque couple texte/fond qui compte dans l interface.
// Les couples marques « indicatif » ne sont pas soumis a un minimum WCAG
// (bordure decorative, pastille pleine posee sur une carte encre) : on les
// affiche pour surveiller leur derive.
//
//   npm run contrast
//
// Sort en code 1 si un couple passe sous son minimum, pour pouvoir etre
// branche en CI le jour ou on le souhaite.
// ==========================================================================

import fs from "node:fs";

const css = fs.readFileSync("src/app/globals.css", "utf8");

function block(selector) {
  const start = css.indexOf(selector + " {");
  const end = css.indexOf("\n}", start);
  return css.slice(start, end);
}

function tokens(text) {
  const map = new Map();
  for (const line of text.split("\n")) {
    const m = /^\s*(--[a-z0-9-]+):\s*([^;]+);/.exec(line);
    if (m) map.set(m[1], m[2].trim());
  }
  return map;
}

/** "228 33% 97%" -> [r, g, b] 0-255 */
function hslToRgb(value) {
  const m = /^(-?[\d.]+)\s+([\d.]+)%\s+([\d.]+)%$/.exec(value);
  if (!m) return null;
  const h = Number(m[1]) / 360;
  const s = Number(m[2]) / 100;
  const l = Number(m[3]) / 100;
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue = (t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [hue(h + 1 / 3), hue(h), hue(h - 1 / 3)].map((v) =>
    Math.round(v * 255),
  );
}

function luminance([r, g, b]) {
  const f = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function ratio(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

const root = tokens(block(":root"));
const dark = tokens(block(".dark"));

/** Couples a verifier : [avant-plan, arriere-plan, minimum, libelle] */
const PAIRS = [
  ["--foreground", "--background", 4.5, "texte courant sur le fond"],
  ["--foreground", "--card", 4.5, "texte courant sur carte"],
  ["--muted-foreground", "--background", 4.5, "texte secondaire sur le fond"],
  ["--muted-foreground", "--card", 4.5, "texte secondaire sur carte"],
  ["--secondary-foreground", "--card", 4.5, "texte de corps sur carte"],
  ["--secondary-foreground", "--secondary", 4.5, "texte sur chip neutre"],
  ["--primary", "--card", 4.5, "lien cobalt sur carte"],
  ["--primary", "--background", 4.5, "lien cobalt sur le fond"],
  ["--primary-foreground", "--primary", 4.5, "texte du bouton principal"],
  ["--primary", "--primary-muted", 4.5, "pastille cobalt (texte sur fond)"],
  ["--primary", "--primary-soft", 4.5, "survol de menu (texte sur fond)"],
  ["--destructive-foreground", "--destructive", 4.5, "texte du bouton danger"],
  ["--success-foreground", "--success", 4.5, "texte sur succes"],
  ["--warning-foreground", "--warning", 4.5, "texte sur avertissement"],
  ["--severity-critical", "--severity-critical-bg", 4.5, "severite critique"],
  ["--severity-high", "--severity-high-bg", 4.5, "severite haute"],
  ["--severity-medium", "--severity-medium-bg", 4.5, "severite moyenne"],
  ["--severity-low", "--severity-low-bg", 4.5, "severite faible"],
  ["--score-non-compliant", "--card", 4.5, "score non conforme sur carte"],
  ["--score-partial", "--card", 4.5, "score partiel sur carte"],
  ["--score-compliant", "--card", 4.5, "score conforme sur carte"],
  ["--ink-surface-foreground", "--ink-surface", 4.5, "texte sur carte encre"],
  ["--ink-surface-muted", "--ink-surface", 4.5, "texte secondaire sur encre"],
  ["--ink-positive", "--ink-surface", 4.5, "vert sur encre"],
  ["--highlight", "--ink-surface", 3, "ambre sur encre (graphique)"],
  ["--input", "--card", 3, "bord de champ sur carte"],
  ["--border-strong", "--card", 1.2, "bord decoratif fort sur carte (indicatif)"],
  ["--ring", "--background", 3, "anneau de focus sur le fond"],
  ["--ring", "--card", 3, "anneau de focus sur carte"],
  // Sur les aplats sombres, l'anneau passe au blanc de la surface : l'anneau
  // cobalt n'y fait que 2,15:1 (cf. globals.css, regles .bg-ink / .bg-cobalt).
  [
    "--ink-surface-foreground",
    "--ink-surface",
    3,
    "anneau de focus sur encre",
  ],
  [
    "--cobalt-surface-foreground",
    "--cobalt-surface",
    3,
    "anneau de focus sur aplat cobalt",
  ],
  ["--destructive", "--card", 4.5, "texte destructif sur carte"],
  ["--success", "--card", 4.5, "texte succes sur carte"],
  ["--warning", "--card", 4.5, "texte avertissement sur carte"],
  ["--ink-surface-muted", "--ink-surface-raised", 4.5, "texte secondaire sur bloc pose"],
  ["--foreground", "--secondary", 4.5, "texte sur fond de chip"],
  ["--foreground", "--primary-soft", 4.5, "texte sur survol de menu"],
  ["--primary", "--ink-surface", 1.5, "pastille cobalt pleine sur encre (indicatif)"],
];

let totalFailures = 0;

for (const [name, map] of [
  ["CLAIR", root],
  ["SOMBRE", new Map([...root, ...dark])],
]) {
  console.log("\n=== " + name + " ===");
  let failures = 0;
  for (const [fg, bg, min, label] of PAIRS) {
    const a = hslToRgb(map.get(fg) ?? "");
    const b = hslToRgb(map.get(bg) ?? "");
    if (!a || !b) {
      console.log("  ?  " + label + " (valeur non HSL)");
      continue;
    }
    const r = ratio(a, b);
    const ok = r >= min;
    if (!ok) {
      failures += 1;
      totalFailures += 1;
    }
    console.log(
      (ok ? "  ok " : "  XX ") +
        r.toFixed(2).padStart(5) +
        " (min " +
        min +
        ")  " +
        label,
    );
  }
  console.log("  -> " + failures + " couple(s) en echec");
}

if (totalFailures > 0) process.exitCode = 1;
