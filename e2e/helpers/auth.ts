import { expect, type Page } from "@playwright/test";

export const E2E_USER_EMAIL = process.env.E2E_USER_EMAIL ?? "";
export const E2E_USER_PASSWORD = process.env.E2E_USER_PASSWORD ?? "";

/**
 * Connecte l'utilisateur de test via le formulaire `/login` réel
 * et attend l'apparition du heading "Bonjour, …" qui matérialise
 * l'arrivée sur le dashboard.
 *
 * Le formulaire utilise `window.location.href = "/dashboard"` après
 * `signInWithPassword` : on n'attend donc pas `waitForURL` (parfois
 * flaky avec Next 16 + Turbopack) mais directement le rendu serveur
 * du dashboard.
 */
export async function login(page: Page): Promise<void> {
  if (!E2E_USER_EMAIL || !E2E_USER_PASSWORD) {
    throw new Error(
      "E2E_USER_EMAIL et E2E_USER_PASSWORD doivent être définis dans .env.test.local.",
    );
  }

  await page.goto("/login");
  await page.getByLabel("Adresse email").fill(E2E_USER_EMAIL);
  // `exact: true` : le toggle "Afficher le mot de passe" partage le mot
  // "Mot de passe" via son aria-label et ferait échouer le strict mode.
  await page
    .getByLabel("Mot de passe", { exact: true })
    .fill(E2E_USER_PASSWORD);
  await page
    .getByRole("button", { name: /^se connecter$/i })
    .click({ timeout: 30_000 });

  // Course : soit on arrive sur le dashboard (heading "Bonjour"), soit
  // Supabase renvoie une erreur de credentials. Le message d'erreur explicite
  // évite un timeout opaque de 30 s qui rend le diagnostic difficile.
  const heading = page.getByRole("heading", { name: /bonjour/i });
  const errorMsg = page.locator("#form-error");
  await expect
    .poll(
      async () => {
        if (await heading.isVisible().catch(() => false)) return "ok";
        if (await errorMsg.isVisible().catch(() => false)) return "error";
        return "pending";
      },
      { timeout: 30_000, message: "Login : ni dashboard ni message d'erreur" },
    )
    .not.toBe("pending");

  if (await errorMsg.isVisible().catch(() => false)) {
    const text = (await errorMsg.textContent())?.trim() ?? "(vide)";
    throw new Error(
      `Login Supabase a échoué : "${text}". Vérifie E2E_USER_EMAIL / E2E_USER_PASSWORD dans .env.test.local.`,
    );
  }
}
