# Axessyo — Instructions pour Claude Code

## Contexte

Plateforme SaaS de gestion d'audits d'accessibilité numérique (RGAA, WCAG, RAWeb, RAAM). Successeur d'une application legacy en Symfony/Angular, refaite en stack moderne.

## Stack

- **Frontend** : Next.js 16 (App Router), React 19, TypeScript strict
- **Styling** : Tailwind CSS v4, Radix UI / shadcn (style React 19, sans forwardRef)
- **Backend** : Supabase (PostgreSQL + Auth + RLS)
- **Auth** : `@supabase/ssr` avec clés Legacy (`eyJhbGci...`), cookie storage explicite
- **Déploiement** : Vercel

## Conventions importantes

### Composants UI — TOUJOURS style React 19

Pas de `forwardRef`, pas de `displayName`, props directes :

```tsx
export function MyComponent({
  className,
  ...props
}: React.ComponentProps<typeof Primitive>) {
  return <Primitive className={cn("...", className)} {...props} />;
}
```

### Server Components vs Client Components

- Server Components par défaut (pas de `"use client"`)
- Server Actions dans des fichiers `actions.ts` avec `"use server"` en tête
- Client Components uniquement pour state/events/hooks

### Authentification

- Login via `signInWithPassword` côté **client** + `window.location.href = "/dashboard"` (les Server Actions ne marchent pas pour l'auth avec Next 16 + Turbopack)
- `requireProfile()` dans `src/lib/auth.ts` est tolérant : crée le profil à la volée si manquant

### RLS PostgreSQL

- Toutes les fonctions helpers en `SECURITY DEFINER` (sinon récursion infinie)
- Aucune policy RLS ne doit interroger directement la **même table** qu'elle protège (récursion) — passer par un helper `SECURITY DEFINER`
- `current_org()` est la source de vérité du tenant actif (lit `profiles.current_org_id`). Toutes les nouvelles policies multi-tenant doivent partir de là.

### Rôles utilisateur

Deux niveaux indépendants :

**Rôles plateforme** (`profiles.role`, legacy mais toujours actifs pour les writes) :
- `admin` — super-admin, court-circuit toutes les restrictions via `is_admin()`
- `auditor` — staff interne, peut éditer les audits assignés
- `client_admin` — admin côté client
- `client` — utilisateur côté client (read + remédiation)

**Rôles organisation** (`organization_members.role`, nouveau modèle multi-tenant) :
- `owner` (unique par org) > `admin` > `manager` > `member` > `viewer` > `guest`
- Helpers SQL : `is_member_of(org_id)`, `has_org_role(org_id, min_role)`

### Score d'accessibilité

Formule officielle RGAA dans `src/lib/score.ts` :
`score = (compliant / (totalCriteria - notApplicable)) * 100`

- 0–49 : non conforme · 50–99 : partielle · 100 : totale

### Pages obligatoires d'audit

À la création, on insère automatiquement 5 pages "MANDATORY" + 1 "TRANSVERSAL" (non supprimable). L'utilisateur peut supprimer **toutes les autres**, y compris les MANDATORY (cas des apps mobiles).

## Style attendu

- **Modifie directement les fichiers**, pas de copier-coller pour l'utilisateur
- Interface en **français**, code en anglais (variables, fonctions)
- Accessibilité native : `aria-*`, `role="alert"`, `<Label>` toujours associé à un input
- **Pas d'emojis dans le code** (sauf le 👋 du dashboard, volontaire)

## Erreurs déjà résolues — à NE PAS reproduire

1. **Récursion RLS** → toujours `SECURITY DEFINER` sur les helpers
2. **Cookies non lus par middleware** → `cookieOptions: { name: STORAGE_KEY }` partagé
3. **`React.forwardRef`** → utiliser le style React 19 (props directes)
4. **`typedRoutes` dans `experimental`** → c'est devenu une option racine dans Next 16
5. **Soumission de formulaire trop rapide** → bloquer Entrée hors textarea, `e.preventDefault()` si step !== final
6. **Clés i18n avec un `.`** → next-intl utilise le `.` comme séparateur de namespace. Toute clé contenant un `.` (ex. `"audit.view"`) doit être stockée en **objet imbriqué** ou avec un autre séparateur (`_`). Pareil pour les codes de permissions atomiques.
7. **Fichier `middleware.ts` déprécié en Next 16** → utiliser `src/proxy.ts` avec une fonction nommée `proxy`. L'export `middleware` lève un warning au démarrage.
8. **JWT custom claim côté Supabase Auth impossible** → Supabase ne propage pas nos cookies dans le JWT signé. Pour stocker un état "session-like" lu en SQL (ex. org active), passer par une colonne `profiles.*` plutôt qu'un claim.
9. **`audit_transition_workflow` / workflow éditorial** → totalement retiré. Ne pas le réintroduire — le cycle de vie métier `audit_status` suffit, et le statut de relecture par NC (`review_status`) gère la qualité.

## Fichiers structurants

- `src/types/domain.ts` — types métier (UserRole, OrgRole, Organization, etc.)
- `src/lib/score.ts` — formule officielle
- `src/lib/constants.ts` — labels FR
- `src/lib/permissions.ts` — matrice RBAC plateforme (helpers `can*`)
- `src/lib/server-permissions.ts` — garde `requirePermission()` pour server actions
- `src/lib/current-org.ts` — résolution de l'org active (cookie + DB)
- `src/lib/supabase/{client,server,middleware,storage-key}.ts` — clients Supabase
- `src/lib/auth.ts` — `requireProfile()`
- `src/lib/audit-status.ts` — matrice de transitions `audit_status` + conditions
- `supabase/migrations/` — schéma SQL (incrémentales, idempotentes)
- `src/app/api/cron/audit-status-auto/route.ts` — cron quotidien (Vercel)

## Architecture RBAC & Multi-tenant

Modèle à **4 axes orthogonaux** (cf. discussion design d'architecture) :

1. **Identité** (`profiles`) — qui est l'utilisateur
2. **Appartenance** (`organization_members`) — à quelles orgs avec quel rôle
3. **Plan / Quotas** (`subscriptions` + `plan_features`, phase 4) — ce que l'org peut faire
4. **Contexte d'action** (`audit_members` + ABAC) — ce qu'il peut faire sur **cette** ressource

L'autorisation finale = AND des 4 axes via le pipeline `authorize()` (auth → tenancy → plan → RBAC → ABAC).

### Phases du chantier RBAC

- [x] **Phase 1 — Tenancy** (migrations 42–44)
  - Tables `organizations`, `organization_members`
  - Helpers SQL `current_org()`, `is_member_of()`, `has_org_role()`, `my_organizations()`
  - Org "Axessyo Internal" (UUID `00000000-…-0001`) pour le staff plateforme
  - Backfill : 1 client legacy = 1 organization (id préservé)
  - OrgSwitcher dans la sidebar + page `/organizations`

- [x] **Phase 2 — Tenancy effective** (migrations 45–46)
  - `profiles.current_org_id` persistée + trigger anti-forge
  - `current_org()` réécrit pour lire depuis profiles (pas le JWT)
  - Bascule sémantique de `accessible_project_ids()` sur l'org active
  - Server action `switchOrganization` met à jour DB + cookie miroir
  - Page `/organizations/[slug]` (détails + membres)

- [x] **Phase 3 — Permissions atomiques** (migrations 47–48)
  - Tables `permissions` (catalogue) + `role_permissions` (mapping) côté DB, seed versionné
  - Helpers SQL `has_org_permission(code)`, `has_org_permission_on(code, org_id)`, `my_org_permissions()`
  - Mapping TS `ORG_PERMISSIONS` + `canOrg()` aligné sur le seed DB (source de vérité côté UI)
  - Helpers serveur `requireOrgPermission()` / `hasOrgPermission()` / `loadMyOrgPermissions()` dans `server-permissions.ts`
  - **Pas encore basculé** : les policies WRITE (audits/pages/NC) tournent toujours sur `is_auditor()` — la bascule se fera étape par étape pour éviter une coupure de service

- [x] **Phase 4 — Plans & abonnements** (migrations 49–51)
  - Tables `subscription_plans`, `plan_features`, `plan_limits`, `subscriptions` côté DB avec seed (Free / Starter / Pro / Enterprise)
  - Helpers SQL `current_org_plan()`, `org_has_feature(code)`, `org_limit(code)`, `org_within_limit(code, usage)`
  - Trigger `handle_new_organization()` qui crée automatiquement une subscription `free` à la création d'une org
  - Catalogue TS `PLANS` + `planHasFeature()` / `planLimit()` / `minPlanForFeature()` dans `lib/billing/plans.ts`
  - Helpers serveur `getCurrentOrgPlan()`, `orgHasFeature()`, `requireFeature()`, `orgWithinLimit()` dans `lib/billing/server.ts`
  - Intégration Stripe : client serveur-only (`lib/billing/stripe.ts`), webhook `/api/webhooks/stripe`, actions `startCheckout()` / `openCustomerPortal()`
  - Page `/organizations/[slug]/billing` (plan actuel + limites + comparateur 4 plans)
  - **Mode tolérant** : `isStripeReady()` permet à la plateforme de tourner sans clés Stripe (plan free uniquement). Les CTA d'upgrade affichent un message d'erreur tant que les clés ne sont pas posées
  - **À configurer côté infra** : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, puis remplir `stripe_product_id` / `stripe_price_id_monthly` / `stripe_price_id_yearly` dans la table `subscription_plans`
  - **Feature gates branchés (4.bis)** :
    - `export.pdf` (Starter+) — route `/api/audits/[uuid]/report` retourne 402 sans la feature + bouton client masqué via `orgHasFeature()` ; check **doublé serveur/UI** car l'API peut être appelée hors UI (curl/automatisation)
    - `remediation.simulator` (Starter+) — page `/audits/[uuid]/simulator` affiche `<FeatureUpsell />` à la place du composant
    - `audit.proofreading` (Pro+) — `assignProofreader()` refuse l'assignation sans la feature ; `requestNCReview()` refuse de démarrer un nouveau cycle (les transitions d'un cycle déjà ouvert restent accessibles pour ne pas verrouiller un downgrade)
    - `audit.collaboration` (Pro+) — `assignAuditor()` autorise UN auditeur (gratuit) puis refuse l'ajout d'un deuxième si le plan ne couvre pas la collaboration multi-auditeurs
    - Composant partagé `<FeatureUpsell />` dans `src/components/billing/feature-upsell.tsx` (i18n via `billing.upsell.*`)
  - **Pricing page publique** (`/pricing`) — livrée. Marketing accessible sans connexion, 4 cards de plans avec toggle mensuel/annuel + badge "économies", JSON-LD `Product/Offer` pour SEO, lien depuis nav et footer publics, ajout au sitemap. Bug latent corrigé au passage : le middleware redirigeait toutes les routes publiques sauf `/` et `/login` vers `/login` (`/legal`, `/privacy`, `/cookies`, `/pricing`). Whitelist explicite + ouverture des routes `/api/webhooks` (Stripe) et `/api/v1` (Bearer) qui s'authentifient autrement.
  - **Limites quantitatives** — livrées. Helpers `lib/billing/usage.ts` (`countActiveAuditsInOrg`, `countAuditsCreatedThisMonthInOrg`, `countMembersInOrg`, `getOrgUsageSnapshot`). `createAudit` refuse si `max_active_audits` ou `max_audits_per_month` atteints ; `inviteUser` refuse si `max_members` atteint (sur l'org cible = `clientId` ou `AXESSIO_INTERNAL_ORG_ID` selon le rôle). Page billing affiche "used / limit" avec progress bar et couleurs (warning ≥ 80 %, destructive si dépassé). Lecture des limites via le catalogue TS `PLANS[plan].limits[code]` (déterministe, aligné avec le seed SQL).
  - **Setup Stripe** — guide runbook complet dans [STRIPE-SETUP.md](STRIPE-SETUP.md) (création produits/prix, webhook, env vars Vercel, UPDATE SQL, test bout-en-bout, passage live, dépannage, checklist go-live). Aucun changement de code requis : tant que `STRIPE_SECRET_KEY` est absent, la plateforme tourne en mode tolérant (plan free uniquement).

- [x] **Phase 5 — Enterprise features** (livrée — sauf SSO/SCIM brancement IdP)
  - [x] **Custom branding** (migration 52) — colonnes `logo_url`, `primary_color`, `accent_color`, `support_email`, `custom_domain` sur `organizations` + helper SQL `current_org_branding()` gated par la feature `branding.custom`. Page `/organizations/[slug]/branding`, application des CSS vars + logo dans le layout via `<BrandingStyles />`. Conversion HEX → HSL côté serveur pour s'aligner sur Tailwind v4.
  - [x] **SSO/SCIM — schéma DB seul** (migration 53) — table `org_auth_methods` + enum `auth_provider` (password/saml/oidc/google/microsoft/scim) + RLS admin-only. **Pas d'intégration IdP** : à brancher plus tard sur WorkOS / Auth0 / Supabase SAML.
  - [x] **Webhooks sortants** (migrations 56–57) — tables `webhook_endpoints` + `webhook_deliveries`, helper SQL `enqueue_webhook(org_id, event, payload)`, triggers automatiques sur `non_conformities` (insert/status) et `audits` (status, dont event spécial `audit.delivered`). Dispatcher cron `/api/cron/webhook-dispatch` (every minute) avec back-off exponentiel, HMAC SHA-256 inspiré Stripe (header `X-Axessyo-Signature: t=...,v1=...`). UI `/organizations/[slug]/webhooks` : création + pause/reprise + rotation du secret + suppression. Gated par feature `webhooks.outgoing` (Pro/Enterprise).
  - [x] **API tokens scoped** (migration 58) — table `api_tokens` (token jamais stocké en clair, SHA-256 hex + préfixe public 12 chars + scopes[] + expires_at + revoked_at). Helpers SQL `validate_api_token(hash)` / `touch_api_token(id)`. Format `axe_live_<random>`. Middleware `authenticateApi()` + `requireScope()` dans `lib/api-tokens/auth.ts`. Endpoint exemple `GET /api/v1/audits` (scope `audits:read`, pagination cursor). UI `/organizations/[slug]/api-tokens` avec révélation unique du secret. Gated par feature `api.access` (Enterprise).
  - [x] **Audit log UI + export CSV** (migration 59) — colonne `audit_logs.organization_id` + backfill + trigger autofill, RLS étendue (admin/owner org voit tout). Page `/organizations/[slug]/audit-logs` : filtres (action via datalist, dates from/to), pagination 50/page, jointure avec `profiles` pour afficher le nom de l'acteur. Export CSV via server action (cap 10k lignes) gated par feature `audit_logs.export` (Pro+).

- [x] **Phase 6 — Workspaces** (migrations 54–55)
  - Tables `workspaces` (id, organization_id, slug citext, name, description, is_default, is_archived) + `workspace_members`
  - Réutilise l'enum `public.org_role` (même hiérarchie owner..guest)
  - Helpers SQL `has_workspace_access(ws_id)`, `has_workspace_role(ws_id, min_role)` (héritage : owner/admin de l'org surclasse), `my_workspaces()`
  - Trigger `handle_new_organization_workspace()` qui crée un workspace `default` à chaque création d'org + backfill des orgs existantes
  - Colonnes `workspace_id` ajoutées sur `projects` et `audits` avec backfill vers le workspace default + trigger `audits_sync_workspace()` (synchro à la création/changement de projet)
  - Helpers TS `loadMyWorkspaces()`, `loadWorkspacesOf(orgId)`, `getWorkspaceBySlug()` dans `lib/current-workspace.ts`
  - Page `/organizations/[slug]/workspaces` : liste + création/archivage/restauration
  - **Pas encore branché** : aucune policy RLS ne filtre par workspace_id pour l'instant (la phase 6 reste additive). La bascule (audits filtrés par workspace) sera une phase ultérieure si besoin

### Conventions RBAC à respecter

- **Jamais** de `role === 'admin'` inline. Toujours `can(user, action, context)` ou `requirePermission()`.
- **Toute** server action doit appeler `await requirePermission("...")` en premier.
- Toute table métier porte `organization_id NOT NULL` dès sa création.
- Tous les helpers RLS sont `SECURITY DEFINER` + `set search_path = public`.
- Une seule fonction `current_org()` ; un seul claim/cookie source.
- Migrations toujours idempotentes (`IF NOT EXISTS`, `DROP ... IF EXISTS`).

### Précédence des autorisations

Deux systèmes coexistent. **Pour toute nouvelle logique, la permission d'organisation prime ; `profiles.role` est legacy.**

1. **Source de vérité (nouveau code multi-tenant)** : permission atomique d'organisation.
   - UI : `canOrg(perms, "code")` (perms chargées via `loadMyOrgPermissions()`).
   - Server action : `await requireOrgPermission("code")` en tête d'action.
   - SQL/RLS : `has_org_permission('code')` / `has_org_permission_on('code', org_id)`.
2. **Legacy (à ne PAS étendre)** : `profiles.role` (`admin`/`auditor`/`client_admin`/`client`) via `canEditAudit()`, `canEditNC()`, `is_auditor()`, etc.
   - Encore actif car les policies WRITE (audits/pages/NC) tournent toujours dessus.
   - **Règle** : ne jamais introduire un nouveau check basé sur `role`.
   - `Profile.role` côté TS porte un rappel de cette précédence dans sa JSDoc (`src/types/domain.ts`). Pas de tag `@deprecated` brut : le champ sert aussi au rendu UI légitime (badge de rôle, bannière d'impersonation), un strike-through global serait trompeur.

> ⚠️ **NE PAS migrer mécaniquement les checks `profile.role` vers `requireOrgPermission()`** — c'est un piège à escalade de privilège, pas un refacto. Analyse (mai 2026) :
> - Le backfill (migration 43) a mappé : `client` → org `member`, `client_admin` → org `admin`/`owner`.
> - Or `ORG_PERMISSIONS[member]` contient `audit.edit`/`matrix.edit`/`nc.create`/`nc.edit`, alors que le `client` legacy ne les a PAS. Migrer les writes laisserait donc **les clients éditer audits/matrice/NC**, et les `client_admin` (org admin = toutes perms) gagneraient `user.manage`, `audit.delete`, etc.
> - Cause racine : les perms du `client` legacy correspondent **exactement** au rôle d'org `guest`, pas `member` — le mapping du backfill est trop généreux.
> - Décision : **statu quo** tant qu'on n'a pas tranché le modèle d'org cible. Une vraie bascule exige d'abord une migration data (re-mapper `client` → `guest` et/ou resserrer `ORG_PERMISSIONS[member]`), pas un simple find-replace.

## Roadmap produit (anciennes phases — historique)

- [x] Auth + Dashboard + Multi-tenant + RLS (legacy)
- [x] Création/édition d'audits + gestion de l'échantillon
- [x] Déploiement Vercel
- [x] Import RGAA / WCAG / RAWeb / RAAM
- [x] Matrice de saisie de conformité
- [x] Création/édition des non-conformités
- [x] Gestion des clients/projets/utilisateurs (CRUD)
- [x] Notifications (Resend + React Email)
- [x] Export PDF
- [ ] Export CSV / Excel
- [ ] Tests automatisés (Vitest + Playwright) — partiel

## Workflow avec l'utilisateur

L'utilisateur (Mario) n'est pas développeur. Il décrit ce qu'il veut, Claude Code modifie les fichiers, l'utilisateur teste. **Surtout pas de suggestions du genre "ajoutez ceci au fichier X" — modifie directement**.
