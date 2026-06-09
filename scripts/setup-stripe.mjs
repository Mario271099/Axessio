// Script de configuration Stripe — crée les produits + prix d'Axessyo et
// génère le SQL à coller dans Supabase.
//
// Usage (en local, jamais commit la clé) :
//   STRIPE_SECRET_KEY=sk_test_xxx node scripts/setup-stripe.mjs
//   # ou via npm :
//   STRIPE_SECRET_KEY=sk_test_xxx npm run stripe:setup
//
// Idempotent : relancer le script ne crée pas de doublons (il retrouve les
// produits par leur metadata `axessyo_plan` et les prix par montant/intervalle).
// Les montants sont alignés sur src/lib/billing/plans.ts — garder en sync.

import Stripe from "stripe";

const KEY = process.env.STRIPE_SECRET_KEY;
if (!KEY) {
  console.error(
    "\n✗ STRIPE_SECRET_KEY manquant.\n" +
      "  Lance : STRIPE_SECRET_KEY=sk_test_xxx node scripts/setup-stripe.mjs\n",
  );
  process.exit(1);
}
const MODE = KEY.startsWith("sk_live_") ? "LIVE" : "TEST";

const stripe = new Stripe(KEY);

// Montants en centimes d'euro (aligné sur plans.ts).
const PLANS = [
  {
    code: "starter",
    name: "Axessyo Starter",
    description: "Freelances et consultants indépendants",
    monthly: 3900, // 39 €
    yearly: 39000, // 390 €
  },
  {
    code: "pro",
    name: "Axessyo Pro",
    description: "Agences et équipes growth",
    monthly: 9900, // 99 €
    yearly: 99000, // 990 €
  },
];

async function findOrCreateProduct(plan) {
  // Recherche par metadata (list + filtre JS : consistance immédiate, contrairement
  // à products.search qui est indexé en différé).
  const existing = [];
  for await (const p of stripe.products.list({ limit: 100, active: true })) {
    if (p.metadata?.axessyo_plan === plan.code) existing.push(p);
  }
  if (existing.length > 0) {
    console.log(`  • produit réutilisé : ${existing[0].id} (${plan.name})`);
    return existing[0];
  }
  const created = await stripe.products.create({
    name: plan.name,
    description: plan.description,
    metadata: { axessyo_plan: plan.code },
  });
  console.log(`  • produit créé : ${created.id} (${plan.name})`);
  return created;
}

async function findOrCreatePrice(productId, interval, amount) {
  for await (const price of stripe.prices.list({
    product: productId,
    active: true,
    limit: 100,
  })) {
    if (
      price.recurring?.interval === interval &&
      price.unit_amount === amount &&
      price.currency === "eur"
    ) {
      console.log(`    - prix réutilisé (${interval}) : ${price.id}`);
      return price;
    }
  }
  const created = await stripe.prices.create({
    product: productId,
    currency: "eur",
    unit_amount: amount,
    recurring: { interval },
    metadata: { axessyo_interval: interval === "month" ? "monthly" : "yearly" },
  });
  console.log(`    - prix créé (${interval}) : ${created.id}`);
  return created;
}

async function main() {
  console.log(`\n=== Configuration Stripe Axessyo — mode ${MODE} ===\n`);
  const results = [];

  for (const plan of PLANS) {
    console.log(`Plan ${plan.code} :`);
    const product = await findOrCreateProduct(plan);
    const monthly = await findOrCreatePrice(product.id, "month", plan.monthly);
    const yearly = await findOrCreatePrice(product.id, "year", plan.yearly);
    results.push({
      code: plan.code,
      productId: product.id,
      monthlyId: monthly.id,
      yearlyId: yearly.id,
    });
    console.log("");
  }

  // ------------------------------------------------------------------
  // SQL prêt à coller dans Supabase → SQL Editor
  // ------------------------------------------------------------------
  console.log("=== SQL à exécuter dans Supabase (SQL Editor) ===\n");
  for (const r of results) {
    console.log(`update public.subscription_plans
   set stripe_product_id       = '${r.productId}',
       stripe_price_id_monthly = '${r.monthlyId}',
       stripe_price_id_yearly  = '${r.yearlyId}'
 where code = '${r.code}';\n`);
  }

  console.log("-- Vérification :");
  console.log(`select code, stripe_product_id, stripe_price_id_monthly, stripe_price_id_yearly
  from public.subscription_plans order by sort_order;\n`);

  console.log("=== Étapes restantes (cf. STRIPE-SETUP.md) ===");
  console.log("  1. Poser STRIPE_SECRET_KEY dans Vercel (Production/Preview/Development).");
  console.log("  2. Créer le webhook Stripe → /api/webhooks/stripe (6 events), poser STRIPE_WEBHOOK_SECRET.");
  console.log("  3. Activer le Customer Portal (Stripe → Settings → Billing → Customer portal).");
  console.log("  4. Redéployer Vercel, puis tester le checkout avec la carte 4242 4242 4242 4242.\n");
}

main().catch((err) => {
  console.error("\n✗ Échec :", err?.message ?? err);
  process.exit(1);
});
