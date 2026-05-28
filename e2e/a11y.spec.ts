import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { E2E_USER_EMAIL, E2E_USER_PASSWORD, login } from "./helpers/auth";

// Audit axe-core automatisé. On échoue le CI dès qu'une violation de niveau
// "critical" ou "serious" apparaît sur une page clé. Les niveaux "moderate"/
// "minor" sont volontairement tolérés pour l'instant (bruit > signal) — à
// resserrer une fois les pages publiques propres.
//
// `axe-core` couvre ~50 % des critères WCAG de façon automatique : c'est un
// filet de sécurité anti-régression, PAS un substitut à l'audit RGAA manuel.

const IMPACTS_BLOQUANTS = ["critical", "serious"] as const;

async function analyser(page: import("@playwright/test").Page) {
  return new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
}

function violationsBloquantes(
  results: Awaited<ReturnType<typeof analyser>>,
) {
  return results.violations.filter((v) =>
    (IMPACTS_BLOQUANTS as readonly string[]).includes(v.impact ?? ""),
  );
}

// Format lisible en cas d'échec : id de règle + impact + sélecteurs touchés.
function formatViolations(
  violations: Awaited<ReturnType<typeof analyser>>["violations"],
): string {
  return violations
    .map(
      (v) =>
        `[${v.impact}] ${v.id}: ${v.help}\n    ${v.nodes
          .map((n) => n.target.join(" "))
          .join("\n    ")}`,
    )
    .join("\n");
}

test.describe("Accessibilité (axe-core) — pages publiques", () => {
  const PAGES_PUBLIQUES = [
    { path: "/", nom: "accueil" },
    { path: "/login", nom: "connexion" },
    { path: "/pricing", nom: "tarifs" },
    { path: "/accessibility", nom: "déclaration d'accessibilité" },
  ];

  for (const { path, nom } of PAGES_PUBLIQUES) {
    test(`${nom} (${path}) — 0 violation critique/sérieuse`, async ({ page }) => {
      await page.goto(path);
      // Attendre que le contenu principal soit présent (hydratation).
      await page.locator("main, #main").first().waitFor({ state: "visible" });

      const results = await analyser(page);
      const bloquantes = violationsBloquantes(results);

      expect(
        bloquantes,
        `Violations a11y bloquantes sur ${path} :\n${formatViolations(bloquantes)}`,
      ).toEqual([]);
    });
  }
});

test.describe("Accessibilité (axe-core) — dashboard", () => {
  test.skip(
    !E2E_USER_EMAIL || !E2E_USER_PASSWORD,
    "E2E_USER_EMAIL / E2E_USER_PASSWORD requis pour scanner les pages authentifiées.",
  );

  test("dashboard — 0 violation critique/sérieuse", async ({ page }) => {
    await login(page);
    await page.locator("main, #main").first().waitFor({ state: "visible" });

    const results = await analyser(page);
    const bloquantes = violationsBloquantes(results);

    expect(
      bloquantes,
      `Violations a11y bloquantes sur /dashboard :\n${formatViolations(bloquantes)}`,
    ).toEqual([]);
  });
});
