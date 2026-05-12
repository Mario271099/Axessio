import { test, expect } from "@playwright/test";
import { login } from "./helpers/auth";

test.describe("Flux audit", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("crée un audit complet", async ({ page }) => {
    await page.goto("/audits");

    // Bouton/lien "Nouvel audit" en haut à droite de la liste.
    await page
      .getByRole("link", { name: /nouvel audit/i })
      .click({ timeout: 30_000 });

    await page.waitForURL("**/audits/new", { timeout: 30_000 });

    // ---- Étape 1 : projet --------------------------------------------------
    // Le SelectTrigger Radix porte l'id `project-select` associé au Label.
    await page.getByLabel("Projet à auditer").click();
    // La SelectContent est ouverte dans un Portal — on prend la 1ʳᵉ option.
    await page.getByRole("option").first().click();
    await page
      .getByRole("button", { name: /^suivant$/i })
      .click({ timeout: 30_000 });

    // ---- Étape 2 : référentiel (défauts Web + Audit) -----------------------
    await page.getByLabel(/référentiel d.accessibilité/i).click();
    await page.getByRole("option").first().click();
    // Plateforme et Type de prestation ont leurs valeurs par défaut (WEB,
    // AUDIT) — on n'y touche pas.
    await page
      .getByRole("button", { name: /^suivant$/i })
      .click({ timeout: 30_000 });

    // ---- Étape 3 : notes + création ---------------------------------------
    await page
      .getByLabel("Notes internes")
      .fill("Audit créé par test E2E");
    await page
      .getByRole("button", { name: /créer l.audit/i })
      .click({ timeout: 30_000 });

    // Redirection vers /audits/<uuid> (UUID v4 minuscule).
    await page.waitForURL(
      /\/audits\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      { timeout: 30_000 },
    );

    // Le détail d'audit affiche un h1 (nom du projet) — non vide.
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible({ timeout: 30_000 });
    await expect(heading).not.toHaveText("");

    // Le QuickLink "Matrice de conformité" pointe vers /audits/.../matrix.
    await expect(
      page.getByRole("link", { name: /matrice de conformité/i }),
    ).toBeVisible();
  });

  test("saisit un statut de conformité dans la matrice", async ({ page }) => {
    await page.goto("/audits");

    // Premier lien d'audit dans le tableau (le `<tbody>` ne contient que les
    // lignes d'audits, pas le bouton "Nouvel audit" en header).
    const firstAuditLink = page.locator("tbody a").first();
    await expect(firstAuditLink).toBeVisible({ timeout: 30_000 });
    await firstAuditLink.click({ timeout: 30_000 });

    // Sur le détail, on bascule vers la matrice.
    await page
      .getByRole("link", { name: /matrice de conformité/i })
      .click({ timeout: 30_000 });

    // Indicateur d'arrivée : le footer sticky avec "Sauvegarder tout" est
    // rendu une fois la matrice prête.
    const saveButton = page.getByRole("button", {
      name: /sauvegarder tout/i,
    });
    await expect(saveButton).toBeVisible({ timeout: 30_000 });

    // Sidebar des pages (`<aside aria-label="Pages de l'audit">`).
    const sidebar = page.getByRole("complementary", {
      name: /pages de l.audit/i,
    });
    await expect(sidebar).toBeVisible();

    // Ouvre l'accordéon "Images" (premier de RGAA). Le trigger Radix est un
    // <button> dont le texte contient l'identifiant + le nom de la thématique.
    const imagesAccordion = page
      .getByRole("button")
      .filter({ hasText: /images/i })
      .first();
    await imagesAccordion.click({ timeout: 30_000 });

    // Premier bouton "Conforme" visible dans l'accordéon ouvert.
    // L'aria-label complet est : "Critère X.Y ... : marquer Conforme".
    const firstConforme = page
      .getByRole("button", { name: /marquer Conforme/i })
      .first();
    await expect(firstConforme).toBeVisible({ timeout: 30_000 });
    await firstConforme.click();

    // Le bouton bascule en aria-pressed="true".
    await expect(firstConforme).toHaveAttribute("aria-pressed", "true");

    // L'indicateur du footer mentionne au moins "1 modification en attente"
    // (l'optimistic update ajoute la clé à pendingChanges immédiatement).
    // Si la matrice a auto-flushé entre temps, c'est "Tout est sauvegardé" :
    // les deux états confirment que le click a été pris en compte.
    await expect(
      page.getByText(/1 modification|tout est sauvegardé/i),
    ).toBeVisible({ timeout: 10_000 });

    // Sauvegarde explicite. Si la matrice a déjà flushé toute seule, le
    // bouton est désactivé — on l'ignore alors et on saute à la vérification.
    if (await saveButton.isEnabled()) {
      await saveButton.click({ timeout: 30_000 });
    }

    // Confirmation finale : le footer aria-live affiche "Tout est sauvegardé".
    await expect(page.getByText(/tout est sauvegardé/i)).toBeVisible({
      timeout: 30_000,
    });
  });
});
