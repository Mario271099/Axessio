// Init Sentry cote navigateur, conditionnee au consentement cookies.
// Appelee depuis instrumentation-client.ts au chargement (si l'utilisateur a
// deja accepte) et depuis <CookieConsentBanner /> au moment ou il accepte
// (pour activer le SDK sans recharger la page).

import * as Sentry from "@sentry/nextjs";

let initialized = false;

export function initSentryClient(): void {
  // Idempotent : la banniere et l'instrumentation peuvent toutes deux appeler.
  if (initialized) return;

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  // Mode tolerant : sans DSN, aucun SDK (zero overhead).
  if (!dsn) return;

  initialized = true;

  Sentry.init({
    dsn,
    enabled: true,

    // 10 % des transactions de navigation - suffisant pour reperer une page
    // lente, sans consommer le quota free tier.
    tracesSampleRate: 0.1,

    // Pas de session replay : couteux en quota et inutile a ce stade.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,

    environment: process.env.NODE_ENV,
    sendDefaultPii: false,
  });
}
