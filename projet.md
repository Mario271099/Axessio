# Axessyo — Récapitulatif complet du projet

> Document de référence. Maintenu à jour quand la roadmap évolue.
> Pour les conventions techniques précises, voir [CLAUDE.md](CLAUDE.md).
> Pour le runbook Stripe, voir [STRIPE-SETUP.md](STRIPE-SETUP.md).

---

## 1. Vue d'ensemble

**Axessyo** est une plateforme SaaS multi-tenant de **gestion d'audits d'accessibilité numérique**.

Elle adresse les normes officielles :

- **RGAA 4.1.2** (référentiel français)
- **WCAG 2.2** (international)
- **RAWeb 1.0** (référentiel public français)
- **RAAM 1.0** (mobile)
- **EN 301 549** (européen)
- **PDF/UA** (documents PDF)

Cible :

- **Auditeurs internes / freelances** : pilotage de bout en bout d'audits commandités
- **Agences d'accessibilité** : workflow multi-auditeurs, relecture interne, livraison client
- **Équipes growth** : audits internes itératifs, ré-évaluations
- **Grandes entreprises** : SSO, API, branding, conformité

---

## 2. Stack technique

| Couche            | Choix                                                                                         |
| ----------------- | --------------------------------------------------------------------------------------------- |
| **Frontend**      | Next.js 16 (App Router), React 19, TypeScript strict                                          |
| **Styling**       | Tailwind CSS v4 (CSS-first config), Radix UI / shadcn (style React 19, **sans `forwardRef`**) |
| **Backend**       | Supabase (PostgreSQL 17 + Auth + RLS + Storage)                                               |
| **Auth**          | `@supabase/ssr` avec clés Legacy `eyJhbGci…`, cookie storage explicite                        |
| **Email**         | Resend + React Email (templates JSX)                                                          |
| **PDF**           | Puppeteer-core + `@sparticuz/chromium` (serverless)                                           |
| **Paiement**      | Stripe (Checkout + Customer Portal + webhooks)                                                |
| **i18n**          | next-intl (FR + EN, locale persistée en cookie)                                               |
| **Hébergement**   | Vercel (Node runtime, crons natifs)                                                           |
| **Tests**         | Vitest (unit) + Playwright (E2E)                                                              |
| **Lint / format** | ESLint (next-config) + tsc --noEmit pour TS                                                   |

Versions verrouillées : Next 16.2, React 19, Node ≥ 20, TypeScript 5.7.

---

## 3. Architecture multi-tenant et RBAC

Axessyo applique un **modèle à 4 axes orthogonaux** pour l'autorisation :

```
1. Identité          → qui est l'utilisateur ? (profiles + auth.users)
2. Appartenance      → à quelles orgs avec quel rôle ? (organization_members)
3. Plan / Quotas     → ce que l'org peut faire (subscriptions + plan_features + plan_limits)
4. Contexte d'action → ce qu'il peut faire SUR CETTE RESSOURCE (audit_assignees + ABAC)
```

L'autorisation finale = **AND** des 4 axes via le pipeline `authorize()` (auth → tenancy → plan → RBAC → ABAC).

### 3.1 Tenancy

- Une **organisation** est la racine du tenant. Trois sources : (a) le staff Axessyo (org interne `00000000-…-0001`), (b) les anciens clients legacy backfillés en orgs (id préservé), (c) les nouvelles orgs créées par self-onboarding.
- Un **utilisateur** appartient à 1..N orgs via `organization_members`.
- L'**org active** d'un utilisateur est persistée dans `profiles.current_org_id` (lue par la fonction SQL `current_org()` qui sert de source de vérité à la RLS). Mirror côté cookie HTTP-only pour minimiser les round-trips.
- Un **workspace** est une sous-division d'une org (équipes, portefeuilles client). Tout audit/project porte un `workspace_id` (workspace `default` créé automatiquement à la création de l'org).

### 3.2 Permissions atomiques

- 18 codes atomiques (`audit.view`, `nc.create`, `user.manage`, etc.) catalogués dans `permissions` (DB) + `ALL_PERMISSIONS` (TS).
- Matrice `org_role → permission` dans `role_permissions` (DB) + `ORG_PERMISSIONS` (TS), **strictement alignées**.
- Helper SQL `has_org_permission(code)` + helper TS `canOrg(role, permission)`.

### 3.3 Plans et features

Voir section 6 ci-dessous.

### 3.4 ABAC (Attribute-Based Access Control)

- `audit_assignees` : qui peut éditer un audit spécifique (rôles `auditor` + `proofreader`).
- Permet la **collaboration multi-auditeurs** et la **relecture interne** (NC review_status).

---

## 4. Modèle de données

60 migrations SQL incrémentales, idempotentes (`IF NOT EXISTS`, `ON CONFLICT`, `DROP … IF EXISTS`). Versionnées dans `supabase/migrations/`.

### Tables core (init schema 00)

| Table               | Rôle                                                                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `clients`           | Legacy : organisations client. Conservé pour compatibilité, mappé 1:1 sur `organizations`.                                           |
| `profiles`          | Extension de `auth.users` : `email, first_name, last_name, role, client_id, language, is_active, current_org_id`.                    |
| `projects`          | Sites/apps à auditer, appartiennent à un client + une org + un workspace.                                                            |
| `project_members`   | Membres client assignés à un projet spécifique.                                                                                      |
| `references`        | Référentiels d'accessibilité (RGAA, WCAG…). Données globales.                                                                        |
| `thematics`         | Sections d'un référentiel (ex : "Images", "Cadres").                                                                                 |
| `criteria`          | Critères à évaluer (~106 pour RGAA). Globales.                                                                                       |
| `tests`             | Sous-tests détaillant chaque critère.                                                                                                |
| `audits`            | Le cœur : 1 audit = 1 projet × 1 référentiel × 1 cycle. Porte `status, language, scores, dates clés, organization_id, workspace_id`. |
| `audit_assignees`   | Utilisateurs assignés (`auditor` ou `proofreader`) à un audit.                                                                       |
| `pages`             | Échantillon de pages auditées (MANDATORY/REPRESENTATIVE/TRANSVERSAL).                                                                |
| `page_conformities` | Statut conforme/non-conforme/non-applicable par page × critère.                                                                      |
| `non_conformities`  | Anomalies relevées. Porte `display_number` séquentiel, `status, severity, review_status`.                                            |
| `nc_attachments`    | Pièces jointes des NC (captures, vidéos).                                                                                            |
| `nc_messages`       | Fil de discussion sur une NC (threads `client` ou `review`).                                                                         |

### Tables tenancy (Phase 1-2, migrations 42-46)

| Table                  | Rôle                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------- |
| `organizations`        | Org racine (`id, slug, name, type, billing_email, data_residency, branding columns`). |
| `organization_members` | `(org_id, user_id, role)` avec contrainte 1 seul `owner` par org.                     |

### Tables RBAC atomique (Phase 3, migrations 47-48)

| Table              | Rôle                                                                                |
| ------------------ | ----------------------------------------------------------------------------------- |
| `permissions`      | Catalogue immuable des 18 codes atomiques.                                          |
| `role_permissions` | Mapping `(scope, role_code, permission)`. Scope = 'org', 'platform' ou 'workspace'. |

### Tables billing (Phase 4, migrations 49-51)

| Table                | Rôle                                                                 |
| -------------------- | -------------------------------------------------------------------- |
| `subscription_plans` | 4 plans seed : free, starter, pro, enterprise + colonnes Stripe.     |
| `plan_features`      | Many-to-many plan → feature flag (`export.pdf`, `sso.saml`, etc.).   |
| `plan_limits`        | Many-to-many plan → limite quantitative (`max_active_audits`, etc.). |
| `subscriptions`      | 1 ligne par org : plan actuel, statut Stripe, customer_id, période.  |

### Tables enterprise (Phase 5, migrations 52-58)

| Table                                                                               | Rôle                                                                                               |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `organizations.logo_url, primary_color, accent_color, support_email, custom_domain` | Branding custom (gated `branding.custom`).                                                         |
| `org_auth_methods`                                                                  | Schéma SSO/SCIM placeholder (provider SAML/OIDC/Google/Microsoft/SCIM). **Pas d'intégration IdP.** |
| `webhook_endpoints` + `webhook_deliveries`                                          | Webhooks sortants signés HMAC SHA-256.                                                             |
| `api_tokens`                                                                        | Tokens Bearer scoped (hash SHA-256, jamais en clair).                                              |

### Tables workspaces (Phase 6, migrations 54-55)

| Table               | Rôle                                                                      |
| ------------------- | ------------------------------------------------------------------------- |
| `workspaces`        | Sous-divisions d'org. 1 `default` auto-créé par org.                      |
| `workspace_members` | Memberships explicites + héritage automatique pour les owner/admin d'org. |

### Tables transverses

| Table           | Rôle                                                                                     |
| --------------- | ---------------------------------------------------------------------------------------- |
| `audit_logs`    | Append-only. Trace toutes les actions sensibles. `organization_id` autofill via trigger. |
| `notifications` | Notifications in-app (assignation, review demandée, etc.).                               |

---

## 5. Rôles utilisateur

Deux niveaux **orthogonaux** (un user a UN rôle plateforme + UN rôle par org dont il est membre).

### 5.1 Rôles plateforme (`profiles.role`) — legacy, toujours actifs

| Rôle           | Rôle métier                                                                   |
| -------------- | ----------------------------------------------------------------------------- |
| `admin`        | Super-admin Axessyo. Court-circuite toutes les restrictions via `is_admin()`. |
| `auditor`      | Staff interne Axessyo. Peut éditer les audits assignés.                       |
| `client_admin` | Admin côté client. Lecture audit + assignation auditeur.                      |
| `client`       | Utilisateur côté client. Lecture + remédiation + chat.                        |

### 5.2 Rôles organisation (`organization_members.role`) — nouveau modèle multi-tenant

Hiérarchie stricte (du plus fort au plus faible) :

| Rôle      | Permissions accordées                                                                     |
| --------- | ----------------------------------------------------------------------------------------- |
| `owner`   | Toutes les permissions du catalogue (18). Unique par org.                                 |
| `admin`   | Toutes les permissions sauf futurs droits "owner-only" (transfert de propriété).          |
| `manager` | Édite audits + matrice + NC + assigne auditeurs + gère projets. **Pas** de `user.manage`. |
| `member`  | Contribue : crée/édite NC, édite matrice. **Pas** de `nc.delete` ni `audit.delete`.       |
| `viewer`  | Lecture seule : `audit.view + remediation.view + chat.read`.                              |
| `guest`   | Accès restreint : audit.view + nc.update_status_client + chat.                            |

Helper TS `orgRoleAtLeast(role, min)` permet la comparaison hiérarchique sans round-trip DB.

### 5.3 Conventions de check

- **Jamais** de `role === 'admin'` inline. Toujours `can(user, action)` ou `requirePermission()`.
- **Toute** server action doit appeler `await requirePermission("…")` ou `requireOrgPermission("…")` en premier.
- Côté SQL, helpers `is_admin()`, `is_member_of()`, `has_org_role()`, `has_org_permission()`.

---

## 6. Plans et abonnements

### 6.1 Catalogue des 4 plans

| Plan           | Prix                 | Cible          | Limites                                   | Features clés                                           |
| -------------- | -------------------- | -------------- | ----------------------------------------- | ------------------------------------------------------- |
| **Free**       | 0 €                  | Découverte     | 2 membres · 1 audit actif · 2 audits/mois | (aucune)                                                |
| **Starter**    | 29 €/mois (290 €/an) | Freelances     | 5 membres · 10 actifs · 20/mois           | export PDF, simulateur                                  |
| **Pro**        | 99 €/mois (990 €/an) | Agences        | 25 membres · illimité audits              | + relecture, collaboration, audit_logs export, webhooks |
| **Enterprise** | Sur devis            | Grands comptes | Illimité partout                          | + SSO, SCIM, API, branding, support prio                |

Catalogue côté TS dans `src/lib/billing/plans.ts`, **strictement aligné** avec le seed SQL (migration 49). Tests unitaires garantissent l'alignement (`src/lib/billing/plans.test.ts`).

### 6.2 Feature gates branchés dans le code

Toutes les server actions sensibles appellent `requireFeature(code)` en tête, et les server pages affichent un `<FeatureUpsell />` quand la feature n'est pas accessible.

| Feature                                                         | Plan min   | Où c'est appliqué                                                                      |
| --------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------- |
| `export.pdf`                                                    | Starter    | `/api/audits/[uuid]/report` retourne 402 ; bouton client masqué                        |
| `remediation.simulator`                                         | Starter    | Page `/audits/[uuid]/simulator` affiche upsell                                         |
| `audit.proofreading`                                            | Pro        | `assignProofreader()` refuse ; `requestNCReview()` refuse de démarrer un nouveau cycle |
| `audit.collaboration`                                           | Pro        | `assignAuditor()` autorise 1 auditeur puis refuse le 2ème                              |
| `audit_logs.export`                                             | Pro        | Export CSV de la page `/organizations/[slug]/audit-logs`                               |
| `webhooks.outgoing`                                             | Pro        | Page `/organizations/[slug]/webhooks`                                                  |
| `api.access`                                                    | Enterprise | Page `/organizations/[slug]/api-tokens`                                                |
| `branding.custom`                                               | Enterprise | Page `/organizations/[slug]/branding`                                                  |
| `sso.saml`, `sso.oidc`, `scim.provisioning`, `support.priority` | Enterprise | Schémas DB en place, pas d'UI active                                                   |

### 6.3 Limites quantitatives appliquées

- **`createAudit`** vérifie `max_active_audits` (audits non terminaux) + `max_audits_per_month` (créés depuis le 1er du mois) sur l'org du projet.
- **`inviteUser`** vérifie `max_members` sur l'org cible (= `clientId` ou `AXESSIO_INTERNAL_ORG_ID` selon le rôle invité).
- Page billing affiche `used / limit` avec barre de progression colorée (warning ≥ 80 %, destructive ≥ 100 %).

Helpers dans `src/lib/billing/usage.ts` : `countActiveAuditsInOrg`, `countAuditsCreatedThisMonthInOrg`, `countMembersInOrg`, `getOrgUsageSnapshot`.

### 6.4 Intégration Stripe

- Client serveur-only (`src/lib/billing/stripe.ts`) avec `isStripeReady()` → mode tolérant si pas de clé
- Webhook `/api/webhooks/stripe` consomme 5 événements (checkout completed, subscription updated/deleted, invoice paid/failed) + signature HMAC vérifiée
- Server actions `startCheckout()` et `openCustomerPortal()`
- Runbook complet : **[STRIPE-SETUP.md](STRIPE-SETUP.md)**

---

## 7. Workflow audit de A à Z

### 7.1 Cycle de vie d'un audit (`audit_status`)

```
PENDING → PLANNED → IN_PROGRESS → DELIVERED → REMEDIATION → COUNTER_AUDIT → ONLINE / COMPLETED / ARCHIVED
```

Source de vérité : `src/lib/audit-status.ts` (matrice de transitions + conditions + permissions par transition).

| Statut          | Sens métier                                            |
| --------------- | ------------------------------------------------------ |
| `PENDING`       | Audit créé, en attente de planification                |
| `PLANNED`       | Date de démarrage fixée, attente du jour J             |
| `IN_PROGRESS`   | Auditeur saisit la matrice + les NC                    |
| `DELIVERED`     | Rapport livré au client (PDF + accès en lecture)       |
| `REMEDIATION`   | Client corrige les NC (auto T+7j après livraison)      |
| `COUNTER_AUDIT` | Re-passage de l'auditeur pour vérifier les corrections |
| `ONLINE`        | Audit publié (page d'accessibilité en ligne)           |
| `COMPLETED`     | Fin de prestation (peut être ré-archivé)               |
| `ARCHIVED`      | Sortie du tableau de bord actif                        |

Transitions automatiques (cron `/api/cron/audit-status-auto`, daily 06:00 UTC) :

- T2 `PLANNED → IN_PROGRESS` si `expected_start_at <= today`
- T4 `DELIVERED → REMEDIATION` si `delivered_at <= now() - 7 jours`

### 7.2 Création d'un audit (action `createAudit`)

1. **Form en 3 étapes** (`/audits/new`) : Projet → Référentiel + plateforme + service → Planning + notes
2. **Validation** : projet, référentiel, plateforme, type de prestation requis
3. **Vérification des limites** : `max_active_audits` + `max_audits_per_month` sur l'org du projet
4. **INSERT** dans `audits` (statut `PENDING`)
5. **Création automatique** de 6 pages dans l'échantillon : 5 MANDATORY ("Accueil", "Contact", "Mentions légales", "Plan du site", "Page d'accessibilité") + 1 TRANSVERSAL ("Éléments transverses", non supprimable)
6. **Auto-assignation** : l'auditeur créateur est ajouté comme `auditor` dans `audit_assignees`
7. **Log** dans `audit_logs` (`action='audit.created'`)
8. **Notification** (futur : notif aux interlocuteurs définis)

### 7.3 Échantillon (`/audits/[uuid]/sample`)

- L'utilisateur ajoute des pages REPRESENTATIVE (URL + complexité ULTRA_SIMPLE/SIMPLE/MINIMAL/COMPLEX)
- Les MANDATORY peuvent être supprimées (cas des apps mobiles)
- TRANSVERSAL = unique et non-supprimable

### 7.4 Matrice de conformité (`/audits/[uuid]/matrix`)

- Tableau page × critère (~106 critères pour RGAA)
- Saisie inline : Conforme / Non-Conforme / Non Applicable
- Optimistic update + flush groupé (`Sauvegarder tout`)
- Footer aria-live "Tout est sauvegardé" pour SR

### 7.5 Score officiel (formule RGAA)

```
score = (compliant_distinct / (totalCriteria - notApplicable_distinct)) * 100
```

- 0-49 : **non conforme**
- 50-99 : **partiellement conforme**
- 100 : **totalement conforme**

Source : `src/lib/score.ts`. Tests : `src/lib/score.test.ts`.

`audits.initial_score` calculé au passage `IN_PROGRESS → DELIVERED`, `audits.final_score` au passage `REMEDIATION → COUNTER_AUDIT → ONLINE`.

### 7.6 Non-conformités (`/audits/[uuid]/anomalies`)

- Numérotation séquentielle par audit : `display_number` (NC #001, NC #002…)
- Sévérité : LOW / MEDIUM / HIGH / CRITICAL
- Statut métier : OPEN / IN_PROGRESS / CORRECTED / NON_REPRODUCIBLE / RESOLVED / REJECTED / CANCELLED / TO_FIX / FIXED / FALSE_POSITIVE
- Statut de relecture (`review_status`) indépendant : not_requested / pending / under_review / changes_requested / approved
- Détails NC : description, recommandation, ref externe, pièces jointes, thread chat (`client`) + thread relecture (`review`)
- Navigation prev/next entre NCs sur la page détail

### 7.7 Relecture interne (gated Pro)

Cycle complet :

```
[auditeur]            [relecteur]
not_requested ────────────────────►
                  requestNCReview
pending ──────────────────────────►
                  openNCReview
under_review ─────────────────────►
                  requestNCChanges (motif obligatoire)
                       OU
                  approveNCReview
changes_requested ────────────────► (retour à l'auditeur)
                  cancelNCReview
not_requested
```

- Désignation du relecteur : action `assignProofreader` (réservée admin + client_admin, refusée si pas de feature `audit.proofreading`)
- Notifications in-app + email (template React Email `audit-delivered-email.tsx`)
- Le relecteur ne peut pas être l'auteur de l'audit (garde-fou métier)

### 7.8 Export PDF (gated Starter)

- Route `/api/audits/[uuid]/report?lang=fr|en`
- Génération via Puppeteer (Chromium serverless `@sparticuz/chromium`)
- Template HTML rendu par `report-template.tsx`, footer paginé
- Téléchargement client-side via Blob
- Auth : profil actif + feature `export.pdf`

### 7.9 Simulateur de remédiation (gated Starter)

- Route `/audits/[uuid]/simulator`
- L'utilisateur coche des NC comme "résolues" (simulation)
- Le score se met à jour en temps réel (formule officielle appliquée à l'échantillon simulé)
- Filtres par sévérité, page, thématique

### 7.10 Planning et calendrier (`/planning`)

- Vue calendrier mensuelle
- Affiche les dates clés : début, fin, restitution, contre-audit
- Filtre par auditeur (admin voit tout, auditeur voit son périmètre)
- Cliquer un audit ouvre sa fiche

---

## 8. Workflow utilisateur (user stories principales)

### 8.1 Auditeur interne

```
US-1  : "Je veux créer un nouvel audit pour un client en quelques clics."
        → /audits/new (form 3 étapes) → /audits/[uuid] (dashboard audit)

US-2  : "Je veux saisir la conformité critère par critère, page par page,
        avec un score qui se met à jour automatiquement."
        → /audits/[uuid]/matrix (matrice optimistic update)

US-3  : "Je veux créer des non-conformités liées à un critère + une page,
        avec sévérité, recommandation et captures d'écran."
        → /audits/[uuid]/anomalies/new (formulaire complet avec drag-drop)

US-4  : "Je veux livrer un rapport PDF au client en français ou en anglais."
        → /audits/[uuid] (bouton "Exporter en PDF" si plan Starter+)

US-5  : "Je veux demander une relecture interne de mes NC avant livraison."
        → /audits/[uuid]/anomalies/[ncId] (bouton "Demander relecture" si plan Pro+)

US-6  : "Je veux voir mon planning des audits à venir."
        → /planning (vue calendrier)

US-7  : "Je veux suivre mes audits dans un tableau filtrable."
        → /audits (liste paginée + filtres statut/référentiel/plateforme)
```

### 8.2 Admin client (`client_admin`)

```
US-8  : "Je veux désigner un de mes membres comme relecteur sur un audit."
        → /audits/[uuid] (section "Relecteurs", action assignProofreader)

US-9  : "Je veux suivre l'avancement de la remédiation de mes équipes."
        → /audits/[uuid]/anomalies (statut par NC + chat client)

US-10 : "Je veux exporter le rapport PDF final."
        → /audits/[uuid] (bouton export, gated par feature)
```

### 8.3 Utilisateur client (`client`)

```
US-11 : "Je veux mettre à jour le statut de mes NC à mesure que je corrige."
        → /audits/[uuid]/anomalies/[ncId] (statut limité côté client : TO_FIX → FIXED)

US-12 : "Je veux échanger avec l'auditeur sur une NC précise."
        → thread chat "client" sur la page détail NC

US-13 : "Je veux simuler le score si je corrige certaines NC."
        → /audits/[uuid]/simulator (gated Starter+)
```

### 8.4 Super-admin Axessyo (`admin`)

```
US-14 : "Je veux pouvoir 'voir comme' un client pour reproduire un bug."
        → /admin/impersonation (bannière persistante en mode imperso)

US-15 : "Je veux consulter le journal d'audit complet pour la conformité."
        → /organizations/[slug]/audit-logs (filtres + export CSV gated Pro+)

US-16 : "Je veux gérer la matrice de permissions atomiques."
        → /admin/permissions (debug, lecture seule)
```

### 8.5 Owner / Admin d'organisation

```
US-17 : "Je veux upgrader mon org du plan Free vers Starter."
        → /organizations/[slug]/billing (CTA "Choisir mensuel/annuel" → Stripe Checkout)

US-18 : "Je veux gérer mon abonnement (CB, factures, annulation)."
        → /organizations/[slug]/billing (bouton "Gérer l'abonnement" → Stripe Portal)

US-19 : "Je veux personnaliser le logo et les couleurs de l'app pour mon org."
        → /organizations/[slug]/branding (Enterprise uniquement)

US-20 : "Je veux configurer un webhook pour recevoir les événements NC créées."
        → /organizations/[slug]/webhooks (Pro+ uniquement)

US-21 : "Je veux générer un token API pour notre intégration interne."
        → /organizations/[slug]/api-tokens (Enterprise uniquement)

US-22 : "Je veux créer plusieurs workspaces pour cloisonner mes audits par équipe."
        → /organizations/[slug]/workspaces (création + archivage)

US-23 : "Je veux basculer entre mes orgs depuis la sidebar."
        → OrgSwitcher (composant sidebar, met à jour profiles.current_org_id + cookie)
```

### 8.6 Visiteur public (non connecté)

```
US-24 : "Je veux découvrir Axessyo et ses fonctionnalités."
        → /  (landing page marketing)

US-25 : "Je veux comparer les plans et leurs prix."
        → /pricing (4 cards + toggle mensuel/annuel)

US-26 : "Je veux me connecter."
        → /login (form email + password Supabase)

US-27 : "Je veux consulter les mentions légales / cookies / privacy."
        → /legal, /cookies, /privacy
```

---

## 9. Pages du site (catalogue exhaustif)

### 9.1 Public (sans connexion)

| Route             | Rôle                                                               |
| ----------------- | ------------------------------------------------------------------ |
| `/`               | Landing : hero + features + standards + FAQ + footer               |
| `/pricing`        | 4 cards de plans + toggle mensuel/annuel + JSON-LD `Product/Offer` |
| `/login`          | Form connexion                                                     |
| `/setup-password` | Première connexion (post-invitation)                               |
| `/legal`          | Mentions légales                                                   |
| `/privacy`        | Politique de confidentialité                                       |
| `/cookies`        | Politique cookies                                                  |

### 9.2 Dashboard (connecté)

| Route                             | Rôle                                                  |
| --------------------------------- | ----------------------------------------------------- |
| `/dashboard`                      | Accueil : KPI + audits récents + activité             |
| `/audits`                         | Liste audits avec filtres + pagination                |
| `/audits/new`                     | Création d'audit (form 3 étapes)                      |
| `/audits/[uuid]`                  | Fiche audit : Mission Control + KPI + timeline + tabs |
| `/audits/[uuid]/edit`             | Édition des métadonnées audit                         |
| `/audits/[uuid]/sample`           | Échantillon de pages                                  |
| `/audits/[uuid]/matrix`           | Matrice de conformité                                 |
| `/audits/[uuid]/anomalies`        | Liste des NC + filtres                                |
| `/audits/[uuid]/anomalies/new`    | Création NC                                           |
| `/audits/[uuid]/anomalies/[ncId]` | Détail NC + chat + relecture                          |
| `/audits/[uuid]/simulator`        | Simulateur de remédiation (gated Starter+)            |
| `/planning`                       | Calendrier mensuel des audits                         |
| `/clients`                        | Liste clients (legacy, gated `client.manage`)         |
| `/clients/[clientId]`             | Détail client                                         |
| `/projects`                       | Liste projets                                         |
| `/users`                          | Gestion utilisateurs (invitation, rôles, activation)  |
| `/settings`                       | Préférences user (langue, notifications)              |
| `/admin/permissions`              | Debug RBAC (admin uniquement)                         |

### 9.3 Organisations (par org)

| Route                              | Rôle                                                        |
| ---------------------------------- | ----------------------------------------------------------- |
| `/organizations`                   | Liste des memberships du user courant                       |
| `/organizations/[slug]`            | Détail org + membres + CTAs vers les sous-pages             |
| `/organizations/[slug]/billing`    | Plan actuel + limites/usage + comparateur 4 plans           |
| `/organizations/[slug]/branding`   | Logo + couleurs + domain (gated Enterprise)                 |
| `/organizations/[slug]/webhooks`   | Configuration webhooks sortants (gated Pro+)                |
| `/organizations/[slug]/api-tokens` | Tokens Bearer scoped (gated Enterprise)                     |
| `/organizations/[slug]/audit-logs` | Journal d'audit explorable + export CSV (export gated Pro+) |
| `/organizations/[slug]/workspaces` | Sous-divisions de l'org                                     |

---

## 10. API & intégrations

### 10.1 Routes API internes (Server Actions)

22 fichiers `actions.ts` organisés par feature area. Toujours commencer par `"use server"` et appeler `requirePermission()` / `requireOrgPermission()` / `requireFeature()` en premier.

### 10.2 Routes HTTP exposées (`src/app/api/`)

| Route                         | Méthode | Auth                                      | Rôle                                                                       |
| ----------------------------- | ------- | ----------------------------------------- | -------------------------------------------------------------------------- |
| `/api/auth/callback`          | GET     | Cookie Supabase                           | Callback OAuth / invitation (échange code → session)                       |
| `/api/audits/[uuid]/report`   | GET     | Cookie + feature `export.pdf`             | Génère le PDF du rapport audit                                             |
| `/api/cron/audit-status-auto` | GET     | `CRON_SECRET`                             | Cron daily : transitions auto PLANNED→IN_PROGRESS et DELIVERED→REMEDIATION |
| `/api/cron/webhook-dispatch`  | GET     | `CRON_SECRET`                             | Cron 1/min : pop la queue `webhook_deliveries`, POST signé HMAC            |
| `/api/webhooks/stripe`        | POST    | Signature HMAC Stripe                     | Reçoit les événements Stripe et met à jour `subscriptions`                 |
| `/api/v1/audits`              | GET     | Bearer `axe_live_…` + scope `audits:read` | API publique : liste audits paginée (cursor)                               |

### 10.3 Webhooks sortants

Catalogue des événements émis automatiquement par triggers DB :

| Event                  | Trigger                                                    |
| ---------------------- | ---------------------------------------------------------- |
| `nc.created`           | INSERT sur `non_conformities`                              |
| `nc.status_changed`    | UPDATE de `status` sur `non_conformities`                  |
| `audit.status_changed` | UPDATE de `status` sur `audits`                            |
| `audit.delivered`      | UPDATE de `status` sur `audits` (cas spécifique DELIVERED) |

Payload signé via `X-Axessyo-Signature: t=<unix>,v1=<hmac_sha256>` (format Stripe). Back-off exponentiel 60s → 6h, abandon après 5 tentatives.

### 10.4 Intégration Stripe

Voir [STRIPE-SETUP.md](STRIPE-SETUP.md) pour le runbook complet.

### 10.5 Intégration Resend (emails)

Templates dans `src/emails/` :

- `invitation-email.tsx` — invitation d'un nouvel utilisateur
- `audit-delivered-email.tsx` — notification "audit livré"

---

## 11. Internationalisation

- **Locales supportées** : FR (par défaut), EN
- Bibliothèque : `next-intl` v4 avec plugin Next
- Locale persistée dans cookie `axessio-locale`
- Fichiers de traductions : `messages/fr.json`, `messages/en.json` — **parité maintenue** (~1300 clés)
- Switcher visible dans le settings + topbar

### Convention critique

Les clés i18n ne doivent **jamais contenir un `.`** (séparateur de namespace pour next-intl). Toute permission `audit.view` doit être traduite via `audit_view` ou via un objet imbriqué `{ audit: { view: "…" } }`.

---

## 12. Sécurité

### 12.1 Row-Level Security (RLS) PostgreSQL

- Activée sur **toutes** les tables métier
- Helpers SQL en `SECURITY DEFINER` (sinon récursion infinie quand une policy interroge la même table)
- Source de vérité tenancy : `current_org()` = `profiles.current_org_id`
- Helpers principaux : `is_admin()`, `is_member_of()`, `has_org_role()`, `has_org_permission()`, `has_workspace_access()`, `accessible_project_ids()`

### 12.2 Service-role usage

- Clé `SUPABASE_SERVICE_ROLE_KEY` utilisée uniquement dans :
  - `src/lib/supabase/admin.ts` (factory `createAdminClient()`)
  - Webhooks (Stripe, dispatcher cron)
  - Server actions admin (invitation user, mise à jour subscriptions, etc.)
- **Jamais** côté client. Aucune référence dans `*.tsx` "use client".

### 12.3 Authentification

- Login : `signInWithPassword` côté **client** + `window.location.href = "/dashboard"` (Server Actions ne marchent pas pour l'auth avec Next 16 + Turbopack)
- Middleware (`src/proxy.ts`) gère le refresh des sessions Supabase
- Routes publiques whitelistées explicitement dans `lib/supabase/middleware.ts`
- `requireProfile()` dans `src/lib/auth.ts` est tolérant : crée le profil à la volée si manquant

### 12.4 Rate limiting

- `src/lib/rate-limit.ts` : in-memory token bucket
- Appliqué sur `inviteUser` (30/h), `resendInvitation` (10/h)

### 12.5 Security headers

- `src/lib/security-headers.ts` : CSP stricte, HSTS, X-Frame-Options DENY, COOP/CORP same-origin
- Appliqués via `next.config.ts` `headers()` sur toutes les routes

### 12.6 Impersonation

- Un `admin` peut "voir comme" `client_admin` ou `client` ; un `auditor` peut voir comme `client`
- Bannière persistante au top du dashboard
- Le rôle EFFECTIF (`profile.role`) est utilisé pour le rendu UI, mais les server actions vérifient toujours le rôle RÉEL (`profile.realRole`) → impossible d'élever ses privilèges via imperso

---

## 13. Tests automatisés

### 13.1 Vitest (tests unitaires)

**163 tests, 7 fichiers** (`npm test`) :

| Fichier                             | Couverture                                                        |
| ----------------------------------- | ----------------------------------------------------------------- |
| `src/lib/score.test.ts`             | Formule officielle RGAA + libellés                                |
| `src/lib/utils.test.ts`             | Helpers utilitaires                                               |
| `src/lib/constants.test.ts`         | Tous les enums i18n complets                                      |
| `src/lib/permissions.test.ts`       | Matrices `PERMISSIONS` + `ORG_PERMISSIONS`, hiérarchie, cohérence |
| `src/lib/billing/plans.test.ts`     | Catalogue plans + héritage features + limites                     |
| `src/lib/webhooks/server.test.ts`   | HMAC signature + back-off + génération secret                     |
| `src/lib/api-tokens/server.test.ts` | Génération token + hash + extraction Bearer                       |

### 13.2 Playwright (E2E)

5 specs dans `e2e/` :

- `auth.spec.ts` : login form + erreur credentials invalides + connexion réussie
- `audit-flow.spec.ts` : création d'audit complet + saisie matrice

Config : `workers: 1` obligatoire pour éviter un bug de timing avec Turbopack dev server. Credentials test dans `.env.test.local` (gitignored).

---

## 14. Migrations DB (60 incréments)

### Groupe 1 : Bootstrap (00-09)

- `00` : schéma initial (14 tables core + enums + RLS basique)
- `01` : policies RLS
- `02` : seed démo
- `03-07` : référentiels (RGAA, WCAG, RAWeb, RAAM)
- `08` : extension NC (sévérité, ref externe)
- `09` : bucket storage (attachements)

### Groupe 2 : Méthodologie (10-13)

- Méthodologie détaillée par référentiel (tests, niveaux WCAG, principes)

### Groupe 3 : Hardening & perf (14-22)

- `14` : hardening RLS NC
- `15` : `profiles.is_active` (désactivation soft)
- `16-17` : extension clients (website, logo_url, etc.)
- `18` : index perf + mirror email confirmé
- `19` : table notifications
- `20` : index de scale + RPCs
- `21` : `nc.test_reference` (link vers tests RGAA spécifiques)
- `22` : fix notify trigger

### Groupe 4 : RBAC platform & workflow (23-31)

- `23` : refactor rôles plateforme + table `audit_logs`
- `24` : workflow d'audit (déprécié 40)
- `25` : `audit_assignees` (auteur+relecteur)
- `26` : dates planning étendues (restitution, contre-audit)
- `27-28` : workflow collaboration + visibilité (déprécié 40)
- `29-30` : fix récursion RLS (auditassignees)
- `31` : fix policies write (re-guarder is_auditor)

### Groupe 5 : Lifecycle audit (32-41)

- `32` : `audit_status` lifecycle complet
- `33` : `nc.review_status` (cycle relecture)
- `34` : `nc_messages` (threads `client` + `review`)
- `35` : assignees → policy client_admin
- `37` : RLS messages thread
- `38` : `audit.current_score` cache
- `39` : drop fonctions inutilisées
- `40` : drop `workflow_status` (remplacé par `audit_status` + `review_status`)
- `41` : `nc.display_number` séquentiel par audit

### Groupe 6 : Tenancy (42-46)

- `42` : tables `organizations` + `organization_members` + helpers
- `43` : backfill 1 client → 1 organization
- `44` : `audits.organization_id` + projects sync
- `45` : `profiles.current_org_id` + trigger anti-forge
- `46` : RLS org-scope sur `accessible_project_ids`

### Groupe 7 : RBAC atomique (47-48)

- `47` : tables `permissions` + `role_permissions` + seed
- `48` : helpers `has_org_permission(code)`

### Groupe 8 : Plans (49-51)

- `49` : `subscription_plans` + `plan_features` + `plan_limits` + seed
- `50` : `subscriptions` + helpers SQL plan/feature/limit
- `51` : trigger auto-création subscription `free`

### Groupe 9 : Enterprise (52-53)

- `52` : colonnes branding sur organizations
- `53` : table `org_auth_methods` (schéma SSO/SCIM)

### Groupe 10 : Workspaces (54-55)

- `54` : tables `workspaces` + `workspace_members` + helpers + trigger default
- `55` : `audits.workspace_id` + `projects.workspace_id` + backfill

### Groupe 11 : Webhooks (56-57)

- `56` : `webhook_endpoints` + `webhook_deliveries` + helper `enqueue_webhook`
- `57` : triggers DB sur `non_conformities` + `audits`

### Groupe 12 : API & Audit logs (58-59)

- `58` : `api_tokens` + helpers `validate_api_token` / `touch_api_token`
- `59` : `audit_logs.organization_id` + backfill + trigger autofill + RLS étendue

---

## 15. Ce qui reste à faire

### 15.1 Backlog roadmap

| Item                                                     | Statut  | Notes                                                                                                                                                    |
| -------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Setup Stripe** (config infra, prices, env vars)        | TODO    | Pas de code à écrire, suivre [STRIPE-SETUP.md](STRIPE-SETUP.md)                                                                                          |
| **Bascule WRITE policies sur `has_org_permission()`**    | TODO    | Aujourd'hui les policies utilisent encore `is_auditor()`. Migration progressive policy par policy pour éviter une coupure.                               |
| **Intégration SSO IdP réelle**                           | TODO    | Schéma DB en place (migration 53). À brancher sur WorkOS, Auth0, ou Supabase SAML quand un client Enterprise le demande.                                 |
| **SCIM provisioning**                                    | TODO    | Idem SSO.                                                                                                                                                |
| **Pricing page : compteur de remise annuelle dynamique** | DONE    | Badge calculé serveur-side depuis le ratio yearly/(monthly×12)                                                                                           |
| **Export CSV / Excel** (autres que audit logs)           | TODO    | Export complet d'audit (matrice + NC) en CSV/XLSX.                                                                                                       |
| **Tests automatisés étendus**                            | PARTIEL | 163 tests vitest + 5 specs Playwright. À étendre pour billing/webhooks E2E.                                                                              |
| **Notification email cycle complet**                     | PARTIEL | Invitation + audit livré OK. À étendre : NC créée, review demandée, statut changé.                                                                       |
| **Workspaces : filtrage RLS effectif**                   | TODO    | La phase 6 reste additive (workspace_id stocké mais pas filtré). À activer si besoin métier.                                                             |
| **Audit log filtres avancés**                            | TODO    | Filtrage par acteur (champ texte) + sauvegarde de filtres.                                                                                               |
| **Webhooks : UI de delivery history**                    | TODO    | Aujourd'hui on voit `last_success_at` / `last_failure_at`. Une page par endpoint avec les N dernières livraisons + retry manuel serait utile.            |
| **Pricing : page comparateur détaillé**                  | TODO    | Tableau X plans × N features avec coches/croix.                                                                                                          |
| **Onboarding new user**                                  | TODO    | Aujourd'hui le user créé arrive sur le dashboard à vide. Une wizard d'onboarding (créer org → premier projet → premier audit) augmenterait l'activation. |
| **Mobile app native ou PWA optimisée**                   | TODO    | L'UI est responsive mais pas optimisée tablette/mobile pour la matrice ni le simulateur.                                                                 |
| **Audit IA (Lighthouse, axe-core integration)**          | FUTUR   | Pré-remplir la matrice à partir d'un crawl automatique. Différentiateur fort vs concurrents.                                                             |

### 15.2 Dette technique connue

- Les rôles plateforme `admin/auditor/client_admin/client` sont conservés en parallèle du nouveau modèle `org_role`. Une migration progressive éliminera le legacy une fois 100 % des policies passées sur `has_org_permission()`.
- La page `/admin/permissions` est en lecture seule. Une UI d'édition (drag & drop matrice) serait plus user-friendly.
- Le seed initial des références (RGAA 4.1.2 etc.) n'est pas idempotent à 100 % — un re-run de la migration peut dupliquer. À fixer si on doit re-seeder.

---

## 16. Conventions techniques importantes

Voir [CLAUDE.md](CLAUDE.md) pour le détail. Points clés à retenir :

### Composants UI

- **TOUJOURS** style React 19 : pas de `forwardRef`, pas de `displayName`, props directes.

### Server Components vs Client Components

- Server Components par défaut. `"use client"` uniquement pour state/events/hooks.
- Server Actions dans des fichiers `actions.ts` avec `"use server"` en tête.

### RLS PostgreSQL

- Toutes les fonctions helpers en `SECURITY DEFINER` + `set search_path = public`.
- Aucune policy RLS ne doit interroger directement la **même table** qu'elle protège (récursion).
- `current_org()` est la source unique de vérité du tenant actif.

### Migrations

- Toujours **idempotentes** (`IF NOT EXISTS`, `DROP … IF EXISTS`, `ON CONFLICT`).
- Versionnées par numéro croissant. **Jamais** modifier une migration déjà appliquée.

### i18n

- Aucune clé avec un `.` (séparateur next-intl). Convertir en `_` ou imbriquer.

### Erreurs déjà résolues — à NE PAS reproduire

1. Récursion RLS → `SECURITY DEFINER` obligatoire sur les helpers
2. Cookies non lus par middleware → `cookieOptions: { name: STORAGE_KEY }` partagé
3. `forwardRef` → style React 19
4. `typedRoutes` dans `experimental` → option racine en Next 16
5. Soumission de form trop rapide → bloquer Entrée hors textarea
6. Clés i18n avec `.` → séparateur de namespace next-intl
7. `middleware.ts` déprécié en Next 16 → renommer en `src/proxy.ts`
8. JWT custom claim côté Supabase Auth impossible → utiliser `profiles.*` au lieu d'un claim
9. `audit_transition_workflow` → totalement retiré, ne pas le réintroduire

---

## 17. Index des fichiers structurants

| Fichier                                                                                | Rôle                                                                     |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| [CLAUDE.md](CLAUDE.md)                                                                 | Conventions techniques + historique des phases                           |
| [STRIPE-SETUP.md](STRIPE-SETUP.md)                                                     | Runbook config Stripe pour activer les paiements                         |
| [src/types/domain.ts](src/types/domain.ts)                                             | Types métier (UserRole, OrgRole, Audit, NC, etc.)                        |
| [src/lib/score.ts](src/lib/score.ts)                                                   | Formule officielle du score                                              |
| [src/lib/constants.ts](src/lib/constants.ts)                                           | Labels FR/EN partagés                                                    |
| [src/lib/permissions.ts](src/lib/permissions.ts)                                       | Matrice RBAC (UserRole + OrgRole)                                        |
| [src/lib/server-permissions.ts](src/lib/server-permissions.ts)                         | `requirePermission()` server-side                                        |
| [src/lib/current-org.ts](src/lib/current-org.ts)                                       | Résolution org active (cookie + DB)                                      |
| [src/lib/current-workspace.ts](src/lib/current-workspace.ts)                           | Helpers workspaces                                                       |
| [src/lib/audit-status.ts](src/lib/audit-status.ts)                                     | Matrice de transitions audit_status + conditions                         |
| [src/lib/billing/plans.ts](src/lib/billing/plans.ts)                                   | Catalogue plans + features + limites                                     |
| [src/lib/billing/server.ts](src/lib/billing/server.ts)                                 | Helpers serveur billing                                                  |
| [src/lib/billing/usage.ts](src/lib/billing/usage.ts)                                   | Comptage usage pour limites                                              |
| [src/lib/billing/stripe.ts](src/lib/billing/stripe.ts)                                 | Client Stripe (server only)                                              |
| [src/lib/webhooks/server.ts](src/lib/webhooks/server.ts)                               | HMAC signing + back-off                                                  |
| [src/lib/api-tokens/server.ts](src/lib/api-tokens/server.ts)                           | Génération + hash tokens                                                 |
| [src/lib/api-tokens/auth.ts](src/lib/api-tokens/auth.ts)                               | Middleware Bearer pour `/api/v1/*`                                       |
| [src/lib/branding/server.ts](src/lib/branding/server.ts)                               | Helpers branding custom org                                              |
| [src/lib/supabase/server.ts](src/lib/supabase/server.ts)                               | Client Supabase server-side (cookies)                                    |
| [src/lib/supabase/admin.ts](src/lib/supabase/admin.ts)                                 | Service-role admin client                                                |
| [src/lib/supabase/middleware.ts](src/lib/supabase/middleware.ts)                       | Refresh session + whitelist routes publiques                             |
| [src/components/billing/feature-upsell.tsx](src/components/billing/feature-upsell.tsx) | Card d'upsell réutilisable                                               |
| [src/components/layout/sidebar.tsx](src/components/layout/sidebar.tsx)                 | Sidebar dashboard avec OrgSwitcher                                       |
| [src/components/layout/branding-styles.tsx](src/components/layout/branding-styles.tsx) | Injection CSS vars branding                                              |
| [supabase/migrations/](supabase/migrations/)                                           | 60 migrations SQL incrémentales                                          |
| [vercel.json](vercel.json)                                                             | Crons : audit-status-auto (daily 06:00) + webhook-dispatch (every 1 min) |
| [next.config.ts](next.config.ts)                                                       | Headers de sécurité + plugin next-intl                                   |
| [vitest.config.ts](vitest.config.ts)                                                   | Config tests unitaires (alias `server-only`)                             |
| [playwright.config.ts](playwright.config.ts)                                           | Config tests E2E (workers: 1)                                            |
