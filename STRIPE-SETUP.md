# Setup Stripe — guide pas-à-pas

Toute l'infrastructure technique est déjà en place côté code :

- Client Stripe ([src/lib/billing/stripe.ts](src/lib/billing/stripe.ts)) avec `isStripeReady()` pour fail-friendly
- Webhook signé ([src/app/api/webhooks/stripe/route.ts](src/app/api/webhooks/stripe/route.ts)) qui consomme 6 événements
- Server actions `startCheckout()` / `openCustomerPortal()` ([src/app/(dashboard)/organizations/[slug]/billing/actions.ts](src/app/(dashboard)/organizations/[slug]/billing/actions.ts))
- Table `subscription_plans` avec colonnes `stripe_product_id`, `stripe_price_id_monthly`, `stripe_price_id_yearly`

Tant que ces colonnes restent NULL et qu'il n'y a pas de `STRIPE_SECRET_KEY`, la plateforme tourne en **mode tolérant** : tous les comptes restent sur le plan `free`, les CTA "Choisir ce plan" renvoient une erreur claire. Pour activer les paiements, suis ce runbook.

---

## Prérequis

- Compte Stripe créé sur [stripe.com](https://stripe.com)
- Accès au projet Vercel
- Accès SQL Editor Supabase

---

## 0. Chemin rapide (recommandé) — script d'automatisation

Au lieu de créer les produits/prix à la main (sections 2-3-7), un script le fait
via l'API Stripe et te sort le SQL prêt à coller :

```bash
STRIPE_SECRET_KEY=sk_test_xxx npm run stripe:setup
```

Le script (idempotent — relançable sans créer de doublons) :
- crée les produits **Axessyo Starter** / **Axessyo Pro** + leurs prix mensuel/annuel ;
- affiche les `UPDATE subscription_plans ...` à coller dans Supabase (étape 7).

Il te reste alors **uniquement** : la clé/secret webhook (sections 4-5-6), le SQL
affiché (étape 7), l'activation du Customer Portal, et le redéploiement.

> Note plan Vercel : le webhook Stripe est une route API entrante classique
> (`POST /api/webhooks/stripe`) — il **fonctionne sur le plan Hobby**. La limite
> Hobby ne concerne que les crons sous-quotidiens, pas les webhooks entrants.

---

## 1. Rester en mode Test (recommandé pour démarrer)

En haut à droite du dashboard Stripe, vérifie que le toggle **"Mode test"** est actif. L'environnement test est complètement isolé du live :

- aucun débit réel
- cartes test fournies (`4242 4242 4242 4242`)
- tu peux casser des trucs sans conséquence

Quand tu seras prêt à charger de vrais clients, tu refais l'opération en mode live (cf. section "9. Passage en live").

---

## 2. Créer les produits

**Dashboard Stripe → Produits → "+ Créer un produit"**

### Produit 1 — Axessyo Starter
- Nom : `Axessyo Starter`
- Description (optionnelle) : `Freelances et petites équipes`
- Modèle de tarification : **Récurrent**

Créer **2 prix** sur ce produit (bouton "+ Ajouter un autre prix"):
- **Mensuel** : `29 €` / mois
- **Annuel** : `290 €` / an

### Produit 2 — Axessyo Pro
- Nom : `Axessyo Pro`
- Modèle : **Récurrent**

Créer **2 prix** :
- **Mensuel** : `99 €` / mois
- **Annuel** : `990 €` / an

> **Free et Enterprise n'ont PAS besoin de produit Stripe.**
> Free est gratuit (jamais de checkout). Enterprise passe par le `mailto:contact@axessyo.com` du site marketing.

---

## 3. Récupérer les IDs

Sur la page de chaque produit, copie les identifiants :

- `prod_XXXXXX` = ID produit (en haut à droite de la page)
- `price_XXXXXX` = ID prix (un par cycle de facturation, visible dans la liste des prix)

Tu auras 6 valeurs à noter :

| Plan | Product ID | Price monthly | Price yearly |
|---|---|---|---|
| Starter | `prod_…` | `price_…` | `price_…` |
| Pro | `prod_…` | `price_…` | `price_…` |

---

## 4. Récupérer la clé API secrète

**Dashboard → Développeurs → Clés API**

Copie la **Clé secrète standard** (commence par `sk_test_…` en mode test, ou `sk_live_…` en live).

> ⚠️ Ne pas confondre avec la "publishable key" (`pk_test_…`). On utilise UNIQUEMENT la secret côté serveur.

---

## 5. Configurer le webhook

**Dashboard → Développeurs → Webhooks → "+ Ajouter un endpoint"**

- **URL de l'endpoint** : `https://TON-DOMAINE.vercel.app/api/webhooks/stripe`
  (remplace par le domaine réel de ton déploiement Vercel)
- **Description** : libre (ex. "Axessyo prod" ou "Axessyo test")
- **Événements à écouter** : clique "Sélectionner les événements" et coche EXACTEMENT ces 6 :
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.paid`
  - `invoice.payment_failed`

Après création, ouvre l'endpoint et **révèle la signing secret** (bouton "Cliquer pour révéler"). Elle commence par `whsec_…`.

---

## 6. Poser les variables d'environnement dans Vercel

Vercel Dashboard → ton projet → **Settings → Environment Variables**.

Ajouter ces deux variables (cocher **Production**, **Preview**, **Development**) :

| Nom | Valeur |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_…` (ou `sk_live_…`) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` |

**Important** : après avoir ajouté les vars, va dans **Deployments** et clique sur "Redéployer" sur le dernier deploy. Les env vars ne sont lues qu'au démarrage du serveur — sans redéploiement, elles restent invisibles.

---

## 7. Mettre à jour les IDs Stripe en DB

Dans le **SQL Editor** Supabase, lance :

```sql
update public.subscription_plans
   set stripe_product_id        = 'prod_XXX_starter',
       stripe_price_id_monthly  = 'price_XXX_starter_monthly',
       stripe_price_id_yearly   = 'price_XXX_starter_yearly'
 where code = 'starter';

update public.subscription_plans
   set stripe_product_id        = 'prod_XXX_pro',
       stripe_price_id_monthly  = 'price_XXX_pro_monthly',
       stripe_price_id_yearly   = 'price_XXX_pro_yearly'
 where code = 'pro';
```

Remplace les `prod_XXX_*` et `price_XXX_*` par les vraies valeurs notées à l'étape 3.

Vérifie :

```sql
select code, stripe_product_id, stripe_price_id_monthly, stripe_price_id_yearly
  from public.subscription_plans
 order by sort_order;
```

Tu dois voir 4 lignes (free, starter, pro, enterprise) — free et enterprise gardent leurs colonnes NULL, starter et pro sont remplis.

---

## 8. Tester le flow complet

1. Se connecter en tant que **owner** ou **admin** d'une organisation
2. Aller sur `/organizations/<slug>/billing`
3. Cliquer **"Choisir mensuel"** sur le plan Starter
4. → Redirection vers Stripe Checkout (page Stripe brandée)
5. Remplir la carte de test :
   - **Numéro** : `4242 4242 4242 4242`
   - **Date d'expiration** : n'importe quelle date future (ex. `12/30`)
   - **CVC** : `123`
   - **Nom + email** : ce que tu veux
6. Cliquer "S'abonner"
7. → Redirection vers `/billing?checkout=success`
8. Quelques secondes plus tard, le webhook a mis à jour la subscription en `active` côté DB
9. Recharger la page billing : tu vois maintenant Starter actif avec son badge

### Vérifier que le webhook s'est bien déclenché

Stripe Dashboard → Webhooks → ton endpoint → onglet **"Tentatives"**. Tu vois la liste des événements envoyés avec leur code HTTP de retour :
- **200** : webhook traité avec succès ✅
- **400** : signature invalide (mauvais `STRIPE_WEBHOOK_SECRET`)
- **500** : erreur applicative (regarder les logs Vercel)

---

## 9. Passage en mode Live

Quand tu es prêt à charger de vrais clients :

1. Toggle **"Mode test" → "Mode live"** dans Stripe
2. **Refaire les étapes 2 → 5** en mode live :
   - Recréer les 2 produits + 4 prix (test/live sont isolés)
   - Récupérer la nouvelle `sk_live_…`
   - Recréer le webhook (même URL, mêmes événements)
   - Récupérer le nouveau `whsec_…`
3. Dans Vercel, **remplacer** les valeurs des env vars :
   - `STRIPE_SECRET_KEY=sk_live_…`
   - `STRIPE_WEBHOOK_SECRET=whsec_…` (de l'endpoint live)
4. **Redéployer** Vercel
5. **Mettre à jour la DB** avec les nouveaux IDs (UPDATE de l'étape 7)

> ⚠️ La `sk_live_…` est sensible : elle permet de débiter n'importe quel client de ton compte Stripe. Vercel la crypte automatiquement, mais ne la commit JAMAIS dans le code.

---

## 10. Tester localement (optionnel, avec Stripe CLI)

Pour développer le flow webhook sans déployer à chaque fois :

```bash
# Installer le CLI Stripe (une fois)
# Mac : brew install stripe/stripe-cli/stripe
# Windows : winget install Stripe.StripeCLI
# Linux : voir https://stripe.com/docs/stripe-cli#install

stripe login

# Forwarder les events Stripe test vers ton serveur local
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Le CLI affiche un `whsec_…` **différent** du dashboard. À mettre dans `.env.local` (pas en prod) :

```
STRIPE_WEBHOOK_SECRET=whsec_local_dev_XXX
```

Tu peux ensuite déclencher des events à la main pour tester :

```bash
stripe trigger checkout.session.completed
stripe trigger invoice.payment_failed
```

---

## 11. (Optionnel) Activer PayPal comme moyen de paiement

PayPal passe **par Stripe** — pas besoin d'un SDK PayPal séparé ni d'un second webhook. Stripe gère PayPal comme un moyen de paiement parmi d'autres, y compris pour les abonnements récurrents.

Le code de checkout ([actions.ts](src/app/(dashboard)/organizations/[slug]/billing/actions.ts)) ne fige **aucune** liste de moyens de paiement : il utilise les **« moyens de paiement automatiques »** pilotés depuis le Dashboard Stripe. Conséquence : PayPal apparaît tout seul sur la page de paiement dès qu'il est activé **et** éligible, et reste invisible sinon — la carte continue de fonctionner dans tous les cas.

### Activation

1. **Dashboard Stripe → Settings → Payment methods**
2. Cherche **PayPal** dans la liste → **Activer**.
3. C'est tout. Le bouton PayPal apparaît automatiquement sur Stripe Checkout, à côté de la carte.

Aucun changement de code, aucun nouvel événement webhook : Stripe envoie les **mêmes** événements (`checkout.session.completed`, `customer.subscription.*`, `invoice.*`) quel que soit le moyen de paiement. Toute la synchro DB existante continue de marcher.

### Éligibilité — à vérifier d'abord

PayPal **récurrent** via Stripe n'est pas disponible partout :

- Compte Stripe rattaché à l'**EEA / UK / Suisse**.
- Devise compatible (**EUR** ✅, GBP, etc.).
- Si PayPal n'apparaît pas dans *Settings → Payment methods*, ou est grisé, c'est que ton compte n'y est pas (encore) éligible — vérifie le pays du compte et la devise des prix.

> Tant que l'éligibilité n'est pas confirmée, **ne pas** coder en dur `payment_method_types: ["card", "paypal"]` dans `startCheckout()` : si PayPal n'est pas un moyen autorisé sur le compte, Stripe rejette la création de la session et **casse aussi le paiement par carte**. Le mode automatique (config Dashboard) est volontairement choisi pour éviter ça.

### Tester

Même flow qu'en section 8, mais sur la page Stripe Checkout tu choisis **PayPal** au lieu de la carte. En mode test, Stripe ouvre un sandbox PayPal simulé (pas de vrai compte requis).

---

## Dépannage

### "Le paiement n'est pas encore configuré sur cette instance"
→ `STRIPE_SECRET_KEY` absent dans Vercel. Pose-la et redéploie.

### "Ce plan n'a pas de prix Stripe configuré"
→ Tu as oublié l'UPDATE de l'étape 7, ou le `plan_code` envoyé ne correspond pas. Vérifie :
```sql
select code, stripe_price_id_monthly from subscription_plans;
```

### Webhook reçoit 400 "Webhook signature verification failed"
→ `STRIPE_WEBHOOK_SECRET` ne matche pas le secret de l'endpoint Stripe. Recopie-le depuis Dashboard → Webhooks → ton endpoint → "Révéler la signing secret".

### Webhook reçoit 200 mais la subscription n'est pas mise à jour
→ Regarde les logs Vercel. Le handler peut avoir échoué silencieusement (table introuvable, colonne manquante, erreur RLS). Le webhook a un `try/catch` qui log et renvoie 500 — vérifie qu'il n'a pas absorbé une erreur.

### Le checkout redirige vers une URL `https://localhost:3000/...`
→ `NEXT_PUBLIC_APP_URL` n'est pas posée (ou pose `http://localhost:3000` en prod). Pose-la dans Vercel sur le domaine réel : `NEXT_PUBLIC_APP_URL=https://axessyo.com`.

### Le Customer Portal ne s'ouvre pas
→ Stripe demande qu'on **active le Customer Portal** une fois manuellement : Dashboard → Settings → Billing → **Customer portal** → activer les options qu'on autorise (annulation, mise à jour CB, etc.). Sinon `billingPortal.sessions.create` renvoie une erreur.

---

## Cas particuliers à connaître

### Free → Starter (premier paiement)
1. User clique "Choisir mensuel" sur la page billing
2. `startCheckout()` crée un Customer Stripe si pas déjà existant, stocke `stripe_customer_id` côté subscription
3. Redirige vers Stripe Checkout
4. Webhook `checkout.session.completed` met `plan_code='starter'`, `status='active'`, `stripe_subscription_id`

### Upgrade Starter → Pro
1. User clique sur le bouton "Gérer l'abonnement" qui ouvre le Customer Portal
2. Dans le portal, il change de plan
3. Webhook `customer.subscription.updated` met `plan_code='pro'`
4. Le nouveau plan est **dérivé du price ID** de l'abonnement (`handleSubscriptionChanged` → `planCodeFromPrice`, qui interroge `subscription_plans`). La metadata `plan_code` n'étant pas mise à jour par le portal, c'est le price ID qui fait foi. **Prérequis** : les `stripe_price_id_monthly/yearly` doivent être renseignés en base (étape 7) — sinon le plan ne peut pas être dérivé et reste inchangé.

### Annulation
1. User → Customer Portal → "Annuler l'abonnement"
2. Stripe garde la sub active jusqu'à la fin de période (`cancel_at_period_end=true`)
3. À la fin de période, événement `customer.subscription.deleted` → on repasse l'org sur `plan_code='free'`, `status='canceled'`

### Échec de paiement
1. Stripe tente de recharger 3 fois sur 2 semaines (config par défaut)
2. À chaque échec, événement `invoice.payment_failed` → on met `status='past_due'`
3. Quand Stripe abandonne, événement `customer.subscription.deleted` → retour sur `free`

---

## Checklist finale avant le go-live

- [ ] Mode Live activé dans Stripe
- [ ] 2 produits + 4 prix créés en mode Live
- [ ] `STRIPE_SECRET_KEY=sk_live_…` dans Vercel
- [ ] Webhook créé sur l'URL prod avec les 6 événements
- [ ] `STRIPE_WEBHOOK_SECRET=whsec_…` dans Vercel
- [ ] `NEXT_PUBLIC_APP_URL=https://axessyo.com` (ton vrai domaine)
- [ ] UPDATE SQL des `stripe_*_id` dans `subscription_plans`
- [ ] Customer Portal activé côté Stripe (Settings → Billing → Customer portal)
- [ ] Redéploiement Vercel effectué
- [ ] Test bout-en-bout : checkout avec une vraie carte (et remboursement immédiat depuis Stripe Dashboard)
- [ ] Page `/pricing` publique vérifiée (les CTA Starter/Pro fonctionnent)
- [ ] Conditions générales / Mentions légales à jour (TVA, droit de rétractation, etc.)
