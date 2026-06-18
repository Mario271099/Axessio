import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "node:path";

// Charge les credentials de test (E2E_USER_EMAIL / E2E_USER_PASSWORD) avant que
// Playwright n'évalue le reste du fichier. .env.test.local est gitignoré.
dotenv.config({ path: path.resolve(__dirname, ".env.test.local") });

const PORT = 3000;
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Toujours un worker à la fois : le dev server Next 16 + Turbopack
  // compile à la volée et envoie un payload Flight bizarre quand plusieurs
  // requêtes hits une route pas encore compilée en parallèle (le client
  // hydratait la page comme un not-found). Sequentiel = compilation
  // déterministe, et la perte de temps est mineure (≤ 4 specs).
  workers: 1,
  reporter: process.env.CI ? "github" : "list",

  use: {
    baseURL: BASE_URL,
    // Force le français : sans ça, Chromium envoie Accept-Language: en-US et le
    // proxy detecte l'anglais (detectLocaleFromHeader), faisant echouer les
    // selecteurs de labels FR ("Adresse email", etc.). L'UI est principalement
    // en francais (cf. CLAUDE.md) et les specs sont ecrites en francais.
    locale: "fr-FR",
    headless: true,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
    actionTimeout: 10_000,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Lance `npm run dev` avant les tests. Sur une machine de dev où le serveur
  // tourne déjà, on le réutilise pour économiser le démarrage de Next 16.
  webServer: {
    command: "npm run dev",
    url: BASE_URL,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    stdout: "ignore",
    stderr: "pipe",
  },
});
