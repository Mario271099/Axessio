"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, isStripeReady } from "@/lib/billing/stripe";
import type { PlanCode } from "@/lib/billing/plans";

export interface BillingActionResult {
  error: string | null;
  url?: string;
}

// ----------------------------------------------------------------------------
// Checkout - démarre une session Stripe Checkout pour upgrade
// ----------------------------------------------------------------------------
export async function startCheckout(
  organizationId: string,
  planCode: Exclude<PlanCode, "free" | "enterprise">,
  billingInterval: "monthly" | "yearly",
): Promise<BillingActionResult> {
  const supabase = await createClient();
  const t = await getTranslations("errors");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: t("notAuthenticated") };

  if (!isStripeReady()) {
    return { error: t("stripeNotConfigured") };
  }

  // L'utilisateur doit être admin/owner de l'org cible.
  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return { error: t("forbidden") };
  }

  // Récupération du price_id stocké en DB (seedé par les migrations Stripe).
  const { data: plan } = await supabase
    .from("subscription_plans")
    .select("stripe_price_id_monthly, stripe_price_id_yearly")
    .eq("code", planCode)
    .maybeSingle();

  const priceId =
    billingInterval === "yearly"
      ? plan?.stripe_price_id_yearly
      : plan?.stripe_price_id_monthly;
  if (!priceId) return { error: t("planUnavailable") };

  // Récupération / création du customer Stripe associé à l'org.
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("organization_id", organizationId)
    .maybeSingle();

  const stripe = getStripe();
  let customerId = existing?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { organization_id: organizationId },
    });
    customerId = customer.id;
    await admin
      .from("subscriptions")
      .update({ stripe_customer_id: customerId })
      .eq("organization_id", organizationId);
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { data: org } = await supabase
    .from("organizations")
    .select("slug")
    .eq("id", organizationId)
    .maybeSingle();
  const returnPath = org ? `/organizations/${org.slug}/billing` : "/";

  // NB: on ne renseigne PAS `payment_method_types`. Stripe utilise alors les
  // « moyens de paiement automatiques » configurés dans le Dashboard. C'est ce
  // qui permet d'activer PayPal (ou un autre moyen) sans toucher au code : il
  // suffit de l'activer côté Dashboard (cf. STRIPE-SETUP.md §11). Ne PAS coder
  // en dur ["card", "paypal"] : si le compte n'est pas éligible à PayPal, Stripe
  // rejette la session et casse aussi le paiement par carte.
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}${returnPath}?checkout=success`,
    cancel_url: `${baseUrl}${returnPath}?checkout=cancel`,
    subscription_data: {
      metadata: { organization_id: organizationId, plan_code: planCode },
    },
    metadata: { organization_id: organizationId, plan_code: planCode },
    allow_promotion_codes: true,
  });

  if (!session.url) return { error: t("checkoutFailed") };
  redirect(session.url);
}

// ----------------------------------------------------------------------------
// Customer Portal - l'utilisateur gère lui-même son abonnement
// ----------------------------------------------------------------------------
export async function openCustomerPortal(
  organizationId: string,
): Promise<BillingActionResult> {
  const supabase = await createClient();
  const t = await getTranslations("errors");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: t("notAuthenticated") };

  if (!isStripeReady()) {
    return { error: t("stripeNotConfigured") };
  }

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return { error: t("forbidden") };
  }

  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (!sub?.stripe_customer_id) {
    return { error: t("noCustomer") };
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { data: org } = await supabase
    .from("organizations")
    .select("slug")
    .eq("id", organizationId)
    .maybeSingle();
  const returnUrl = `${baseUrl}/organizations/${org?.slug ?? ""}/billing`;

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: returnUrl,
  });

  redirect(session.url);
}

// ----------------------------------------------------------------------------
// Revalidation post-checkout
// ----------------------------------------------------------------------------
export async function refreshBilling(slug: string): Promise<void> {
  revalidatePath(`/organizations/${slug}/billing`);
}
