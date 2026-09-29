# Plan d'action SEO — www.axessyo.com

Tiré de l'audit du 29 septembre 2026 (voir FULL-AUDIT-REPORT.md). Classé par priorité.

## Critique — à corriger tout de suite

- [ ] Rendre publiques `/opengraph-image`, `/twitter-image` et `/apple-icon` dans le proxy d'authentification (`src/lib/supabase/middleware.ts`). *Effort : 5 min.*

## Élevée — cette semaine

- [ ] Renvoyer une vraie page 404 pour les URL inconnues au lieu de rediriger vers /login (ne protéger que les préfixes privés). *Effort : 30 min + tests E2E.*
- [ ] Choisir un domaine officiel unique et l'aligner partout (Vercel : domaine principal ; variable `NEXT_PUBLIC_APP_URL`). Vérifier ensuite canonical, sitemap et robots.txt. *Effort : 15 min, réglage Vercel.*
- [ ] Décider de la politique vis-à-vis des robots IA ; recommandé : ouvrir les robots de recherche (OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot) aux pages publiques. *Effort : 10 min (`src/app/robots.ts`).*
- [ ] Déclarer le site dans Google Search Console et soumettre le sitemap. *Effort : 15 min.*

## Moyenne — ce mois-ci

- [ ] Ajouter `og:image` / `twitter:image` à la page Tarifs (et aux pages qui redéfinissent `openGraph`).
- [ ] Raccourcir la meta description de l'accueil à environ 155 caractères.
- [ ] Rendre l'accueil et les pages légales statiques ou mises en cache pour passer le TTFB sous 200 ms.
- [ ] Créer les premières pages de contenu : une page par référentiel (RGAA, WCAG, RAWeb, RAAM) et une page « À propos » (équipe, expertise).
- [ ] Ajouter des preuves de confiance : témoignages, logos clients, chiffres.

## Faible — plus tard

- [ ] Supprimer la directive `Host:` de robots.txt.
- [ ] `lastmod` du sitemap : date fixe plutôt que date du déploiement.
- [ ] Pied de page : remplacer les H2 par des titres non hiérarchiques.
- [ ] Enrichir `Organization` (`logo`, `sameAs`) et ajouter `WebSite`.
- [ ] Ajouter un `/llms.txt` (optionnel).
- [ ] Si la cible anglophone devient importante : URL `/en/…` + `hreflang`.
