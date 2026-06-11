// Configuration Sentry — runtime Node.js (Server Components, server actions,
// routes API). Chargée par `src/instrumentation.ts` au démarrage du serveur.
//
// Mode tolérant : sans DSN (`NEXT_PUBLIC_SENTRY_DSN`), le SDK est désactivé et
// tous les appels capture* sont des no-ops — la plateforme tourne normalement.
// Poser la variable dans Vercel suffit à activer l'observabilité.

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),

  // Toutes les erreurs sont envoyées (sampleRate par défaut = 1), mais on ne
  // trace que 10 % des transactions pour rester dans le quota free tier.
  tracesSampleRate: 0.1,

  // `production` / `preview` / `development` sur Vercel, NODE_ENV en local.
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,

  // Pas de PII automatique (IP, headers) : les events ne portent que l'id
  // utilisateur posé explicitement dans requireProfile.
  sendDefaultPii: false,
});
