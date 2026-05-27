import { test, expect } from "@playwright/test";
import {
  E2E_USER_EMAIL,
  E2E_USER_PASSWORD,
  login,
} from "./helpers/auth";

test.describe("Authentification", () => {
  test.beforeAll(() => {
    if (!E2E_USER_EMAIL || !E2E_USER_PASSWORD) {
      throw new Error(
        "E2E_USER_EMAIL et E2E_USER_PASSWORD doivent être définis dans .env.test.local.",
      );
    }
  });

  test("affiche le formulaire de connexion sur /login", async ({ page }) => {
    await page.goto("/login");

    // `exact: true` parce que le toggle "Afficher le mot de passe" porte un
    // aria-label qui contient également "Mot de passe" → sans exact, le
    // sélecteur résout 2 éléments et viole le strict mode de Playwright.
    await expect(page.getByLabel("Adresse email")).toBeVisible();
    await expect(
      page.getByLabel("Mot de passe", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^se connecter$/i }),
    ).toBeVisible();
  });

  test("connecte un utilisateur avec des identifiants valides", async ({
    page,
  }) => {
    await login(page);

    // login() vérifie déjà la présence du heading. On la ré-affirme ici
    // pour la lisibilité de l'assertion principale du test.
    await expect(
      page.getByRole("heading", { name: /bonjour/i }),
    ).toBeVisible({ timeout: 30_000 });
  });

  test("affiche une erreur et reste sur /login avec un mot de passe invalide", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.getByLabel("Adresse email").fill(E2E_USER_EMAIL);
    await page.getByLabel("Mot de passe", { exact: true }).fill("mot-de-passe-volontairement-faux");

    await page.getByRole("button", { name: /se connecter/i }).click();

    // L'id `form-error` est stable. On ne dépend pas du `role="alert"`
    // (présent aussi mais ambigu sur d'autres pages d'erreur globales).
    // Supabase renvoie "Invalid login credentials" en anglais et le
    // frontend l'enveloppe dans "Erreur : …" → on accepte les deux.
    const error = page.locator("#form-error");
    await expect(error).toBeVisible({ timeout: 10_000 });
    await expect(error).toContainText(/invalid|erreur/i);

    // On doit toujours être sur /login (pas de redirection dashboard).
    await expect(page).toHaveURL(/\/login(?:$|\?)/);
  });
});
