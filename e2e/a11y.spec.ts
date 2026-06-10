import { test, expect, type Page, type BrowserContext } from "@playwright/test";
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

async function analyser(page: Page) {
  return new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
}

function violationsBloquantes(results: Awaited<ReturnType<typeof analyser>>) {
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

// Navigue vers `path`, attend le contenu principal, lance axe et échoue s'il
// reste une violation critique/sérieuse. Tolérant à l'absence de <main>
// (certains écrans peuvent rediriger) : on retombe alors sur <body>.
async function scanner(page: Page, path: string) {
  // Neutralise les animations d'apparition (`.fade-in-up` démarre à opacity 0)
  // qui, scannées en plein fondu, font lever à axe de faux positifs de
  // contraste. Le DS respecte déjà prefers-reduced-motion : `reduce` fige le
  // rendu à son état final et rend les scans déterministes.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page
    .locator("main, #main")
    .first()
    .waitFor({ state: "visible", timeout: 15_000 })
    .catch(() => {
      /* pas de <main> : on scanne quand même le document rendu */
    });

  const results = await analyser(page);
  const bloquantes = violationsBloquantes(results);

  expect(
    bloquantes,
    `Violations a11y bloquantes sur ${path} :\n${formatViolations(bloquantes)}`,
  ).toEqual([]);
}

// Récupère le premier href de la page courante qui matche `regex`, ou null.
async function premierHref(page: Page, regex: RegExp): Promise<string | null> {
  const hrefs = await page.locator("a[href]").evaluateAll((els) =>
    els.map((el) => (el as HTMLAnchorElement).getAttribute("href") ?? ""),
  );
  return hrefs.find((h) => regex.test(h)) ?? null;
}

test.describe("Accessibilité (axe-core) — pages publiques", () => {
  const PAGES_PUBLIQUES = [
    { path: "/", nom: "accueil" },
    { path: "/login", nom: "connexion" },
    { path: "/register", nom: "inscription" },
    { path: "/forgot-password", nom: "mot de passe oublié" },
    { path: "/pricing", nom: "tarifs" },
    { path: "/accessibility", nom: "déclaration d'accessibilité" },
    { path: "/legal", nom: "mentions légales" },
    { path: "/privacy", nom: "confidentialité" },
    { path: "/cookies", nom: "cookies" },
  ];

  for (const { path, nom } of PAGES_PUBLIQUES) {
    test(`${nom} (${path}) — 0 violation critique/sérieuse`, async ({ page }) => {
      await scanner(page, path);
    });
  }
});

test.describe("Accessibilité (axe-core) — pages internes", () => {
  test.skip(
    !E2E_USER_EMAIL || !E2E_USER_PASSWORD,
    "E2E_USER_EMAIL / E2E_USER_PASSWORD requis pour scanner les pages authentifiées.",
  );

  // Une seule connexion partagée pour tout le bloc (workers: 1). On découvre
  // les identifiants dynamiques (audit, org, client, NC) une fois, puis chaque
  // page est un test distinct pour un rapport granulaire.
  let context: BrowserContext;
  let page: Page;
  let auditUuid: string | null = null;
  let orgSlug: string | null = null;
  let clientId: string | null = null;
  let ncId: string | null = null;

  const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    await login(page);

    // Audit : première ligne du tableau de /audits.
    await page.goto("/audits", { waitUntil: "domcontentloaded" });
    const auditHref = await premierHref(page, new RegExp(`/audits/${UUID}`));
    auditUuid = auditHref?.match(new RegExp(UUID))?.[0] ?? null;

    // NC : première anomalie de l'audit trouvé.
    if (auditUuid) {
      await page.goto(`/audits/${auditUuid}/anomalies`, {
        waitUntil: "domcontentloaded",
      });
      const ncHref = await premierHref(
        page,
        new RegExp(`/audits/${auditUuid}/anomalies/${UUID}`),
      );
      ncId = ncHref?.match(new RegExp(`${UUID}$`))?.[0] ?? null;
    }

    // Organisation : premier lien /organizations/<slug> (hors page liste).
    await page.goto("/organizations", { waitUntil: "domcontentloaded" });
    const orgHref = await premierHref(page, /\/organizations\/[^/?#]+/);
    orgSlug = orgHref?.replace(/^\/organizations\//, "").split(/[/?#]/)[0] ?? null;

    // Client : premier lien /clients/<id>.
    await page.goto("/clients", { waitUntil: "domcontentloaded" });
    const clientHref = await premierHref(page, /\/clients\/[^/?#]+/);
    clientId = clientHref?.replace(/^\/clients\//, "").split(/[/?#]/)[0] ?? null;
  });

  test.afterAll(async () => {
    await context?.close();
  });

  // --- Écrans statiques (pas de paramètre d'URL) -------------------------
  const PAGES_STATIQUES = [
    { path: "/dashboard", nom: "tableau de bord" },
    { path: "/audits", nom: "liste des audits" },
    { path: "/audits/new", nom: "nouvel audit" },
    { path: "/clients", nom: "liste des clients" },
    { path: "/projects", nom: "projets" },
    { path: "/planning", nom: "planning" },
    { path: "/users", nom: "utilisateurs" },
    { path: "/settings", nom: "paramètres" },
    { path: "/organizations", nom: "organisations" },
    { path: "/admin/overview", nom: "admin — vue d'ensemble" },
    { path: "/admin/permissions", nom: "admin — permissions" },
  ];

  for (const { path, nom } of PAGES_STATIQUES) {
    test(`${nom} (${path}) — 0 violation critique/sérieuse`, async () => {
      await scanner(page, path);
    });
  }

  // --- Écrans d'audit (paramètre :uuid) ----------------------------------
  const PAGES_AUDIT = [
    { suffix: "", nom: "détail d'audit" },
    { suffix: "/edit", nom: "édition d'audit" },
    { suffix: "/sample", nom: "échantillon" },
    { suffix: "/matrix", nom: "matrice de conformité" },
    { suffix: "/anomalies", nom: "anomalies" },
    { suffix: "/anomalies/new", nom: "nouvelle anomalie" },
    { suffix: "/simulator", nom: "simulateur" },
  ];

  for (const { suffix, nom } of PAGES_AUDIT) {
    test(`${nom} (/audits/:uuid${suffix}) — 0 violation critique/sérieuse`, async () => {
      test.skip(!auditUuid, "Aucun audit disponible sur ce compte de test.");
      await scanner(page, `/audits/${auditUuid}${suffix}`);
    });
  }

  test("détail d'anomalie (/audits/:uuid/anomalies/:ncId) — 0 violation critique/sérieuse", async () => {
    test.skip(!auditUuid || !ncId, "Aucune anomalie disponible sur ce compte de test.");
    await scanner(page, `/audits/${auditUuid}/anomalies/${ncId}`);
  });

  // --- Détail client (paramètre :clientId) -------------------------------
  test("détail client (/clients/:id) — 0 violation critique/sérieuse", async () => {
    test.skip(!clientId, "Aucun client disponible sur ce compte de test.");
    await scanner(page, `/clients/${clientId}`);
  });

  // --- Écrans d'organisation (paramètre :slug) ---------------------------
  const PAGES_ORG = [
    { suffix: "", nom: "détail organisation" },
    { suffix: "/billing", nom: "facturation" },
    { suffix: "/branding", nom: "personnalisation" },
    { suffix: "/workspaces", nom: "espaces de travail" },
    { suffix: "/nc-templates", nom: "modèles de NC" },
    { suffix: "/webhooks", nom: "webhooks" },
    { suffix: "/api-tokens", nom: "jetons d'API" },
    { suffix: "/audit-logs", nom: "journal d'audit" },
  ];

  for (const { suffix, nom } of PAGES_ORG) {
    test(`${nom} (/organizations/:slug${suffix}) — 0 violation critique/sérieuse`, async () => {
      test.skip(!orgSlug, "Aucune organisation disponible sur ce compte de test.");
      await scanner(page, `/organizations/${orgSlug}${suffix}`);
    });
  }
});
