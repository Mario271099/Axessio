/**
 * Calcul du taux de conformité.
 *
 * Formule officielle (RGAA / WCAG), portée à l'identique depuis le legacy
 * `Page/Infrastructure/Entity/Properties/PageScore.php` :
 *
 *     score = (compliant / (totalCriteria - notApplicable)) * 100
 *
 * Cas particulier : si tous les critères sont "non applicables", le score est 0.
 */
export function calculateScore(args: {
  compliant: number;
  notApplicable: number;
  totalCriteria: number;
}): number {
  const { compliant, notApplicable, totalCriteria } = args;
  if (totalCriteria <= 0 || totalCriteria === notApplicable) return 0;
  const denominator = totalCriteria - notApplicable;
  if (denominator <= 0) return 0;
  const score = (compliant / denominator) * 100;
  // Arrondi à 2 décimales comme le legacy
  return Math.round(score * 100) / 100;
}

/**
 * Niveau de conformité officiel.
 * - 0 à 49 : non conforme
 * - 50 à 99 : partiellement conforme
 * - 100 : totalement conforme
 */
export type ConformityLevel = "non-compliant" | "partial" | "full";

export function getConformityLevel(score: number): ConformityLevel {
  if (score < 50) return "non-compliant";
  if (score < 100) return "partial";
  return "full";
}

export function getConformityLabel(score: number): string {
  switch (getConformityLevel(score)) {
    case "non-compliant":
      return "Non conforme";
    case "partial":
      return "Partiellement conforme";
    case "full":
      return "Totalement conforme";
  }
}

/**
 * Variable CSS du token de couleur correspondant au niveau de conformité.
 * Utiliser ainsi dans le JSX :
 *   `style={{ color: \`hsl(\${getScoreColorVar(score)})\` }}`
 */
export function getScoreColorVar(score: number): string {
  switch (getConformityLevel(score)) {
    case "non-compliant":
      return "var(--score-non-compliant)";
    case "partial":
      return "var(--score-partial)";
    case "full":
      return "var(--score-compliant)";
  }
}
