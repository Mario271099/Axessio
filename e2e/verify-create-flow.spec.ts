// Script de vérification E2E : login → créer client → créer projet sous ce
// client → créer un audit sur ce projet. Capture des screenshots à chaque
// étape pour traçabilité.
//
// Lancement :
//   npx playwright test e2e/verify-create-flow.spec.ts --headed
//
// Les screenshots sont posés dans verify-screenshots/ (gitignoré).
//
// NB : pas de waitForLoadState("networkidle") — pattern deconseille par
// Playwright et qui ne se resout jamais si la page garde une connexion
// persistante (realtime, polling). On s'appuie sur les assertions web
// (toBeVisible/toBeHidden) et waitForURL, qui auto-attendent de maniere fiable.

import { test, expect } from "@playwright/test";
import { login } from "./helpers/auth";
import { deleteClientByName } from "./helpers/admin";

const STAMP = Date.now();
const CLIENT_NAME = `Verify Client ${STAMP}`;
const PROJECT_NAME = `Verify Project ${STAMP}`;
const SHOTS_DIR = "verify-screenshots";

test.describe.configure({ mode: "serial" });

// Nettoyage : supprimer le client cree efface en cascade son projet et l'audit,
// pour ne pas saturer le quota d'audits du plan a chaque run (no-op sans cle
// service-role - cf. e2e/helpers/admin.ts).
test.afterAll(async () => {
  await deleteClientByName(CLIENT_NAME);
});

test("E2E create flow : client → project → audit", async ({ page }) => {
  test.setTimeout(180_000);

  // -------------------------------------------------------------------------
  // 0. Login
  // -------------------------------------------------------------------------
  await login(page);
  await page.screenshot({
    path: `${SHOTS_DIR}/00-dashboard.png`,
    fullPage: true,
  });

  // -------------------------------------------------------------------------
  // 1. Créer un client via /clients
  // -------------------------------------------------------------------------
  await page.goto("/clients");
  await expect(
    page.getByRole("button", { name: /nouveau client/i }),
  ).toBeVisible({ timeout: 30_000 });
  await page.screenshot({
    path: `${SHOTS_DIR}/01-clients-list.png`,
    fullPage: true,
  });

  await page.getByRole("button", { name: /nouveau client/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.screenshot({
    path: `${SHOTS_DIR}/02-client-dialog.png`,
    fullPage: true,
  });

  // Le label « Nom » est partagé par la dialog et plus tard la dialog
  // projet — on cible via l'id pour éviter les ambiguïtés.
  await page.locator("#client-name").fill(CLIENT_NAME);
  await page
    .locator("#client-website")
    .fill(`https://verify-${STAMP}.example.com`);
  await page
    .locator("#client-contact-name")
    .fill("Alice Vérification");
  await page
    .locator("#client-contact-email")
    .fill(`alice-${STAMP}@example.com`);

  await page.getByRole("button", { name: /créer le client/i }).click();

  // Attendre fermeture du dialog
  await expect(page.getByRole("dialog")).toBeHidden({ timeout: 15_000 });
  await page.screenshot({
    path: `${SHOTS_DIR}/03-client-created.png`,
    fullPage: true,
  });

  // Vérifier que le client apparaît dans la liste
  await expect(page.getByText(CLIENT_NAME).first()).toBeVisible();

  // -------------------------------------------------------------------------
  // 2. Naviguer dans le détail du client et créer un projet
  // -------------------------------------------------------------------------
  await page.getByText(CLIENT_NAME).first().click();
  await page.waitForURL(/\/clients\/[0-9a-f-]+$/, { timeout: 15_000 });
  await page.screenshot({
    path: `${SHOTS_DIR}/04-client-detail.png`,
    fullPage: true,
  });

  await page.getByRole("button", { name: /nouveau projet/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.screenshot({
    path: `${SHOTS_DIR}/05-project-dialog.png`,
    fullPage: true,
  });

  await page.locator("#create-project-name").fill(PROJECT_NAME);
  await page.getByRole("button", { name: /créer le projet/i }).click();

  await expect(page.getByRole("dialog")).toBeHidden({ timeout: 15_000 });
  await page.screenshot({
    path: `${SHOTS_DIR}/06-project-created.png`,
    fullPage: true,
  });

  await expect(page.getByText(PROJECT_NAME)).toBeVisible();

  // -------------------------------------------------------------------------
  // 3. Créer un audit sur ce projet
  // -------------------------------------------------------------------------
  await page.goto("/audits/new");
  await page.getByLabel(/projet [àa] auditer/i).waitFor({ timeout: 30_000 });
  await page.screenshot({
    path: `${SHOTS_DIR}/07-audit-new-step1.png`,
    fullPage: true,
  });

  // Étape 1 : sélectionner notre projet
  await page.getByLabel(/projet [àa] auditer/i).click();
  // Le portail Radix peut prendre un instant à apparaître
  await page.getByRole("option", { name: new RegExp(PROJECT_NAME) }).click();
  await page.getByRole("button", { name: /^suivant$/i }).click();

  // Étape 2 : référentiel
  await page.getByLabel(/référentiel d.accessibilité/i).click();
  await page.getByRole("option").first().click();
  // Champs requis de l'étape 2 (sinon "Suivant" reste désactivé). Ciblés par
  // id stable plutôt que par label, qui change selon plateforme/langue.
  await page.locator("#site-name").fill(`Verify Site ${STAMP}`);
  await page.locator("#site-url").fill(`https://verify-${STAMP}.example.com`);
  await page.screenshot({
    path: `${SHOTS_DIR}/08-audit-step2.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: /^suivant$/i }).click();

  // Étape 3 : notes + création
  await page.getByLabel(/notes internes/i).fill(`Verify audit ${STAMP}`);
  await page.screenshot({
    path: `${SHOTS_DIR}/09-audit-step3.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: /créer l.audit/i }).click();

  // Redirection vers /audits/<uuid>
  await page.waitForURL(
    /\/audits\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    { timeout: 30_000 },
  );
  await page.screenshot({
    path: `${SHOTS_DIR}/10-audit-created.png`,
    fullPage: true,
  });

  // -------------------------------------------------------------------------
  // 4. Vérifier la page de l'audit créé
  // -------------------------------------------------------------------------
  await expect(page.getByText(PROJECT_NAME).first()).toBeVisible();
});
