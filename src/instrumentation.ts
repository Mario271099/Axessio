// Hook d'instrumentation Next.js — exécuté une fois au démarrage de chaque
// runtime serveur. Charge la config Sentry correspondante (Node ou Edge).
//
// `onRequestError` est le hook officiel Next 15+ : il capture toute erreur
// non gérée des Server Components, server actions et routes API — y compris
// celles que l'App Router avale silencieusement côté logs.

import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
