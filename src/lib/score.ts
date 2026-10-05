/**
 * Calcul des taux de conformité — methode officielle RGAA (DINUM,
 * https://accessibilite.numerique.gouv.fr/obligations/evaluation-conformite/) :
 *
 * - Taux global (valeur legale, celle de la declaration d'accessibilite) :
 *   criteres valides / criteres applicables, raisonne PAR CRITERE sur tout
 *   l'echantillon :
 *     · un critere est valide s'il est valide sur toutes les pages ;
 *     · il est applicable s'il l'est sur au moins une page (donc non
 *       applicable seulement s'il l'est sur toutes les pages) ;
 *     · il est non conforme des qu'il echoue sur une seule page.
 * - Taux par page : criteres conformes / criteres applicables de la page.
 * - Taux moyen : moyenne des taux de chaque page.
 *
 * Audit en cours : un critere sans echec mais pas encore evalue sur toutes
 * les pages n'est pas encore determine ; il est exclu du calcul. Le taux est
 * donc provisoire et rejoint la valeur legale une fois la matrice complete.
 */

export type CellStatus = "COMPLIANT" | "NON_COMPLIANT" | "NOT_APPLICABLE";

export type CriterionResult = CellStatus | "PENDING";

export function roundRate(value: number): number {
  return Math.round(value * 100) / 100;
}

/** C / (C + NC) en %, ou null si rien d'applicable n'est encore determine. */
export function rateOf(compliant: number, nonCompliant: number): number | null {
  const applicable = compliant + nonCompliant;
  if (applicable <= 0) return null;
  return roundRate((compliant / applicable) * 100);
}

/** Statut d'un critere sur l'echantillon a partir de ses cases page x critere. */
export function criterionResult(
  cells: ReadonlyArray<CellStatus | undefined>,
): CriterionResult {
  if (cells.some((s) => s === "NON_COMPLIANT")) return "NON_COMPLIANT";
  if (cells.length === 0 || cells.some((s) => s === undefined)) return "PENDING";
  if (cells.every((s) => s === "NOT_APPLICABLE")) return "NOT_APPLICABLE";
  return "COMPLIANT";
}

export interface CriteriaCounts {
  compliant: number;
  nonCompliant: number;
  notApplicable: number;
  pending: number;
}

export interface RgaaRates {
  /** Taux global legal, null si aucun critere applicable n'est determine. */
  globalRate: number | null;
  /** Moyenne des taux par page (pages sans critere applicable exclues). */
  averageRate: number | null;
  /** Taux par page, indexe par id de page. */
  pageRates: Map<string, number | null>;
  /** Decompte des criteres sur l'echantillon. */
  criteria: CriteriaCounts;
}

export function computeRgaaRates(args: {
  pageIds: ReadonlyArray<string>;
  criterionIds: ReadonlyArray<string>;
  statusOf: (pageId: string, criterionId: string) => CellStatus | undefined;
}): RgaaRates {
  const { pageIds, criterionIds, statusOf } = args;
  const criteria: CriteriaCounts = {
    compliant: 0,
    nonCompliant: 0,
    notApplicable: 0,
    pending: 0,
  };
  for (const criterionId of criterionIds) {
    const result = criterionResult(
      pageIds.map((pageId) => statusOf(pageId, criterionId)),
    );
    if (result === "COMPLIANT") criteria.compliant += 1;
    else if (result === "NON_COMPLIANT") criteria.nonCompliant += 1;
    else if (result === "NOT_APPLICABLE") criteria.notApplicable += 1;
    else criteria.pending += 1;
  }

  const pageRates = new Map<string, number | null>();
  const definedRates: number[] = [];
  for (const pageId of pageIds) {
    let compliant = 0;
    let nonCompliant = 0;
    for (const criterionId of criterionIds) {
      const status = statusOf(pageId, criterionId);
      if (status === "COMPLIANT") compliant += 1;
      else if (status === "NON_COMPLIANT") nonCompliant += 1;
    }
    const pageRate = rateOf(compliant, nonCompliant);
    pageRates.set(pageId, pageRate);
    if (pageRate !== null) definedRates.push(pageRate);
  }

  return {
    globalRate: rateOf(criteria.compliant, criteria.nonCompliant),
    averageRate:
      definedRates.length === 0
        ? null
        : roundRate(
            definedRates.reduce((sum, r) => sum + r, 0) / definedRates.length,
          ),
    pageRates,
    criteria,
  };
}

/**
 * Formule historique (legacy `PageScore.php`) :
 *     score = (compliant / (totalCriteria - notApplicable)) * 100
 * Equivalente au taux d'une page quand toutes ses cases sont saisies
 * (totalCriteria - notApplicable = C + NC). Pour les taux affiches, preferer
 * `computeRgaaRates` / `rateOf`, qui suivent la methode officielle.
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
