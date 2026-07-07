# Mise en place de l'environnement de staging

Guide runbook pour monter un environnement de **staging** isolé de la production,
avant la mise en ligne publique d'Axessyo.

Architecture cible :

| Couche      | Production                     | Staging                                  |
| ----------- | ------------------------------ | ---------------------------------------- |
| Git / build | branche `main` → Vercel Prod   | branche `staging` → Vercel Preview       |
| Domaine     | `axessyo.com` (ou prod actuel) | `staging.axessyo.com`                    |
| Base        | projet Supabase prod           | **projet Supabase `axessio-staging`**    |
| Stripe      | clés `sk_live` (le jour J)     | clés `sk_test`                           |
| Emails      | Resend prod                    | Resend test                              |

> Principe : staging est **totalement isolé**. Aucune variable de staging ne
> doit pointer vers la base, Stripe ou Resend de production.

---

## 1. Créer le projet Supabase staging

1. [supabase.com](https://supabase.com) → **New project** → nom `axessio-staging`,
   **même région** que la prod (ex. `eu-west-3`).
2. Choisis un mot de passe DB et **note-le** (il sert au dump/restore).
3. Settings → API : récupère `URL`, `anon key`, `service_role key`.

## 2. Recréer le schéma dans staging (via dump CLI de la prod)

Le but : copier l'état **exact** du schéma de prod (tables, RLS, fonctions,
triggers, seeds référentiels) dans staging, sans rejouer les 82 migrations une
par une (certaines ont des numéros dupliqués/dans le désordre).

> Prérequis : Supabase CLI installé (déjà OK, v2.101.0) + Docker **non requis**
> pour `db dump` distant.

```bash
# 1. Se connecter au CLI (ouvre le navigateur)
supabase login

# 2. Récupérer le schéma de PROD (remplace <REF_PROD> par le project ref prod)
supabase link --project-ref <REF_PROD>
supabase db dump --linked -f schema-prod.sql            # structure
supabase db dump --linked --data-only \
  -f seed-ref.sql \
  --schema public                                       # données (optionnel)

# 3. Basculer le lien vers STAGING et pousser le schéma
supabase link --project-ref <REF_STAGING>
```

Puis applique `schema-prod.sql` dans staging :
- soit `psql "postgresql://postgres:<MDP>@db.<REF_STAGING>.supabase.co:5432/postgres" -f schema-prod.sql`
- soit copie/colle le contenu dans **SQL Editor** du projet staging.

> Les seeds référentiels (RGAA/WCAG/RAWeb/RAAM, plans, permissions) font partie
> du schéma migré. **Ne PAS** importer les vraies données clients de la prod en
> staging (RGPD) — repars d'une base vide côté métier, ou d'un jeu de test.

### Vérifier
Dans le SQL Editor staging, contrôle que les tables clés existent :
`organizations`, `organization_members`, `subscriptions`, `plan_features`,
`permissions`, `criteria` (référentiels remplis), `audit_logs`.

## 3. Régler l'Auth Supabase staging

Settings → **Authentication → URL Configuration** :
- **Site URL** : `https://staging.axessyo.com`
- **Redirect URLs** : ajoute `https://staging.axessyo.com/**`

Sans ça, les liens de reset mot de passe / confirmation d'email pointeront vers
le mauvais domaine (cf. flux email auth `/api/auth/confirm`).

## 4. Brancher la branche `staging` sur Vercel

1. La branche git `staging` existe déjà (créée depuis `main`).
2. Vercel → **Settings → Git** : déploiements de branche activés (par défaut oui).
3. Vercel → **Settings → Domains** : ajoute `staging.axessyo.com` et relie-le à
   la branche **`staging`** (Git Branch = `staging`).
4. DNS : crée un CNAME `staging` → `cname.vercel-dns.com` chez ton registrar.

## 5. Variables d'environnement Vercel (scope "Preview")

Pour chaque variable, Vercel demande l'environnement. Coche **Preview** uniquement
(et au besoin "Branch: staging"). Voir `.env.staging.example` pour la liste.

Minimum vital :
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` → projet **staging**
- `NEXT_PUBLIC_APP_URL` = `https://staging.axessyo.com`
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` → clés **test**
- `RESEND_API_KEY` / `RESEND_FROM_EMAIL` → test
- `CRON_SECRET` → secret staging (à dupliquer dans les secrets GitHub Actions si tu veux les crons en staging)

## 6. Stripe staging (mode test)

- Dashboard Stripe en mode **Test**.
- Crée un webhook `https://staging.axessyo.com/api/webhooks/stripe` (mêmes 6 événements que la prod, cf. STRIPE-SETUP.md).
- Pose `sk_test_*` et le `whsec_*` correspondant dans Vercel (Preview).
- Les `stripe_price_id_*` en DB staging doivent référencer des prix **test**.

## 7. Garder le staging hors des moteurs de recherche

Le staging doit rester `noindex` pour ne pas concurrencer la prod en SEO.
Vérifie que `NEXT_PUBLIC_APP_URL` ≠ domaine prod et que les tokens
`*_SITE_VERIFICATION` restent vides côté staging. (Au besoin, ajouter un
`X-Robots-Tag: noindex` global sur le domaine staging.)

## 8. Workflow de promotion

```
feature/* → (PR) → staging → (test sur staging.axessyo.com) → (PR/merge) → main → prod
```

1. Tu développes sur une branche `feat/*`.
2. Merge dans `staging` → déploiement auto sur `staging.axessyo.com`.
3. Tu testes en conditions réelles (vraie base staging, vrais emails de test).
4. Quand c'est validé, merge `staging` → `main` → déploiement prod.

## Dépannage

| Symptôme | Cause probable |
| --- | --- |
| Liens d'email pointent vers prod | Site URL Supabase staging mal réglée (étape 3) |
| 503 sur `/api/cron/*` en staging | `CRON_SECRET` absent côté Preview |
| Checkout Stripe échoue | clés `sk_test` / webhook test mal posés (étape 6) |
| Staging voit les données prod | une var Supabase pointe encore vers la prod — re-vérifier le scope "Preview" |
| Build OK mais 500 au runtime | `SUPABASE_SERVICE_ROLE_KEY` manquante ou de la prod |
