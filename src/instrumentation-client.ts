// Configuration Sentry - cote navigateur. Next 15.3+ charge ce fichier
// automatiquement sur chaque page (remplace l'ancien sentry.client.config.ts).
//
// Mode tolerant : sans `NEXT_PUBLIC_SENTRY_DSN`, SDK desactive, zero overhead.
//
// RGPD : le SDK n'est initialise QUE si l'utilisateur a accepte les cookies via
// <CookieConsentBanner /> (cle localStorage `axessyo_cookie_consent`). Au clic
// "Accepter", la banniere appelle initSentryClient() pour l'activer sans reload.
// La config d'init vit dans lib/sentry-client.ts (partagee avec la banniere).

import * as Sentry from "@sentry/nextjs";
import { getStoredConsent } from "@/lib/consent";
import { initSentryClient } from "@/lib/sentry-client";

if (getStoredConsent() === "accepted") {
  initSentryClient();
}

// Trace les transitions du router App Router (navigation client). Inerte tant
// que Sentry n'est pas initialise (pas de consentement).
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
