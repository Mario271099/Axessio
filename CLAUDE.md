# Axessio — Instructions pour Claude Code

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
- 3 rôles : `auditor` (interne, accès total), `client_admin`, `client_member`

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

## Fichiers structurants

- `src/types/domain.ts` — types métier
- `src/lib/score.ts` — formule officielle
- `src/lib/constants.ts` — labels FR
- `src/lib/supabase/{client,server,middleware,storage-key}.ts` — clients Supabase
- `src/lib/auth.ts` — `requireProfile()`
- `supabase/migrations/` — schéma SQL
- `ANALYSIS.md` — analyse du legacy

## Roadmap

- [x] Phase 1 : Auth + Dashboard + Multi-tenant + RLS
- [x] Phase 2 : Création/édition d'audits + gestion de l'échantillon
- [x] Phase 3 : Déploiement Vercel
- [ ] Phase 4 : Import RGAA complet (~106 critères)
- [ ] Phase 5 : Matrice de saisie de conformité
- [ ] Phase 6 : Création/édition des non-conformités
- [ ] Phase 7 : Gestion des clients/projets/utilisateurs (CRUD)
- [ ] Phase 8 : Notifications (Resend + React Email)
- [ ] Phase 9 : Export PDF / CSV
- [ ] Phase 10 : Tests automatisés (Vitest + Playwright)

## Workflow avec l'utilisateur

L'utilisateur (Mario) n'est pas développeur. Il décrit ce qu'il veut, Claude Code modifie les fichiers, l'utilisateur teste. **Surtout pas de suggestions du genre "ajoutez ceci au fichier X" — modifie directement**.
