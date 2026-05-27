// Client Stripe — strictement serveur. Ne JAMAIS importer côté client.
//
// Le module est tolérant à l'absence des clés Stripe : si `STRIPE_SECRET_KEY`
// est manquante, `getStripe()` lève une erreur explicite et `isStripeReady()`
// renvoie false. Ça permet à la plateforme de tourner en mode 'free' sans
// configuration Stripe (utile en dev local et pour le bootstrap).

import "server-only";
import Stripe from "stripe";

let _client: Stripe | null = null;

export function isStripeReady(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error(
      "STRIPE_SECRET_KEY manquant — configurer la variable d'environnement avant d'appeler getStripe().",
    );
  }
  if (!_client) {
    _client = new Stripe(process.env.STRIPE_SECRET_KEY, {
      // On laisse Stripe choisir la version d'API "latest stable" pour ne pas
      // se figer sur une version obsolète au prochain rebuild.
      typescript: true,
    });
  }
  return _client;
}

/** Secret partagé pour vérifier la signature des webhooks Stripe. */
export function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error(
      "STRIPE_WEBHOOK_SECRET manquant — impossible de vérifier les webhooks.",
    );
  }
  return secret;
}
