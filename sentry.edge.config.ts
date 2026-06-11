// Configuration Sentry — runtime Edge (le proxy/middleware `src/proxy.ts`).
// Chargée par `src/instrumentation.ts`. Même mode tolérant que le serveur :
// sans DSN, SDK désactivé, zéro impact.

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  tracesSampleRate: 0.1,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  sendDefaultPii: false,
});
