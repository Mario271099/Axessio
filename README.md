# Axessyo

> Plateforme SaaS de gestion d'audits d'accessibilité numérique (RGAA, WCAG, RAWeb, RAAM) — successeur moderne de la plateforme legacy `ipedis-platform`.

**Stack** : Next.js 15 (App Router) · React 19 · TypeScript strict · Tailwind v4 · Radix UI / shadcn · Supabase (Postgres + Auth + Storage + RLS) · Resend · Vercel.

---

## 📋 Aperçu du prototype livré

| Module | Statut |
|---|---|
| Schéma de base PostgreSQL (14 tables, énumérations, triggers) | ✅ Prêt |
| Row Level Security multi-tenant avec 3 rôles | ✅ Prêt |
| Authentification email/password (Supabase Auth) | ✅ Prêt |
| Layout Dashboard (sidebar + topbar + responsive) | ✅ Prêt |
| Mode sombre/clair avec `next-themes` | ✅ Prêt |
| Liste des audits (table avec RLS) | ✅ Prêt |
| Détail d'un audit (KPIs, planning, score) | ✅ Prêt |
| **Simulateur de remédiation** | ✅ Prêt (formule officielle RGAA) |
| Liste des non-conformités | ✅ Prêt |
| Liste de l'échantillon (pages testées) | ✅ Prêt |
| Pages Clients, Projets, Paramètres | ✅ Stubs fonctionnels |
| Création d'un audit (formulaire) | 🚧 À faire |
| Saisie de la conformité (matrice critères × pages) | 🚧 À faire |
| Création de NC (formulaire riche) | 🚧 À faire |
| Génération de rapports PDF / CSV | 🚧 À faire |
| Workflow de transitions de statut | 🚧 À faire |
| Notifications email (Resend) | 🚧 À faire |

Voir [`ANALYSIS.md`](./ANALYSIS.md) pour l'analyse détaillée du legacy et les choix d'architecture.

---

## 🚀 Démarrage rapide

### Pré-requis
- Node.js 20+
- Un compte Supabase (gratuit) — [supabase.com](https://supabase.com)
- Un compte Resend (optionnel pour les emails)

### 1. Installer les dépendances

```bash
npm install
# ou : yarn install / pnpm install
```

### 2. Configurer Supabase

Créer un projet sur [supabase.com](https://supabase.com) puis dans le SQL Editor de Supabase, exécuter dans cet ordre :

```bash
supabase/migrations/00_init_schema.sql
supabase/migrations/01_rls_policies.sql
supabase/migrations/02_seed_demo.sql        # optionnel : données de démo
```

> 💡 Si tu utilises la CLI Supabase, lance simplement `supabase db push`.

### 3. Variables d'environnement

Copie `.env.example` en `.env.local` et remplis-le :

```bash
cp .env.example .env.local
```

Récupère les clés dans **Project Settings → API** sur Supabase.

### 4. Créer ton premier utilisateur auditeur

Dans le **SQL Editor** de Supabase, après avoir créé un compte via l'interface Auth (`Authentication → Users → Add user`), exécute :

```sql
update public.profiles
set role = 'auditor', first_name = 'Yannick', last_name = 'Auditeur'
where email = 'ton-email@example.com';
```

### 5. Lancer en local

```bash
npm run dev
```

→ http://localhost:3000

---

## 🔐 Modèle de sécurité

Trois rôles, isolation stricte via **Row Level Security PostgreSQL** :

| Rôle | Visibilité | Modification |
|---|---|---|
| `auditor` (interne) | **Tout** | Tout |
| `client_admin` | Tous les audits/projets de SON `client_id` | Limitée (statut des NC) |
| `client_member` | Uniquement les projets dont il est membre | Limitée (statut des NC) |

Les requêtes côté client ne peuvent **pas** contourner RLS, même avec une clé `anon` exposée. Toute la logique d'autorisation est en base.

---

## 🗄️ Modèle de données

```
clients
  └── projects
       └── audits ──→ references (RGAA, WCAG, RAWeb, RAAM…)
              ├── pages
              │    └── page_conformities (par critère)
              ├── non_conformities
              │    └── nc_attachments
              └── audit_assignees
```

Détails complets : [`supabase/migrations/00_init_schema.sql`](./supabase/migrations/00_init_schema.sql).

---

## 🧮 Calcul du score

Formule officielle (RGAA), portée à l'identique depuis le legacy :

```ts
// src/lib/score.ts
score = (compliant / (totalCriteria - notApplicable)) * 100
```

- `0–49` → **Non conforme** (rouge)
- `50–99` → **Partiellement conforme** (orange)
- `100` → **Totalement conforme** (vert)

Pendant les phases d'audit (`PENDING` → `DELIVERED`), le score est stocké dans `initial_score`. Pendant la remédiation/contre-audit, il est stocké dans `final_score`.

---

## ✨ Le simulateur de remédiation

C'est le **différenciateur clé** du produit. Localisation : `src/app/(dashboard)/audits/[uuid]/simulator/page.tsx`.

L'utilisateur peut cocher virtuellement des NC comme corrigées et voir le score se recalculer en temps réel — sans rien modifier dans la base. Règle métier : **un critère devient conforme uniquement si TOUTES les NC qui y sont rattachées sont cochées**.

Cas d'usage :
- « Si je corrige uniquement les NC critiques, je passe de 62 % à quoi ? »
- « Combien de NC dois-je corriger pour atteindre 80 % ? »
- Priorisation par impact lors de la phase de remédiation.

---

## ♿ Accessibilité de l'outil lui-même

La plateforme est conçue pour passer un audit RGAA AA :

- Composants Radix UI (gestion native du clavier, ARIA, focus trap)
- Skip link, landmarks (`<main>`, `<nav aria-label>`), focus visible
- Contrastes vérifiés AA/AAA dans les deux thèmes
- `prefers-reduced-motion` respecté
- Mode sombre natif sans flash (`disableTransitionOnChange`)
- Tous les inputs ont des `<Label>` associés
- Messages d'erreur via `role="alert"` + `aria-describedby`
- Annonces dynamiques via `aria-live="polite"` (ex : score simulé)

---

## 📁 Structure du projet

```
axessyo/
├── ANALYSIS.md                # Analyse du legacy
├── README.md                  # Ce fichier
├── supabase/migrations/       # Schéma SQL + RLS + seed
└── src/
    ├── app/
    │   ├── (auth)/login/      # Connexion
    │   ├── (dashboard)/       # Routes protégées
    │   │   ├── dashboard/
    │   │   ├── audits/[uuid]/
    │   │   │   └── simulator/ # ← le simulateur
    │   │   ├── clients/
    │   │   ├── projects/
    │   │   └── settings/
    │   └── api/auth/callback/
    ├── components/
    │   ├── ui/                # Primitives (button, card, etc)
    │   ├── audit/             # Composants métier (simulateur, badges)
    │   └── layout/            # Sidebar, Topbar, ThemeToggle
    ├── lib/
    │   ├── supabase/          # Clients server / client / middleware
    │   ├── score.ts           # Formule officielle
    │   ├── constants.ts       # Labels FR
    │   └── utils.ts
    ├── types/domain.ts        # Types métier
    └── middleware.ts          # Auth refresh + redirect
```

---

## 🛣️ Prochaines étapes proposées

Dans l'ordre suggéré :

1. **Création/édition d'audits** : formulaire multi-étapes (service → planning → équipe → pages). Server Actions + validation Zod.
2. **Matrice de conformité** : grille criteria × pages avec saisie en masse (CONFORME / NON CONFORME / NON APPLICABLE).
3. **Création de NC** : formulaire riche avec éditeur de texte (Tiptap), upload de captures vers Supabase Storage.
4. **Workflow** : transitions de statut audit avec règles (ex: passer à `DELIVERED` requiert ≥ 1 NC par page).
5. **Rapports** : export CSV / PDF (avec `@react-pdf/renderer`).
6. **Notifications** : Resend + React Email pour les changements de statut, assignations, rappels.
7. **Import des référentiels complets** : script de seed RGAA 4.1.2 / WCAG 2.2 / RAWeb / RAAM.
8. **Tests** : Vitest + Testing Library + Playwright.

---

## 📜 Scripts disponibles

```bash
npm run dev          # serveur dev avec Turbopack
npm run build        # build production
npm run start        # serveur production
npm run lint         # ESLint
npm run typecheck    # TypeScript --noEmit
npm run supabase:types  # générer les types depuis le schéma Supabase
```
