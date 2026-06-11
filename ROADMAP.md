# Roadmap technique Axessyo

> Généré le 2026-05-27. Basé sur l'audit du code au commit 7354e74 (branche `improve_role`).

## Synthèse

- Sécurité critique (P0) : 4 items exploitables aujourd'hui (SSRF webhooks, login brute-force, PDF DoS, rate-limit serverless inopérant).
- Architecture / dette : 6 items à programmer (double rôle, OpenAPI, observabilité, branding hardcodé, parité i18n non testée, axe-core absent).
- Performance : 2 items (matrice non virtualisée, cron webhook every-minute coûteux).
- UX / a11y : 2 items (pas de déclaration d'accessibilité, pas de persistance localStorage matrice).
- Déjà OK : 7 items (CSP de base, headers HTTP, RLS storage, format token, score SQL, parité i18n actuelle, impersonation safe).

Statuts détaillés :
- ✅ Déjà OK : 7
- ⚠️ Partiel : 9
- ❌ À faire : 12
- 🤷 NA : 0

---

## Sprint 1 — Sécurité critique (1 semaine)

### S1.1 — SSRF dans les webhooks sortants (P0)
- **Constat** : `src/app/(dashboard)/organizations/[slug]/webhooks/actions.ts:60` n'effectue qu'un `^https?:\/\//i` sur l'URL fournie. Aucune validation contre les IPs privées ni résolution DNS. Le dispatcher `src/app/api/cron/webhook-dispatch/route.ts:134` fait directement `fetch(endpoint.url, ...)` côté serveur Vercel. La table accepte aussi `http://` (cf. contrainte `webhook_endpoints_url_https` en migration 56 — regex `^https?://`).
- **Risque** : un admin d'org créé un endpoint `http://169.254.169.254/latest/meta-data/iam/security-credentials/` ou `http://localhost:6379/` — le dispatcher (qui tourne avec `service_role`) POST le payload signé vers l'instance metadata AWS/GCP, le Redis interne, ou un service interne Vercel. Vol d'IAM creds, exfiltration depuis le réseau privé.
- **Solution** :
  1. Forcer `https` uniquement dans le check côté action ET dans la contrainte SQL (migration 60).
  2. Avant chaque POST dans le dispatcher, résoudre l'URL en DNS (`dns.lookup`) puis rejeter si l'IP appartient à `0.0.0.0/8`, `10.0.0.0/8`, `127.0.0.0/8`, `169.254.0.0/16`, `172.16.0.0/12`, `192.168.0.0/16`, `::1/128`, `fc00::/7`, `fe80::/10`.
  3. Refaire le check **après** `fetch` follow redirects → désactiver les redirects (`redirect: "manual"`).
  4. Tester avec une URL résolvant vers 127.0.0.1 (CNAME → localhost).
- **Fichiers à toucher** : `src/lib/webhooks/server.ts` (nouveau helper `assertPublicUrl`), `src/app/(dashboard)/organizations/[slug]/webhooks/actions.ts`, `src/app/api/cron/webhook-dispatch/route.ts`, `supabase/migrations/60_webhook_url_https_only.sql`.
- **Tests à ajouter** : unit sur `assertPublicUrl` (IPv4 privées, IPv6 ULA/link-local, CNAME chain, redirect 30x), e2e cron qui rejette `http://169.254.169.254`.
- **Effort** : 1j (incluant code + migration + tests).
- **Validation** : `curl -X POST` création endpoint avec `http://localhost` → 400. Endpoint avec hostname résolvant en 169.254.169.254 → delivery `failed` avec `error_message="private IP"`.

### S1.2 — Login brute-force sans rate-limit serveur (P0)
- **Constat** : `src/app/(auth)/login/login-form.tsx:36` appelle `supabase.auth.signInWithPassword` directement depuis le navigateur (`"use client"`). Aucune limite côté serveur Axessyo — seules les limites internes Supabase Auth s'appliquent. Aucune entrée dans `audit_logs` pour les échecs.
- **Risque** : attaquant lance 10k tentatives `email+password` depuis 100 IPs. Supabase finit par freiner mais le défenseur n'a aucune visibilité. Pas d'alerte sur un compte ciblé.
- **Solution** :
  1. Garder le `signInWithPassword` client (CLAUDE.md indique que c'est volontaire pour Next 16 + Turbopack).
  2. Ajouter un endpoint `/api/auth/login-attempt` appelé **avant** `signInWithPassword`, qui :
     - rate-limite par IP (clé `login:<ip>`) — 10 / 5 min via Upstash Redis (cf. S1.3).
     - log dans `audit_logs` (action `login.attempt`, payload `{email_hash, ip, user_agent}`).
  3. Après échec côté client, appeler `/api/auth/login-failed` qui log `login.failed`.
  4. Optionnel : compteur DB par email — déclenche `account_locked` après N échecs en M minutes.
- **Fichiers à toucher** : `src/app/api/auth/login-attempt/route.ts` (nouveau), `src/app/api/auth/login-failed/route.ts` (nouveau), `src/app/(auth)/login/login-form.tsx`, `supabase/migrations/61_login_audit.sql`.
- **Tests à ajouter** : e2e Playwright — 11 tentatives en < 5 min depuis même IP → 11ᵉ tentative bloquée AVANT d'appeler Supabase.
- **Effort** : 2j (dépend de S1.3).
- **Validation** : `for i in 1..15; do curl -X POST /api/auth/login-attempt; done` → 429 dès la 11ᵉ. Table `audit_logs` contient une ligne par tentative.

### S1.3 — Rate-limit in-memory inopérant sur Vercel (P0)
- **Constat** : `src/lib/rate-limit.ts:10` utilise `new Map()` comme store. Le commentaire en tête admet le problème : "un compteur par instance chaude". Sur Vercel serverless, chaque invocation peut atterrir sur une lambda différente — un attaquant qui force le scale-out (10 requêtes ~simultanées) obtient 10 compteurs séparés.
- **Risque** : tous les `requirePermission` qui appellent `rateLimit()` (inviteUser, etc.) sont contournables en parallèle. Effet aggravé sur les actions sensibles (création de token API, rotation de secret webhook).
- **Solution** :
  1. Provisionner Upstash Redis (free tier suffit) via le Vercel Marketplace → `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`.
  2. Remplacer le store par `@upstash/ratelimit` (sliding window). Garder l'API publique identique pour ne pas toucher les appelants.
  3. Fallback : si les env vars sont absentes (dev local), garder le store in-memory actuel.
- **Fichiers à toucher** : `src/lib/rate-limit.ts`, `package.json` (`@upstash/ratelimit`, `@upstash/redis`), variables Vercel.
- **Tests à ajouter** : vitest contre un mock Redis, e2e qui parallélise 20 invitations → 5 passent, 15 rejetées.
- **Effort** : 0.5j.
- **Validation** : déployer en preview, lancer `hey -n 50 -c 10` sur une action gated → exactement N succès, le reste 429.

### S1.4 — PDF DoS (Puppeteer non queuée) (P1)
- **Constat** : `src/app/api/audits/[uuid]/report/route.ts:363` lance `generatePDF()` sans queue ni sémaphore. `maxDuration = 60` ; un client peut déclencher 50 jobs en parallèle (curl en boucle), chacun consommant ~512 Mo de Chromium pendant 10-30s.
- **Risque** : épuisement des function invocations Vercel + facture (PDFs payants en computes). Un seul `client_admin` peut neutraliser l'API PDF de son org pendant 5 min.
- **Solution** :
  1. Rate-limit Redis par user : 5 PDF / 5 min (clé `pdf:<userId>`).
  2. Rate-limit Redis par org : 20 PDF / heure (clé `pdf:org:<orgId>`).
  3. Optionnel : queue Vercel Cron + table `pdf_jobs` (status pending/done) — laisser au backlog si le rate-limit suffit.
- **Fichiers à toucher** : `src/app/api/audits/[uuid]/report/route.ts` (intégrer `rateLimit` après l'auth).
- **Tests à ajouter** : e2e Playwright qui télécharge 6 PDFs d'affilée → 6ᵉ retourne 429.
- **Effort** : 0.5j (après S1.3).
- **Validation** : `for i in {1..10}; do curl /api/audits/.../report & done; wait` → 5 succès, 5 × 429.

### S1.5 — Aucune observabilité (Sentry/Axiom absents) (P1) — ✅ FAIT (2026-06-11)
- **Livré** : `@sentry/nextjs` en mode tolérant (sans `NEXT_PUBLIC_SENTRY_DSN`, SDK désactivé — même pattern que Stripe). Configs `sentry.{server,edge}.config.ts` + `src/instrumentation.ts` (hook `onRequestError`) + `src/instrumentation-client.ts` + `src/app/global-error.tsx`. Tag `user.id` + `organization_id` dans `requireProfile`. Captures explicites : webhook Stripe, route PDF, dispatcher webhooks, auto-création de profil. **À configurer côté infra** : créer un projet Sentry (free tier) et poser `NEXT_PUBLIC_SENTRY_DSN` dans Vercel (+ `SENTRY_ORG`/`SENTRY_PROJECT`/`SENTRY_AUTH_TOKEN` pour les source maps).
- **Constat** : `package.json` ne contient ni `@sentry/nextjs`, ni `axiom`, ni `@logtail`, ni équivalent. `console.error` est la seule trace en prod. `requireProfile` (`src/lib/auth.ts:71`) crée silencieusement un profil avec `role: 'client'` sans logger l'incident.
- **Risque** : un bug RLS, une 500 Stripe webhook ou une erreur Puppeteer passe inaperçu jusqu'à ce qu'un user râle. Aucune métrique sur les 401/403 (qui pourraient signaler une attaque).
- **Solution** :
  1. `@sentry/nextjs` avec wizard (`npx @sentry/wizard@latest -i nextjs`).
  2. Configurer `sentry.client.config.ts` (sample 10 %), `sentry.server.config.ts` (sample 100 % erreurs, 10 % traces).
  3. Hook tag `organization_id` + `user_id` (via `Sentry.setUser`) dans `requireProfile`.
  4. Capturer explicitement dans : webhook dispatcher, PDF route, Stripe webhook, `requireProfile` auto-create.
- **Fichiers à toucher** : `sentry.{client,server,edge}.config.ts` (nouveaux), `src/lib/auth.ts`, `src/app/api/cron/webhook-dispatch/route.ts`, `src/app/api/webhooks/stripe/route.ts`, `next.config.ts`.
- **Tests à ajouter** : aucun (vérif manuelle Sentry dashboard).
- **Effort** : 0.5j.
- **Validation** : forcer une 500 sur `/api/audits/_/report` → événement visible dans Sentry avec `user.id` et `organization_id`.

---

## Sprint 2 — Performance & scale (1 semaine)

### S2.1 — Cron webhook every-minute (P2)
- **Constat** : `vercel.json:9` planifie `/api/cron/webhook-dispatch` toutes les minutes (`* * * * *`). En plan Pro Vercel, 1440 invocations / jour pour rien quand la queue est vide.
- **Risque** : coût + utilisation inutile du quota function-invocations. Pas un risque de sécurité, juste un gaspillage.
- **Solution** :
  1. Court terme : passer à `*/2 * * * *` (toutes les 2 min) — la latence pour les webhooks n'a pas besoin d'être < 60s.
  2. Mieux : utiliser `pg_notify` + un `LISTEN` dans une edge function persistante (cf. Supabase Realtime). Mais Vercel n'a pas de worker persistant → garder le cron, accepter le coût.
  3. Skip rapide : si le `select count(*) from webhook_deliveries where status in ('pending','retry') and next_attempt_at <= now()` retourne 0, on sort en 50ms.
- **Fichiers à toucher** : `vercel.json`, `src/app/api/cron/webhook-dispatch/route.ts` (early return si queue vide).
- **Tests à ajouter** : aucun (mesure via Vercel Analytics).
- **Effort** : 0.5j.
- **Validation** : Vercel logs montrent < 200ms median pour les ticks à vide.

### S2.2 — Matrice de conformité non virtualisée (P2)
- **Constat** : `src/app/(dashboard)/audits/[uuid]/matrix/conformity-matrix-layout.tsx` rend toute la matrice (toutes les thématiques d'une page) dans le DOM. Pour RGAA 4.1.2 = 106 critères × 1 page courante, c'est gérable. **Mais** la sidebar `PagesSidebar` charge la `conformityMap` pour TOUTES les pages — un audit avec 20 pages × 106 critères = 2120 entrées. Pas catastrophique mais à surveiller.
- **Risque** : sur les très gros audits (50+ pages), l'hydratation côté client devient lente sur mobile.
- **Solution** :
  1. Mesurer d'abord avec un audit réel (10 pages × 106 critères) : si TTI < 3s, on ne fait rien.
  2. Si latent : `@tanstack/react-virtual` sur la liste des critères dans `thematic-section.tsx`.
  3. L'index `(audit_id, criteria_id)` existe déjà (`migration 20_scale_indexes_and_rpcs.sql:54`) — pas d'action SQL.
- **Fichiers à toucher** : `src/app/(dashboard)/audits/[uuid]/matrix/thematic-section.tsx`, ajout `@tanstack/react-virtual` au `package.json`.
- **Tests à ajouter** : aucun (mesure Lighthouse).
- **Effort** : 1j si déclenché.
- **Validation** : Lighthouse TBT < 200ms sur un audit de 20 pages.

### S2.3 — `/pricing` non statique (P3) — ❌ ABANDONNÉ (2026-06-11)
- **Verdict** : le constat initial ("dépend uniquement de `PLANS`") était faux. La page lit la locale via `getTranslations()` → `src/i18n/request.ts` → cookie `cookies()`, ce qui rend la route intrinsèquement dynamique. `force-static` servirait la version FR à tous les visiteurs (y compris ceux ayant choisi EN), et `revalidate` serait sans effet tant que la route lit un cookie. Une vraie statisation exigerait des routes localisées par segment (`/en/pricing`) — chantier i18n disproportionné pour un gain compute marginal.
- **Constat** : `src/app/pricing/page.tsx` est server-rendered à chaque requête. Aucun `export const dynamic = "force-static"` ni `revalidate`. Contenu marketing 100 % statique mais re-render à chaque visite SEO.
- **Risque** : perf SEO marginale, coût compute minime. Quick win.
- **Solution** : ajouter `export const revalidate = 3600;` (ou `dynamic = "force-static"`). Le fichier dépend uniquement de `PLANS` (catalogue TS).
- **Fichiers à toucher** : `src/app/pricing/page.tsx`.
- **Tests à ajouter** : aucun.
- **Effort** : 5 min.
- **Validation** : `curl -I /pricing` montre `x-vercel-cache: HIT` au 2ᵉ appel.

---

## Sprint 3 — Architecture & dette (2 semaines)

### S3.1 — Branding "Axessyo" hardcodé (P2)
- **Constat** : grep `Axessyo` retourne 44 occurrences dans 19 fichiers `src/` hors i18n : `lib/site.ts:6`, `lib/pdf.ts:2`, `emails/invitation-email.tsx:5`, `app/api/audits/[uuid]/report/report-template.tsx:4`, `components/brand/wordmark.tsx:4`, etc. Phase 5 a livré le branding custom (logo + couleurs) côté UI dashboard, mais les emails, le PDF et la page publique restent figés.
- **Risque** : la promesse "custom branding" est partielle. Un client Enterprise qui a payé pour son logo le voit en haut de la sidebar — mais reçoit ses invitations Resend de "Axessyo".
- **Solution** :
  1. Centraliser dans `lib/branding/server.ts` la lecture du branding actif (logo + nom).
  2. Passer les emails à `getOrgBranding()` au moment du `sendInvitation()`.
  3. Idem pour le PDF (`report-template.tsx`) — passer le branding en `ReportData.branding`.
  4. Laisser hardcodé : `app/pricing`, `app/legal`, `app/page.tsx` (marketing public).
- **Fichiers à toucher** : `src/emails/*.tsx`, `src/app/api/audits/[uuid]/report/report-template.tsx`, `src/lib/pdf.ts`, `src/lib/branding/server.ts`.
- **Tests à ajouter** : vitest snapshot email avec branding custom, e2e PDF avec org Enterprise → vérifier logo dans la page de garde.
- **Effort** : 2j.
- **Validation** : un client Enterprise reçoit un email d'invitation avec son logo et nom d'org dans le `from` et le header HTML.

### S3.2 — Double rôle `profiles.role` + `organization_members.role` (P2)
- **Constat** : grep `profile.role` retourne 41 occurrences server-side qui pilotent une décision (hors UI pure). `CLAUDE.md` mentionne "les policies WRITE tournent toujours sur `is_auditor()` — la bascule se fera étape par étape". Le plan existe mais aucune étape concrète n'a été franchie depuis la phase 3.
- **Risque** : confusion long-terme. Un dev qui ajoute une nouvelle table multi-tenant risque de gater par `profile.role === 'auditor'` au lieu d'utiliser `has_org_permission`. La dette grandit silencieusement.
- **Solution** :
  1. Documenter dans `CLAUDE.md` la **règle de précédence finale** : `has_org_permission('code')` est la source de vérité, `profile.role` est `@deprecated` pour les checks de permission.
  2. Annoter `Profile.role` en TS avec un commentaire JSDoc `@deprecated use canOrg() / requireOrgPermission()`.
  3. Lister un par un les checks `profile.role === ...` à migrer (37 endroits identifiés ; chaque migration = 1 PR avec test E2E).
  4. Cibler en priorité les actions d'écriture qui acceptent encore `auditor` legacy : `audits/actions.ts`, `audits/[uuid]/matrix/actions.ts`, `audits/[uuid]/anomalies/[ncId]/actions.ts`.
- **Fichiers à toucher** : `src/types/domain.ts` (annotation `@deprecated`), `CLAUDE.md`, ~20 fichiers `actions.ts` (sur plusieurs sprints).
- **Tests à ajouter** : pour chaque action migrée, ajouter un cas Vitest "un membre `manager` sans permission `matrix.edit` est rejeté".
- **Effort** : 1 sprint (5j) pour annoter + migrer 3-5 actions critiques. Le reste va au backlog.
- **Validation** : `grep "profile\.role ===" src/app | grep -v "// @keep"` retourne 0.

### S3.3 — API publique sans OpenAPI ni rate-limit (P2)
- **Constat** : `src/app/api/v1/audits/route.ts` est l'unique endpoint `/api/v1`. Pas de spec OpenAPI, pas de rate-limit par token (l'auth Bearer passe direct), pas de header `Sunset` ni `RateLimit-*`. Le `validate_api_token` SQL touche `last_used_at` (fire-and-forget) mais ne compte rien.
- **Risque** : un client API peut hammer l'endpoint sans limite. Pas de documentation publique → pas d'adoption + le contrat n'est pas versionné.
- **Solution** :
  1. Ajouter rate-limit dans `authenticateApi` (`src/lib/api-tokens/auth.ts`) : 100 req/min par `tokenId` via Upstash. Headers `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`.
  2. Générer une spec OpenAPI minimale dans `src/app/api/v1/openapi.json` (route GET qui sert un JSON statique). Lister `/api/v1/audits` pour commencer.
  3. Documenter dans `docs/api.md` (déjà aucun doc dossier) : auth, scopes, pagination, codes d'erreur.
- **Fichiers à toucher** : `src/lib/api-tokens/auth.ts`, `src/app/api/v1/openapi/route.ts` (nouveau), `docs/api.md` (nouveau).
- **Tests à ajouter** : e2e curl 101 requêtes → 101ᵉ = 429 avec headers ratelimit.
- **Effort** : 1.5j (dépend de S1.3).
- **Validation** : `curl -H "Authorization: Bearer ..." -i /api/v1/audits` affiche les 3 headers `RateLimit-*`.

### S3.4 — Couverture E2E billing manquante (P2)
- **Constat** : `e2e/` contient 3 specs (`audit-flow`, `auth`, `helpers/auth`). Aucun parcours signup → Stripe Checkout (test mode) → webhook → DB. Le webhook Stripe (`src/app/api/webhooks/stripe/`) est branché mais jamais testé end-to-end.
- **Risque** : un changement dans `subscription_plans.stripe_price_id_monthly` ou dans le mapping webhook peut casser silencieusement la facturation. On le découvrira via "mon compte n'a pas upgradé".
- **Solution** :
  1. Spec Playwright `e2e/billing.spec.ts` : signup → créer une org → cliquer "Upgrade Pro" → carte Stripe test `4242 4242 4242 4242` → vérifier que `subscriptions.plan_code` passe à `pro` en DB.
  2. Utiliser `stripe trigger checkout.session.completed` pour shortcut le webhook si besoin.
  3. Skip en CI si `STRIPE_SECRET_KEY` absente (déjà le mode tolérant côté code).
- **Fichiers à toucher** : `e2e/billing.spec.ts` (nouveau), `e2e/helpers/stripe.ts` (nouveau).
- **Tests à ajouter** : la spec elle-même.
- **Effort** : 2j (setup Stripe test env inclus).
- **Validation** : `npx playwright test billing.spec.ts` vert avec `STRIPE_SECRET_KEY=sk_test_...`.

### S3.5 — Test automatisé de parité i18n (P3)
- **Constat** : `messages/fr.json` et `messages/en.json` ont actuellement 1426 clés chacun, parité exacte (vérifié au commit 7354e74). Mais aucun test bloquant le PR si quelqu'un ajoute une clé dans `fr.json` et oublie `en.json`.
- **Risque** : régression future, déjà arrivée selon CLAUDE.md ("clés i18n avec un `.`"). Un message `[object Object]` ou `messages.foo` brut s'affiche en prod.
- **Solution** : Vitest spec qui flat-keys les deux JSON et compare `Set`. Échoue si différence.
- **Fichiers à toucher** : `src/test-utils/i18n-parity.test.ts` (nouveau).
- **Tests à ajouter** : la spec elle-même.
- **Effort** : 30 min.
- **Validation** : ajouter une clé dans `fr.json` sans `en.json` → CI rouge.

---

## Sprint 4 — Observabilité, qualité, a11y (1 semaine)

### S4.1 — Audit d'accessibilité automatisé (P1)
- **Constat** : Axessyo est un produit RGAA/WCAG mais aucune page `/accessibility` ni `/declaration-accessibilite` n'existe (`Glob src/app/accessibility/**/* → 0`). `axe-core` absent du `package.json`. Le produit qui audite l'accessibilité ne s'audite pas.
- **Risque** : crédibilité commerciale. Un prospect public (administration française obligée RGAA) regardera l'absence de déclaration et passera son chemin.
- **Solution** :
  1. Créer `src/app/accessibility/page.tsx` avec la déclaration RGAA minimale (audit prévu, contact, etc.) — gabarit officiel sur design.numerique.gouv.fr.
  2. Ajouter `@axe-core/playwright` ; spec qui visite `/`, `/login`, `/pricing`, `/dashboard`, `/audits/[uuid]/matrix` → 0 violations critical/serious.
  3. Ajouter au sitemap, à la nav du footer public.
- **Fichiers à toucher** : `src/app/accessibility/page.tsx`, `messages/{fr,en}.json`, `src/components/public/public-footer.tsx`, `e2e/a11y.spec.ts`, `src/app/sitemap.ts`.
- **Tests à ajouter** : `e2e/a11y.spec.ts` avec `injectAxe()` + `checkA11y()` par route.
- **Effort** : 2j.
- **Validation** : `npx playwright test a11y` vert + page accessible à `/accessibility`.

### S4.2 — `requireProfile` auto-create silencieux (P3)
- **Constat** : `src/lib/auth.ts:71` crée un `profile` avec `role: "client"` quand absent, sans aucun log. Le commentaire dit "tolérant" mais on ne saura jamais que ça s'est passé.
- **Risque** : un compte créé par Supabase Auth (signup public, magic link) tombe en `client` sans `client_id` → état inconsistant. Sans log, on ne détecte pas l'incident.
- **Solution** : après le `insert`, log `console.warn` (sera capté par Sentry une fois S1.5 en place) + insérer une ligne `audit_logs` `action='profile.auto_created'`.
- **Fichiers à toucher** : `src/lib/auth.ts`.
- **Tests à ajouter** : vitest qui mocke Supabase pour simuler profil absent → vérifie l'appel à `audit_logs`.
- **Effort** : 0.5j (après S1.5).
- **Validation** : créer un user via SQL `auth.users insert` sans `profiles` → première visite logge un événement Sentry + une ligne `audit_logs`.

### S4.3 — Persistance localStorage de la matrice (P3)
- **Constat** : `src/app/(dashboard)/audits/[uuid]/matrix/conformity-matrix-layout.tsx` flush les changements en pending vers le serveur. Si l'user perd la connexion réseau au moment du flush, le banner d'erreur s'affiche (`saveStatus === "error"`, ligne 452) avec un bouton Retry. Mais si l'user ferme l'onglet pendant l'erreur, le diff est perdu.
- **Risque** : perte de saisie auditeur sur une session de 30 min. Mauvaise UX rare mais coûteuse.
- **Solution** : sérialiser `pendingChanges` + `previousValuesRef` en `localStorage` sous la clé `axessio:matrix:<auditId>:<userId>` après chaque mutation. Au chargement, si une entrée existe, proposer "Reprendre la saisie ?".
- **Fichiers à toucher** : `src/app/(dashboard)/audits/[uuid]/matrix/conformity-matrix-layout.tsx`.
- **Tests à ajouter** : e2e Playwright — sauvegarder, couper le réseau, modifier 5 critères, rafraîchir → bannière de reprise.
- **Effort** : 1j.
- **Validation** : DevTools → Application → localStorage contient la clé après un changement non flushé.

---

## Backlog (pas dans les 5 prochaines semaines)

- **CSP strict avec nonces** : remplacer `'unsafe-inline'` script-src par un nonce généré dans `src/proxy.ts`. Compatible Next 16 mais demande de générer/propager le nonce dans tous les composants `<script>` inline. Chantier 3-4 jours pour un gain réel mais limité.
- **Migration complète `profile.role` → `has_org_permission`** : 30+ endroits restants après S3.2.
- **Compte test Stripe en CI** : provisionner un compte de test dédié + secrets GitHub Actions.
- **Queue PDF (table `pdf_jobs` + cron worker)** : si S1.4 ne suffit pas et qu'un client demande des exports massifs.
- **Uptime monitoring externe** : UptimeRobot ou Better Stack ; complète Sentry (qui ne détecte pas une app "tout vert qui répond 200").
- **SCIM / SAML branchement IdP** : phase 5 a livré le schéma DB (`org_auth_methods`) ; brancher WorkOS / Auth0 quand un client Enterprise le demande.
- **Workspace-level RLS** : phase 6 a livré le schéma mais aucun filtre par workspace n'est appliqué. Activer si un client demande à cloisonner des projets dans une même org.
- **Export CSV / Excel** : déjà dans la roadmap produit (CLAUDE.md), non couvert ici.
