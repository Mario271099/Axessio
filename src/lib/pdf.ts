// SERVER-ONLY. Module Node.js - ne jamais importer dans un composant client.
// Génère un PDF via Puppeteer :
//   - Sur Vercel (env serverless AWS Lambda) → binaire fourni par
//     @sparticuz/chromium-min, dont le pack brotli (~68 Mo) est téléchargé
//     depuis une URL distante au cold start (cf. CHROMIUM_PACK_URL)
//   - En local (dev) → puppeteer-core avec un Chrome détecté sur la machine

import { existsSync } from "node:fs";
import type { Browser } from "puppeteer-core";

// Version du pack Chromium = version du package @sparticuz/chromium-min.
// DOIT rester alignée avec la dépendance dans package.json (actuellement
// 147.0.0) : un pack d'une autre version ne démarre pas avec ce puppeteer-core.
const CHROMIUM_VERSION = "147.0.0";

// URL du pack brotli (al2023 + chromium + fonts + swiftshader) téléchargé au
// runtime sur l'environnement serverless. On NE PEUT PAS embarquer ces ~68 Mo
// dans la lambda : déjà compressés, ils dépassent la limite Vercel de 50 Mo
// compressés par fonction (plan Hobby). Par défaut on tape la release GitHub
// officielle de Sparticuz ; surchargeable via env pour héberger le pack soi-même
// (recommandé en prod : CDN plus rapide et indépendant des quotas GitHub).
const CHROMIUM_PACK_URL =
  process.env.CHROMIUM_PACK_URL ??
  `https://github.com/Sparticuz/chromium/releases/download/v${CHROMIUM_VERSION}/chromium-v${CHROMIUM_VERSION}-pack.x64.tar`;

/**
 * Détecte si l'on tourne sur Vercel / AWS Lambda (Sparticuz nécessaire),
 * ou en local (Chrome système suffit).
 */
function isServerlessEnv(): boolean {
  return Boolean(
    process.env.VERCEL ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.AWS_EXECUTION_ENV,
  );
}

/**
 * Cherche un Chrome installé sur la machine de dev.
 * On essaye d'abord la variable d'env explicite, puis les chemins usuels.
 */
function findLocalChrome(): string | null {
  const fromEnv = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (fromEnv && existsSync(fromEnv)) return fromEnv;

  const candidates: string[] =
    process.platform === "win32"
      ? [
          "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
          "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
          `${process.env.LOCALAPPDATA ?? ""}\\Google\\Chrome\\Application\\chrome.exe`,
          "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
        ]
      : process.platform === "darwin"
        ? [
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            "/Applications/Chromium.app/Contents/MacOS/Chromium",
          ]
        : [
            "/usr/bin/google-chrome",
            "/usr/bin/google-chrome-stable",
            "/usr/bin/chromium",
            "/usr/bin/chromium-browser",
          ];

  return candidates.find((p) => p && existsSync(p)) ?? null;
}

async function launchBrowser(): Promise<Browser> {
  const puppeteer = await import("puppeteer-core");

  if (isServerlessEnv()) {
    // Lazy-import : on ne charge le runtime Chromium qu'en serverless.
    // chromium-min ne contient PAS le binaire ; on lui passe l'URL du pack
    // brotli distant, qu'il décompresse dans /tmp au premier appel.
    const chromiumModule = await import("@sparticuz/chromium-min");
    const chromium = chromiumModule.default;

    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(CHROMIUM_PACK_URL),
      headless: true,
    });
  }

  const executablePath = findLocalChrome();
  if (!executablePath) {
    throw new Error(
      "Aucun Chrome local détecté. Installe Google Chrome ou définis PUPPETEER_EXECUTABLE_PATH.",
    );
  }

  return puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
}

export interface GeneratePDFOptions {
  /** HTML d'en-tête imprimé sur chaque page (gabarit Puppeteer). */
  headerTemplate?: string;
  /** HTML de pied de page imprimé sur chaque page (gabarit Puppeteer). */
  footerTemplate?: string;
}

/**
 * Pied de page minimal Axessyo : numérotation à droite, mention discrète à
 * gauche. Compatible Puppeteer (classes spéciales `pageNumber` et
 * `totalPages` interpolées au print).
 */
export const DEFAULT_FOOTER_TEMPLATE = `
<div role="presentation" aria-hidden="true" style="
  font-size: 8pt;
  color: #4b5563;
  width: 100%;
  padding: 0 20mm;
  display: flex;
  justify-content: space-between;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
">
  <span>Axessyo</span>
  <span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span>
</div>`;

/**
 * Convertit une chaîne HTML en PDF A4 (marges 20 mm, fond imprimé).
 */
export async function generatePDF(
  html: string,
  options: GeneratePDFOptions = {},
): Promise<Buffer> {
  const displayHeaderFooter = Boolean(
    options.headerTemplate || options.footerTemplate,
  );

  let browser: Browser | null = null;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();

    // `setContent` n'accepte plus `networkidle0` à partir de puppeteer 22.
    // On charge le DOM, puis on attend explicitement que toutes les images
    // (captures signées Storage) soient résolues avant le print.
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    await page.evaluate(async () => {
      const images = Array.from(document.images);
      await Promise.all(
        images.map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise<void>((resolve) => {
                img.onload = () => resolve();
                img.onerror = () => resolve();
              }),
        ),
      );
    });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      // Tagged PDF : Puppeteer demande à Chromium d'écrire la structure
      // sémantique (StructTreeRoot, MarkInfo, etc.) dans le fichier PDF.
      // Combiné à un HTML sémantique correct (h1/h2/h3, table > thead/tbody
      // avec scope, alt, lang, etc.), c'est ce qui permet aux lecteurs
      // d'écran et aux outils PDF/UA d'exposer la structure du document.
      tagged: true,
      displayHeaderFooter,
      headerTemplate: options.headerTemplate ?? "<span></span>",
      footerTemplate: options.footerTemplate ?? "<span></span>",
      margin: {
        // Quand on affiche un footer, Puppeteer le calque dans la marge - on
        // augmente la marge basse pour qu'il ne mange pas du contenu.
        top: "20mm",
        right: "20mm",
        bottom: displayHeaderFooter ? "25mm" : "20mm",
        left: "20mm",
      },
    });

    // page.pdf() renvoie un Uint8Array - on le convertit en Buffer pour les
    // consommateurs Node (NextResponse, fs.writeFile, etc.).
    return Buffer.from(pdf);
  } finally {
    if (browser) {
      await browser.close().catch(() => {
        // Le browser peut déjà être déconnecté - on ignore.
      });
    }
  }
}
