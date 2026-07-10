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
  // Empêche le bundler de Next d'embarquer puppeteer-core et Chromium : ces
  // deux packages doivent rester en `require()` natif côté serveur Node.
  // On utilise @sparticuz/chromium-min (sans binaire) : le pack brotli est
  // téléchargé depuis une URL distante au runtime (cf. src/lib/pdf.ts), ce qui
  // évite d'embarquer ~68 Mo dans la lambda et de dépasser la limite Vercel.
  serverExternalPackages: ["@sparticuz/chromium-min", "puppeteer-core"],

  async headers() {
    // Hors production Vercel (staging.axessyo.com, URLs de preview), on coupe
    // l'indexation au niveau HTTP : Vercel ne pose pas de X-Robots-Tag sur un
    // domaine custom de branche, et ce header couvre AUSSI les réponses non
    // HTML (API, images OG) que la meta robots ne protège pas.
    const isVercelPreview =
      !!process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production";
    const headers = isVercelPreview
      ? [
          ...SECURITY_HEADERS,
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ]
      : SECURITY_HEADERS;

    return [
      {
        // Catch-all explicite. `/(.*)`  est universel ; certaines versions de
        // path-to-regexp utilisées par Next n'attachent pas `/:path*` à la
        // racine `/`, ce qui laissait la home sans headers.
        source: "/:path*",
        headers,
      },
      {
        // Filet de sécurité explicite sur la racine.
        source: "/",
        headers,
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

