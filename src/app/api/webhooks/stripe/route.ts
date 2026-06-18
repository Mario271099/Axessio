// Webhook Stripe - point d'entrée unique pour synchroniser la table
// `subscriptions` avec l'état Stripe. Chaque événement est verifié via la
// signature HMAC, puis dispatch sur un handler typé.
//
// Le mapping des events est minimal (les 5 dont on a réellement besoin) :
//   - checkout.session.completed       → activer l'abonnement après checkout
//   - customer.subscription.updated    → MAJ plan / period / cancel_at
//   - customer.subscription.deleted    → repasser sur 'free'
//   - invoice.paid                     → marquer 'active'
//   - invoice.payment_failed           → marquer 'past_due'
//
// Aucun rendering - c'est une route API.

import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import Stripe from "stripe";
import { getStripe, getWebhookSecret } from "@/lib/billing/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Sécurité : Stripe envoie la signature dans le header. On lit la requête en
// raw bytes (pas req.json()) pour pouvoir recalculer le HMAC.
export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;
  try {
    const payload = await req.text();
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      getWebhookSecret(),
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "invalid payload";
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${msg}` },
      { status: 400 },
    );
  }

  try {
    await dispatch(event);
  } catch (err) {
    console.error("[stripe-webhook] handler error", err);
    // Un handler Stripe qui plante = désynchronisation facturation/DB
    // silencieuse. C'est exactement le genre d'erreur qu'on veut voir passer.
    Sentry.captureException(err, {
      tags: { source: "stripe-webhook", event_type: event.type },
    });
    // On renvoie 500 pour que Stripe retry - mais seulement après avoir
    // validé la signature : on ne veut pas être DoS-friendly côté CPU.
    return NextResponse.json({ error: "handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// ----------------------------------------------------------------------------
// Dispatch
// ----------------------------------------------------------------------------
async function dispatch(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
      return handleCheckoutCompleted(
        event.data.object as Stripe.Checkout.Session,
      );
    case "customer.subscription.created":
    case "customer.subscription.updated":
      return handleSubscriptionChanged(
        event.data.object as Stripe.Subscription,
      );
    case "customer.subscription.deleted":
      return handleSubscriptionDeleted(
        event.data.object as Stripe.Subscription,
      );
    case "invoice.paid":
      return handleInvoiceStatus(event.data.object as Stripe.Invoice, "active");
    case "invoice.payment_failed":
      return handleInvoiceStatus(
        event.data.object as Stripe.Invoice,
        "past_due",
      );
    default:
      // Ignorer silencieusement les événements non gérés.
      return;
  }
}

// ----------------------------------------------------------------------------
// Handlers
// ----------------------------------------------------------------------------
async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const orgId = session.metadata?.organization_id;
  const planCode = session.metadata?.plan_code;
  if (!orgId || !planCode) return;

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;
  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;
  if (!subscriptionId || !customerId) return;

  const stripe = getStripe();
  const sub = await stripe.subscriptions.retrieve(subscriptionId);

  const admin = createAdminClient();
  await admin
    .from("subscriptions")
    .upsert(
      {
        organization_id: orgId,
        plan_code: planCode,
        status: sub.status,
        billing_interval: deriveInterval(sub),
        current_period_start: secondsToIso(periodStart(sub)),
        current_period_end: secondsToIso(periodEnd(sub)),
        cancel_at_period_end: sub.cancel_at_period_end ?? false,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
      },
      { onConflict: "organization_id" },
    );
}

async function handleSubscriptionChanged(
  sub: Stripe.Subscription,
): Promise<void> {
  const customerId = typeof sub.customer === "string" ? sub.customer : null;
  if (!customerId) return;

  const admin = createAdminClient();
  // On préfère retrouver l'org via stripe_customer_id pour ne pas dépendre
  // de la metadata côté Stripe (qui peut manquer si la sub a été créée hors
  // checkout - ex. portal upgrade).
  const { data: row } = await admin
    .from("subscriptions")
    .select("organization_id, plan_code")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  if (!row) return;

  // Plan effectif : on le dérive du price ID de l'abonnement (source de vérité
  // côté Stripe). Indispensable pour les changements de plan via le Customer
  // Portal, où la metadata `plan_code` reste celle du checkout initial.
  // Fallbacks : metadata, puis plan actuel en base.
  const derived = await planCodeFromPrice(admin, sub);
  const planCode = derived ?? sub.metadata?.plan_code ?? row.plan_code;

  await admin
    .from("subscriptions")
    .update({
      plan_code: planCode,
      status: sub.status,
      billing_interval: deriveInterval(sub),
      current_period_start: secondsToIso(periodStart(sub)),
      current_period_end: secondsToIso(periodEnd(sub)),
      cancel_at_period_end: sub.cancel_at_period_end ?? false,
      stripe_subscription_id: sub.id,
    })
    .eq("organization_id", row.organization_id);
}

// Retrouve le code de plan correspondant au price de l'abonnement, en
// interrogeant subscription_plans (colonnes stripe_price_id_monthly/yearly).
// Retourne null si le price n'est rattaché à aucun plan connu.
async function planCodeFromPrice(
  admin: ReturnType<typeof createAdminClient>,
  sub: Stripe.Subscription,
): Promise<string | null> {
  const priceId = sub.items.data[0]?.price?.id;
  if (!priceId) return null;
  const { data } = await admin
    .from("subscription_plans")
    .select("code")
    .or(
      `stripe_price_id_monthly.eq.${priceId},stripe_price_id_yearly.eq.${priceId}`,
    )
    .maybeSingle();
  return (data?.code as string | undefined) ?? null;
}

async function handleSubscriptionDeleted(
  sub: Stripe.Subscription,
): Promise<void> {
  const customerId = typeof sub.customer === "string" ? sub.customer : null;
  if (!customerId) return;
  const admin = createAdminClient();
  await admin
    .from("subscriptions")
    .update({
      plan_code: "free",
      status: "canceled",
      billing_interval: null,
      cancel_at_period_end: false,
      stripe_subscription_id: null,
      current_period_start: null,
      current_period_end: null,
    })
    .eq("stripe_customer_id", customerId);
}

async function handleInvoiceStatus(
  invoice: Stripe.Invoice,
  status: "active" | "past_due",
): Promise<void> {
  const customerId =
    typeof invoice.customer === "string" ? invoice.customer : null;
  if (!customerId) return;
  const admin = createAdminClient();
  await admin
    .from("subscriptions")
    .update({ status })
    .eq("stripe_customer_id", customerId);
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------
function secondsToIso(seconds: number | null | undefined): string | null {
  if (!seconds) return null;
  return new Date(seconds * 1000).toISOString();
}

function deriveInterval(
  sub: Stripe.Subscription,
): "monthly" | "yearly" | null {
  const interval = sub.items.data[0]?.price.recurring?.interval;
  if (interval === "month") return "monthly";
  if (interval === "year") return "yearly";
  return null;
}

// Les types Stripe ont déplacé `current_period_start/end` sur les `items` en
// 2024. On lit les deux pour rester compatibles avec les anciennes subs.
function periodStart(sub: Stripe.Subscription): number | null {
  const fromItem = sub.items.data[0]?.current_period_start;
  if (typeof fromItem === "number") return fromItem;
  const fromSub = (sub as unknown as { current_period_start?: number })
    .current_period_start;
  return typeof fromSub === "number" ? fromSub : null;
}

function periodEnd(sub: Stripe.Subscription): number | null {
  const fromItem = sub.items.data[0]?.current_period_end;
  if (typeof fromItem === "number") return fromItem;
  const fromSub = (sub as unknown as { current_period_end?: number })
    .current_period_end;
  return typeof fromSub === "number" ? fromSub : null;
}
