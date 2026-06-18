// Configuration Sentry - côté navigateur. Next 15.3+ charge ce fichier
// automatiquement sur chaque page (remplace l'ancien sentry.client.config.ts).
//
// Mode tolérant : sans `NEXT_PUBLIC_SENTRY_DSN`, SDK désactivé, zéro overhead.

import * as Sentry from "@sentry/nextjs";

// TODO(consent): conditionner l'init au consentement cookies stocke par
// <CookieConsentBanner /> (localStorage `axessyo_cookie_consent`). Tant que ce
// branchement n'est pas fait, Sentry reste pilote uniquement par le DSN.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),

  // 10 % des transactions de navigation - suffisant pour repérer une page
  // lente, sans consommer le quota free tier.
  tracesSampleRate: 0.1,

  // Pas de session replay : coûteux en quota et inutile à ce stade.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  environment: process.env.NODE_ENV,
  sendDefaultPii: false,
});

// Trace les transitions du router App Router (navigation client).
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
