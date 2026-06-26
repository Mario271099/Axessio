import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";
import { SECURITY_HEADERS } from "./src/lib/security-headers";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  // Empêche le bundler de Next d'embarquer puppeteer-core et le binaire Chromium :
  // ces deux packages doivent rester en `require()` natif côté serveur Node.
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],

  // Le binaire Chromium de @sparticuz/chromium charge ses fichiers brotli
  // (`bin/*.br`) par chemin au runtime. Le file-tracing de Next ne les détecte
  // donc pas et les exclut du bundle serverless → en prod Vercel on obtient
  // « The input directory ".../@sparticuz/chromium/bin" does not exist ».
  // On force l'inclusion du dossier `bin/` (et du reste du package) dans la
  // lambda de la route d'export PDF.
  outputFileTracingIncludes: {
    "/api/audits/[uuid]/report": [
      "./node_modules/@sparticuz/chromium/bin/**",
    ],
  },

  async headers() {
    return [
      {
        // Catch-all explicite. `/(.*)`  est universel ; certaines versions de
        // path-to-regexp utilisées par Next n'attachent pas `/:path*` à la
        // racine `/`, ce qui laissait la home sans headers.
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
      {
        // Filet de sécurité explicite sur la racine.
        source: "/",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

// withSentryConfig est tolérant : sans SENTRY_AUTH_TOKEN, l'upload des source
// maps est simplement sauté (silent: true évite le warning à chaque build).
export default withSentryConfig(withNextIntl(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  // Les routes de tunnel contournent les adblockers, mais ajoutent un rewrite
  // sur chaque requête — inutile tant qu'on n'a pas de trafic significatif.

  // Stack traces lisibles (source maps). N'a d'effet qu'avec SENTRY_AUTH_TOKEN
  // posé ; sinon ces options sont ignorées (mode tolérant inchangé).
  //
  // widenClientFileUpload : remonte aussi les source maps des chunks partagés
  // du bundle client, sinon certaines frames navigateur restent minifiées.
  widenClientFileUpload: true,
  sourcemaps: {
    // SÉCURITÉ : on génère les maps pour l'upload, puis on les supprime du
    // build. Elles ne sont JAMAIS servies au navigateur (sinon le code source
    // complet fuiterait publiquement). Sentry garde sa copie pour dé-minifier.
    deleteSourcemapsAfterUpload: true,
  },
});

