// Parsing de la colonne `criteria.methodology` (chargée par les migrations
// 10-13) en tests individuels.
//
// Format source :
//
//   Test 1.1.1
//   Chaque image (balise img...) porteuse d'information a-t-elle une
//   alternative textuelle ?
//
//   Test 1.1.2
//   Chaque zone d'une image réactive (balise area)...
//
// Sortie : [{ reference: "Test 1.1.1", question: "Chaque image..." }, ...]

export interface MethodologyTest {
  /** Référence textuelle complète, ex. `Test 1.1.1`. */
  reference: string;
  /** Question d'évaluation officielle pour ce test. */
  question: string;
}

// Valeur d'une procédure détaillée (`criteria.test_procedures`). Pour les
// référentiels francophones (RGAA/RAWeb/RAAM) c'est une simple chaîne FR ;
// pour WCAG c'est un objet bilingue { en, fr? } (fr absent = non traduit).
export type TestProcedureValue = string | { en: string; fr?: string };
export type TestProceduresMap = Record<string, TestProcedureValue>;

// Résout une procédure selon la langue active. Repli sur l'anglais si la
// traduction française n'est pas encore disponible.
export function localizeProcedure(
  value: TestProcedureValue | null | undefined,
  locale: string,
): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  if (locale.startsWith("fr")) return value.fr ?? value.en ?? null;
  return value.en ?? value.fr ?? null;
}

// Une ligne `Test X.Y.Z` éventuellement suivie d'espaces / autres tokens
// alphanumériques (certains référentiels utilisent `Test 1.1.1.1`).
const TEST_HEADER = /^Test\s+([0-9]+(?:\.[0-9]+)*)\s*$/;

export function parseMethodology(
  methodology: string | null | undefined,
): MethodologyTest[] {
  if (!methodology) return [];
  const lines = methodology.split(/\r?\n/);

  const tests: MethodologyTest[] = [];
  let current: { reference: string; lines: string[] } | null = null;

  const commit = () => {
    if (!current) return;
    const question = current.lines.join(" ").replace(/\s+/g, " ").trim();
    if (question) {
      tests.push({ reference: current.reference, question });
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const match = TEST_HEADER.exec(line);
    if (match) {
      commit();
      current = { reference: `Test ${match[1]}`, lines: [] };
    } else if (current && line) {
      current.lines.push(line);
    }
  }
  commit();

  return tests;
}
