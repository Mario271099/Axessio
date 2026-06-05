# Axessyo — Liste d'améliorations

> Audit produit du 2026-05-30. Inspection du code au commit `46bb2f0`, en
> complément de [ROADMAP.md](ROADMAP.md) (qui couvre la roadmap technique
> sécurité/perf/dette).
>
> Ce document liste les améliorations **UX, design, workflow et fonctionnel**.
> Classé par priorité (P0 critique → P3 idée), puis catégorisé. Chaque ligne
> cite un fichier/ligne quand pertinent pour rendre l'action concrète.

## TL;DR

Trois constats forts qui méritent une attention immédiate :

1. **L'app est inutilisable sur mobile/tablet (< 1024 px)** — la sidebar est
   `lg:hidden` et il n'y a aucun menu hamburger en topbar. Aucune navigation
   possible passé la home et le dashboard.
2. **Le graphe d'évolution du dashboard affiche des données mock** ([evolution-chart.tsx:24](src/components/dashboard/evolution-chart.tsx#L24)).
   Une courbe inventée ("légère croissance, bruit modéré") est servie au user.
   C'est trompeur — à brancher sur une vraie agrégation ou retirer.
3. **La page Settings est entièrement read-only** ([settings/page.tsx](src/app/(dashboard)/settings/page.tsx)).
   Aucun moyen d'éditer son nom, sa langue, son mot de passe, son avatar —
   alors qu'on est une plateforme SaaS payante.

Le reste est globalement de bonne facture (architecture solide, i18n
complète, RLS bien gérée, billing branché). Les améliorations ci-dessous sont
du polish et de l'extension de scope produit, pas de la dette technique
profonde.

## Quick wins (gros impact, faible effort)

À attaquer en priorité même hors d'une planification produit :

- **Retirer ou brancher le mock du graphe évolution** — soit ajouter une
  vraie agrégation (`audits_score_history` view), soit cacher la carte
  jusqu'au branchement réel ([evolution-chart.tsx:24-49](src/components/dashboard/evolution-chart.tsx#L24-L49)).
- **Dashboard : fetch limit 10, affiche 5** ([dashboard/page.tsx:66](src/app/(dashboard)/dashboard/page.tsx#L66) puis L187).
  Aligner — soit afficher 10, soit fetch 5.
- **Topbar : avatar non cliquable** ([topbar.tsx:50-55](src/components/layout/topbar.tsx#L50-L55)) — c'est un `<div aria-hidden>`. Le transformer en `<DropdownMenu>` avec Mon profil / Paramètres / Déconnexion. Aujourd'hui la déco vit cachée dans la sidebar (invisible mobile).
- **Remplacer les `window.confirm()` par un AlertDialog Radix** — 6 endroits :
  [anomalies-list.tsx:279](src/app/(dashboard)/audits/[uuid]/anomalies/anomalies-list.tsx#L279), [nc-detail.tsx:312, 379](src/app/(dashboard)/audits/[uuid]/anomalies/[ncId]/nc-detail.tsx#L312), [client-detail.tsx:115, 137](src/app/(dashboard)/clients/[clientId]/client-detail.tsx#L115), [users-list.tsx:164](src/app/(dashboard)/users/users-list.tsx#L164).
- **Ajouter `loading.tsx` aux pages qui n'en ont pas** — 22 pages sans loading state, dont `/admin/overview`, `/organizations/[slug]/*` (toutes les sous-pages org), `/audits/new`, `/pricing`. Flash blanc à chaque navigation.

## P0 — Critique

### Mobile / responsive — bloquant

- **Sidebar invisible sous 1024 px sans alternative** ([sidebar.tsx:159](src/components/layout/sidebar.tsx#L159) : `hidden ... lg:flex`). Il faut un **menu hamburger en topbar** (Sheet Radix ou Dialog) qui ouvre la même nav. Aujourd'hui un user en mobile peut accéder à `/dashboard` (logo cliquable) mais rien d'autre, et perd l'OrgSwitcher + l'impersonation + le sign-out.
- **Tables horizontalement scrollables sans vue alternative** — `audits`, `users`, `admin/permissions` ([audits/page.tsx:174](src/app/(dashboard)/audits/page.tsx#L174), etc.). Sur petit écran, le user doit faire défiler latéralement, ce qui cache des colonnes critiques (statut, score). Prévoir une **card view** (un audit = une carte empilable) sous `md`.

### Données déceptives / incohérences

- **Graphe d'évolution = mock** ([evolution-chart.tsx](src/components/dashboard/evolution-chart.tsx)). Affiche une fausse courbe ascendante alors qu'aucun historique de score n'est calculé. Soit (a) calculer un vrai historique via une vue ou agrégation sur `audits.final_score / created_at`, soit (b) cacher la carte tant qu'il n'y a pas de data.
- **Page Settings entièrement read-only** ([settings/page.tsx](src/app/(dashboard)/settings/page.tsx) — 42 lignes au total). L'utilisateur ne peut PAS éditer : prénom, nom, langue, photo, mot de passe, préférences notifications, suppression de compte. Sur une plateforme SaaS payante c'est une lacune visible.
- **`profile.role === ...` en dur dans 7 fichiers** ([audits/[uuid]/page.tsx](src/app/(dashboard)/audits/[uuid]/page.tsx), [report/route.ts](src/app/api/audits/[uuid]/report/route.ts), [planning/page.tsx](src/app/(dashboard)/planning/page.tsx) et 4 autres). Documenté comme « legacy à ne pas étendre » dans CLAUDE.md, mais ces 7 sont des **comparaisons de logique métier** (pas du rendu) qui devraient passer par `canX()` du module permissions.

## P1 — Important (friction UX significative)

### Settings et compte (gros chantier)

Aucune des fonctionnalités classiques d'un compte SaaS n'existe :

- **Édition profil** — prénom, nom, langue (fr/en), avatar (upload Supabase Storage).
- **Changement de mot de passe** — `supabase.auth.updateUser({ password })` depuis un formulaire dédié.
- **Préférences notifications** — toggle par type (NC créée, audit livré, mention, etc.). La table `notifications` existe mais aucune préférence utilisateur n'est lisible.
- **Sessions actives** — lister les sessions Supabase, permettre la déconnexion à distance.
- **Suppression de compte** — flow RGPD avec confirmation forte.
- **Téléchargement des données** — export RGPD (article 20).
- **2FA / MFA** — `supabase.auth.mfa.enroll()` (TOTP). Différenciant sur du SaaS B2B accessibilité.

### Workflow audits / NC

- **Tri par colonne dans la liste audits** ([audits/page.tsx](src/app/(dashboard)/audits/page.tsx)) — actuellement tri figé sur `updated_at desc`. Ajouter tri par client, statut, score, date de livraison.
- **Filtre "Mes audits"** (assignés à moi) et "Mes NC" — courant en SaaS B2B, absent ici.
- **Bulk actions sur la liste audits** — changer le statut de N audits en une fois, archiver, exporter PDF de plusieurs. Le pattern existe déjà sur la liste NC ([anomalies-list.tsx:239](src/app/(dashboard)/audits/[uuid]/anomalies/anomalies-list.tsx#L239)), à généraliser.
- **Recherche globale (Cmd+K)** — palette de commandes pour sauter directement à un audit/projet/client/NC. Forte attente sur un dashboard SaaS moderne.
- **Annulation (undo) après transition de statut** — toast "Audit livré. [Annuler]" pendant 5 secondes. Évite la panique sur les transitions irréversibles côté UX (la transition reste réversible via le cycle de vie ; juste l'undo immédiat manque).
- **Templates de NC fréquentes** — pré-remplir titre + recommandation pour les NC classiques (contraste insuffisant, lien sans intitulé, image sans alt, etc.).
- **Brouillons de NC** — actuellement la création de NC est tout-ou-rien, pas de sauvegarde intermédiaire.

### Empty states et onboarding

- **22 pages sans `loading.tsx`** — flash blanc systématique pendant la nav (dont `/admin/overview`, `/organizations/[slug]/*`, `/pricing`).
- **Pas d'onboarding première connexion** — pas de wizard ni de tour guidé. Le user débarque sur `/dashboard` qui peut être vide (0 audit) avec un seul empty state (`/dashboard` ligne 301). Proposer une coach mark + un parcours guidé "Créer ton premier audit en 3 minutes".
- **Empty states inégaux** — `/dashboard` en a un joli ([page.tsx:398-427](src/app/(dashboard)/dashboard/page.tsx#L398-L427)) mais `/clients`, `/projects`, `/references`, `/users` quand vides ne montrent qu'un texte sec dans une `<div>`.
- **Pas d'aide contextuelle** — aucune tooltip "?" sur les concepts (RGAA vs WCAG, sévérité critique vs majeure, types de pages MANDATORY/REPRESENTATIVE/TRANSVERSAL). Cible : auditeur junior et client_admin non-expert.
- **Pas de check-list "Compléter mon org"** — pour les nouvelles orgs : ajouter logo, inviter premier membre, créer premier projet, etc.

### Accessibilité (cible : RGAA AA)

- **Réaliser l'audit RGAA de l'app elle-même** — la page `/accessibility` annonce honnêtement "non conforme, audit planifié". Tant que cet audit n'est pas fait, le produit ne peut pas mettre en avant son propre engagement. Quick win produit + SEO.
- **Lancer `npm run e2e -- a11y.spec.ts` en CI** — la spec [e2e/a11y.spec.ts](e2e/a11y.spec.ts) existe (S4.1) mais elle nécessite un serveur. Brancher dans la GitHub Action de PR pour bloquer les régressions.
- **Tabs nav audit en mobile** ([audit-tabs-nav.tsx:56](src/components/audit/audit-tabs-nav.tsx#L56)) — `overflow-x-auto` sans flèches de scroll. Ajouter des chevrons gauche/droite en mobile, ou wrapper sur plusieurs lignes.
- **Skip-to-main link** — à vérifier sur tout le dashboard. Présent sur les pages publiques (`/`), à vérifier sur `(dashboard)/layout.tsx`.
- **Contraste des badges en dark mode** — vérifier `SeverityBadge`, `AuditStatusBadge` avec axe-core (les couleurs warning/destructive peuvent passer juste sous 4.5:1).

### Sécurité account-level

- **2FA absent** — différenciant B2B.
- **Pas de captcha sur login** — ouvert à l'énumération d'email malgré le rate-limit IP de S1.2. Ajouter hCaptcha ou Turnstile.
- **Pas d'historique de connexion exposé au user** — `audit_logs` capture les `login.attempt`/`login.failed` (S1.2) mais le user ne les voit nulle part. Proposer une carte "Sessions récentes" dans Settings.

## P2 — Amélioration (polish, qualité)

### Design system et cohérence

- **34 occurrences de `p-6 md:p-8` sur le `<div container>`** — extraire un composant `<PageContainer>` (variants `narrow` / `wide`) pour assurer la cohérence et faciliter une future bascule full-bleed.
- **Pas de mode "sidebar collapsée" (icônes seulement)** — courant pour gagner de la place sur les workspaces complexes (matrice de conformité).
- **Avatar topbar : pas de fallback couleur** ([topbar.tsx:51](src/components/layout/topbar.tsx#L51)) — toujours `bg-primary/10`. Générer une couleur déterministe depuis l'email (style GitHub) pour différencier visuellement les membres d'une grosse équipe.
- **`Toaster`/Sonner utilisé dans 1 seul fichier** (users-list.tsx). Le reste affiche des `<p role="alert">` inline. Standardiser sur Sonner pour TOUS les feedback post-action (succès créa, échec API, etc.).
- **Pas de thèmes utilisateur** — juste light/dark via next-themes. Le branding org est déjà custom ([branding/server.ts](src/lib/branding/server.ts)) ; étendre à un thème "high-contrast" serait un plus a11y.
- **Component icons → IconKey registry** est limité (4 icônes dans KpiCard, 10 dans Sidebar). Quand un nouveau besoin arrive ça force d'éditer le registre. À considérer : pattern "named icon as prop" plutôt qu'enum.

### Workflow et productivité (raccourcis)

- **Aucun raccourci clavier global** — Cmd+K (recherche), Cmd+/ (aide), `?` (cheatsheet). En SaaS power-user c'est un standard.
- **Sauvegarde matrice : feedback léger** — l'indicateur de statut est en bas ([conformity-matrix-layout.tsx:506-512](src/app/(dashboard)/audits/[uuid]/matrix/conformity-matrix-layout.tsx#L506-L512)), un user qui scrolle ne le voit pas. Proposer un toast Sonner discret après chaque flush réussi.
- **Pas de "Voir le diff" sur une transition de statut** — `audit_logs` contient l'historique mais aucune UI ne le lit (sauf la page admin `/organizations/[slug]/audit-logs`). Une mini-timeline sur la page de détail audit serait précieuse pour l'auditeur lead.

### Performance et architecture

- **Composants client volumineux** :
  - [nc-detail.tsx](src/app/(dashboard)/audits/[uuid]/anomalies/[ncId]/nc-detail.tsx) : 1206 lignes
  - [users-list.tsx](src/app/(dashboard)/users/users-list.tsx) : 1009 lignes
  - [client-detail.tsx](src/app/(dashboard)/clients/[clientId]/client-detail.tsx) : 980 lignes
  - [anomalies-list.tsx](src/app/(dashboard)/audits/[uuid]/anomalies/anomalies-list.tsx) : 787 lignes
  - [conformity-matrix-layout.tsx](src/app/(dashboard)/audits/[uuid]/matrix/conformity-matrix-layout.tsx) : 692 lignes

  → Tous sont `"use client"` donc partent dans le bundle JS. Découper en sous-composants serveur quand possible, et fractionner les gros client components.

- **31 composants `use client` dans `src/app`** — auditer si tous ont vraiment besoin d'interactivité.
- **`report-template.tsx` : 1864 lignes** — c'est de la génération HTML pour PDF, pas du bundle client, mais 1864 lignes en un seul fichier est dur à maintenir. Découper par section (cover, synthèse, NC, méthodologie).
- **Pas de `React.memo` / `useMemo` sur les listes longues** — sur des audits de 50+ pages × 106 critères, la matrice peut souffrir. Mesurer via React DevTools Profiler.

### Internationalisation

- **Pas de détection auto de la langue navigateur** — premier chargement non authentifié → toujours FR. Lire `Accept-Language` sur le serveur et set le cookie initial.
- **Pas de switch langue rapide hors menu** — la `LanguageToggle` est dans le topbar, c'est OK ; vérifier qu'elle reste accessible en mobile (cf. P0 sidebar).
- **Plurals incomplets** — beaucoup de messages utilisent `{count}` sans `plural`. Faire une passe sur les chaînes qui décrivent des nombres.
- **Pas de timezone visible** — toutes les dates sont en local navigateur. Pour des audits collaboratifs internationaux, une mention "(votre heure locale)" serait honnête.

### Page publique / marketing

- **Home statique sans preuve sociale** — pas de logos clients, pas de témoignages, pas de chiffres ("X audits gérés", "Y clients", "Z critères vérifiés"). Pour vendre un SaaS B2B, indispensable.
- **Pricing sans FAQ** — questions classiques (TVA incluse ?, engagement ?, support inclus ?, RGPD ?, hébergement ?). Bonne pratique SaaS + bonus SEO long-tail.
- **Pas de page Roadmap publique / Changelog** — montre que le produit évolue, rassure les acheteurs.
- **Pas de blog / cas client** — content marketing 0. Pour du B2B accessibilité, des articles "Comment réussir un audit RGAA ?" + cas clients = lead magnet.
- **Page legal/privacy avec template par défaut** — à personnaliser avec la vraie SAS (SIRET, TVA intracom, hébergeur réel, etc.). Déjà flagué en CLAUDE.md mais pas fait.

### Notifications

- **Polling 30s** ([notifications-bell.tsx:28](src/components/layout/notifications-bell.tsx#L28)) — c'est OK mais Supabase Realtime serait plus efficient. Trade-off : Realtime ajoute du WebSocket + une connexion par user. Pour < 50 users actifs en simultané, garder polling.
- **Pas de groupement** — 10 NC créées d'affilée → 10 notifications. Grouper "X NCs créées sur l'audit Y" comme Slack/GitHub.
- **Pas de "Marquer comme non lu"** — utile pour reporter une notif.
- **Pas de canal email pour les notifications** — toggle "M'envoyer un email pour les mentions" absent.

## P3 — Idées long terme

### Fonctionnalités produit différenciantes

- **Mode collaboratif temps réel sur la matrice** — type Google Docs (curseurs, présence). Supabase Realtime + CRDT. Lourd mais wow effect.
- **Suggestions IA pour les recommandations de NC** — "Pour cette NC sur le contraste, voici 3 reformulations de la recommandation alignées sur le RGAA 4.1.2". OpenAI/Anthropic embedded.
- **Scanner d'URL intégré** — Lighthouse/axe-core dans le pipeline pour pré-remplir une partie de la matrice automatiquement.
- **Comparateur d'audits** — voir l'évolution d'un même projet entre audit N et audit N-1 (gain de conformité, NC corrigées, NC nouvelles).
- **Workflow review proofreader** — il existe (`audit.proofreading` feature) ; étendre avec des suggestions de modifications inline (style Word Track Changes).
- **API publique read+write** — actuellement read-only (`audits:read`, `nc:read`...). Étendre à `audits:write`, `nc:write` pour permettre des intégrations CI (créer une NC depuis un commentaire de PR GitHub).
- **Webhooks bidirectionnels** — recevoir un webhook pour mettre à jour le statut d'une NC depuis Jira/Linear.
- **Intégrations Slack/Teams** — "Une NC critique a été créée sur l'audit X" dans #accessibility.
- **Mode présentation client** — vue read-only de l'audit avec branding client, partagée par URL signée (sans login pour le client).
- **Exports complémentaires** :
  - PDF/UA (pas juste PDF — vraie conformité PDF accessible).
  - DOCX (rapport éditable).
  - JSON (pour intégrations).
  - Matrice CSV (déjà NC fait, manque la matrice).
- **Templates d'audit RGAA prêts** — "Site institutionnel public", "E-commerce", "Application interne" — pré-charge sample + critères pondérés.

### Évolutions plateforme

- **Multi-langue audit** — un audit produit en FR avec rapport client en EN.
- **Multi-référentiel par audit** — auditer RGAA ET WCAG dans la même grille (déduplication intelligente).
- **Workspaces effectifs** — la fondation est posée (migration 61) mais sans UI : switcher de workspace en sidebar, assignation projet→workspace, gestion membres workspace.
- **Marketplace de templates / référentiels** — communautaire, monétisé.
- **Mode "Audit court" / "Audit complet"** — variantes de RGAA simplifié (10 critères clés) pour faire des pré-audits commerciaux.

### Différenciation marché

- **Certificat de conformité PDF signé** — délivré automatiquement quand score = 100, avec QR code de vérification.
- **Espace client white-label** — extension du branding actuel : domaine custom, emails depuis leur domaine.
- **API freemium** — 1000 requêtes/mois gratuit, paid au-delà. Élargit le funnel d'acquisition.
- **Programme partenaires / agences** — référencement croisé, taux de commission.

## Annexe — Fichiers à toucher en priorité

Si tu démarres un sprint UX/produit, par ordre d'impact :

1. **Mobile** — [sidebar.tsx](src/components/layout/sidebar.tsx), [topbar.tsx](src/components/layout/topbar.tsx), [(dashboard)/layout.tsx](src/app/(dashboard)/layout.tsx) → ajouter Sheet/Drawer.
2. **Settings** — [settings/page.tsx](src/app/(dashboard)/settings/page.tsx) → vraie page d'édition.
3. **Dashboard** — [dashboard/page.tsx](src/app/(dashboard)/dashboard/page.tsx) + [evolution-chart.tsx](src/components/dashboard/evolution-chart.tsx) → vraies données ou retrait du mock.
4. **AlertDialog** — créer [components/ui/alert-dialog.tsx](src/components/ui/alert-dialog.tsx) (Radix) → remplacer les 6 `window.confirm`.
5. **Loading states** — créer 22 `loading.tsx` génériques avec `<Skeleton>` cohérent.
6. **Toasts** — généraliser Sonner ([components/ui](src/components/ui)) pour les feedbacks post-action.
7. **Empty states** — composant `<EmptyState>` partagé (déjà inline dans dashboard, à extraire).
8. **Onboarding** — `(dashboard)/dashboard/page.tsx` détecter "first run" (0 audit + < 7j depuis création compte) → afficher coach mark.

## Méthode et limites de cet audit

- Audit statique du code, sans run de l'app.
- Estimation d'impact basée sur les patterns SaaS B2B classiques, pas sur des
  données utilisateurs réelles (pas de heatmap, pas d'analytics).
- Sécurité côté infra/code = couvert par [ROADMAP.md](ROADMAP.md). Ce
  document complète sur l'UX/produit.
- A11y détaillée = nécessite une vraie passe axe-core sur l'app en
  fonctionnement + idéalement un audit RGAA externe (cf. P1 a11y).
