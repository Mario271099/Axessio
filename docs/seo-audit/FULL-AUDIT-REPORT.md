# Audit SEO — www.axessyo.com

Date : 29 septembre 2026 · Périmètre : site public (6 pages indexables + pages d'authentification) · Type d'activité détecté : **SaaS B2B** (outil d'audit d'accessibilité numérique, marché francophone)

Mesures faites depuis l'extérieur (curl) et par lecture du code source. Pas de données Google Search Console, CrUX ni GA4 (aucun accès configuré) : les temps de réponse sont des mesures ponctuelles, pas des données terrain.

## Score global : 55 / 100

| Catégorie | Poids | Score |
|---|---|---|
| SEO technique | 22 % | 50 |
| Qualité du contenu | 23 % | 45 |
| SEO on-page | 20 % | 75 |
| Données structurées (schema) | 10 % | 80 |
| Performance | 10 % | 55 |
| Visibilité dans les moteurs IA | 10 % | 25 |
| Images | 5 % | 60 |

Les fondations sont bonnes (titres, H1, JSON-LD, en-têtes de sécurité). Le score est tiré vers le bas par trois bugs techniques faciles à corriger et par le très faible volume de contenu.

## Les 5 problèmes les plus importants

1. **L'image de partage (Open Graph / Twitter) est cassée.** `/opengraph-image` et `/twitter-image` redirigent vers `/login` (307) pour un visiteur non connecté. Un lien Axessyo partagé sur LinkedIn, Slack ou X s'affiche sans image.
2. **Les pages inexistantes redirigent vers /login au lieu de renvoyer une erreur 404.** Google peut traiter ça comme un « soft 404 » et une URL mal tapée (ou un ancien lien) mène à un écran de connexion.
3. **Les URL canoniques, le sitemap et robots.txt pointent vers `axessyo.com`, alors que ce domaine redirige vers `www.axessyo.com`.** Google reçoit des signaux contradictoires sur l'adresse officielle du site.
4. **Les robots des moteurs IA sont bloqués** (GPTBot, ChatGPT-User, ClaudeBot, Google-Extended, etc.). Axessyo ne peut pas être cité par ChatGPT, Claude ou Perplexity lorsqu'on leur demande « quel outil pour gérer un audit RGAA ? ».
5. **Très peu de contenu indexable.** 6 pages, dont 4 pages légales ; l'accueil fait environ 450 mots. Aucune page ne vise les recherches réelles des prospects (« logiciel audit RGAA », « grille RGAA 4.1 », « déclaration d'accessibilité », etc.).

## Les 5 corrections rapides

1. Ajouter `/opengraph-image`, `/twitter-image`, `/apple-icon` à la liste des routes publiques du proxy.
2. Laisser passer les URL inconnues pour qu'elles tombent sur la page 404 du site.
3. Choisir un seul domaine officiel (apex **ou** www) et aligner Vercel + la variable `NEXT_PUBLIC_APP_URL`.
4. Ajouter l'image Open Graph à la page Tarifs (sa balise `og:image` est absente).
5. Raccourcir la meta description de l'accueil (environ 187 caractères ; Google coupe vers 155-160).

---

## 1. SEO technique — 50/100

**Ce qui fonctionne**
- HTTPS avec HSTS (preload), en-têtes de sécurité complets (CSP, X-Frame-Options, Permissions-Policy, Referrer-Policy).
- `robots.txt` et `sitemap.xml` présents et générés par le code ; espaces privés (`/dashboard`, `/audits`…) bien exclus.
- Pages de connexion et d'inscription en `noindex, nofollow`.
- Les staging et previews sont protégés contre l'indexation (garde-fou `IS_PRODUCTION_DEPLOYMENT`).
- Le slash final redirige proprement (`/pricing/` → `/pricing`).

**Problèmes**

| Gravité | Problème | Preuve | Correction |
|---|---|---|---|
| Critique | Images OG/Twitter redirigées vers /login | `GET /opengraph-image` → 307 `/login` | Ajouter ces chemins à `PUBLIC_PATHS` dans `src/lib/supabase/middleware.ts` (le test `pathname.includes(".")` ne les couvre pas : elles n'ont pas d'extension) |
| Élevée | URL inconnues → 307 vers /login | `GET /page-inexistante-xyz` → 307 `/login` | Pour un visiteur non connecté, ne rediriger que les préfixes réellement privés (`/dashboard`, `/audits`, `/clients`, `/projects`, `/users`, `/settings`, `/organizations`, `/notifications`, `/onboarding`) ; le reste doit afficher le 404 |
| Élevée | Canonical, sitemap et robots.txt pointent vers un domaine qui redirige | `canonical = https://axessyo.com/…` alors que `axessyo.com` → 308 `www.axessyo.com` | Soit mettre `axessyo.com` en domaine principal sur Vercel (www → apex), soit poser `NEXT_PUBLIC_APP_URL=https://www.axessyo.com`. La première option ne demande aucun changement de code |
| Moyenne | Deux redirections en chaîne depuis http | `http://axessyo.com/pricing` → `https://axessyo.com/pricing` → `https://www.axessyo.com/pricing` | Disparaît avec la correction précédente |
| Faible | Directive `Host:` dans robots.txt | Ignorée par Google, pointe vers l'apex | Supprimer |
| Faible | `lastmod` de l'accueil et des tarifs = date du déploiement | Change à chaque mise en ligne même sans changement de contenu | Utiliser une date fixe, mise à jour à la main quand le contenu change |

## 2. Qualité du contenu — 45/100

**Ce qui fonctionne** : discours clair et spécialisé (RGAA, WCAG, RAWeb, RAAM), page Tarifs riche (842 mots, comparatif, FAQ), déclaration d'accessibilité publiée, ce qui est un vrai signal de confiance pour ce secteur.

**Problèmes**
- **Élevée** — Seulement 2 pages « commerciales » indexables (accueil, tarifs). Rien ne répond aux recherches d'information des prospects. Pistes : pages par référentiel (`/rgaa`, `/wcag`, `/raweb`, `/raam`), page « pour les auditeurs » / « pour les équipes clients », guides (méthode d'audit RGAA, calcul du taux de conformité, rédiger une déclaration d'accessibilité).
- **Moyenne** — E-E-A-T limité : pas de page « À propos », pas d'auteur ou d'expertise affichée (auditeurs certifiés, expérience), pas de témoignages clients ni de logos.
- **Moyenne** — Accueil court (environ 450 mots) : peu de texte explicatif autour des fonctionnalités.
- **Info** — La version anglaise existe (cookie de langue) mais sur les mêmes URL, donc Google ne voit que le français. Pas grave si la cible est francophone ; sinon il faudra des URL séparées (`/en/…`) avec `hreflang`.

## 3. SEO on-page — 75/100

**Ce qui fonctionne** : un seul H1 par page, titres uniques et descriptifs, hiérarchie H2 logique, meta descriptions uniques, attribut `lang="fr"`, maillage interne cohérent via la navigation et le pied de page.

**Problèmes**
- **Moyenne** — Meta description de l'accueil trop longue (environ 187 caractères).
- **Faible** — Le H1 de l'accueil (« Pilotez vos audits d'accessibilité sans tableurs. ») ne contient pas les mots-clés principaux (« RGAA », « logiciel d'audit »). Le titre de la page les contient, donc l'impact est modéré.
- **Faible** — Le pied de page (« Référentiels pris en charge », « Produit »…) est en H2 : il vaudrait mieux des titres non hiérarchiques pour ne pas diluer la structure de chaque page.

## 4. Données structurées — 80/100

**Présent** : `SoftwareApplication` + `Offer` + `FAQPage` (accueil), `Product` + `Offer` + `FAQPage` (tarifs), `Organization` + `ContactPoint` (toutes les pages).

- **Info** — Depuis 2023, Google n'affiche plus les résultats enrichis FAQ que pour les sites gouvernementaux et de santé. Le balisage reste utile pour les moteurs IA ; ne pas en attendre d'affichage enrichi sur Google.
- **Faible** — Ajouter `sameAs` (LinkedIn, etc.) et `logo` à `Organization`, et un `WebSite` sur l'accueil.

## 5. Performance — 55/100 (mesures ponctuelles, pas de données terrain)

- **Moyenne** — Temps avant le premier octet (TTFB) entre 1,6 et 2,4 s sur l'accueil et les tarifs. Les pages publiques sont générées à chaque visite (`Cache-Control: private, no-store`) parce qu'elles lisent la session et le cookie de langue. Rendre l'accueil et les pages légales statiques (ou mises en cache) ferait passer ce temps sous 200 ms.
- **Faible** — Beaucoup de scripts (44 sur l'accueil, 73 sur les tarifs) ; 5 polices préchargées. À surveiller dans PageSpeed Insights.

## 6. Visibilité dans les moteurs IA — 25/100

- **Élevée** — `robots.txt` bloque GPTBot, ChatGPT-User, anthropic-ai, ClaudeBot, CCBot et Google-Extended. Conséquence : ChatGPT (navigation), Claude et Gemini ne peuvent ni lire ni citer le site. C'est un choix légitime pour protéger du contenu, mais pour un SaaS qui veut être trouvé, c'est contre-productif. Recommandation : autoriser au minimum les pages publiques pour les robots de *recherche* (`OAI-SearchBot`, `ChatGPT-User`, `Claude-SearchBot`, `Claude-User`, `PerplexityBot`) et ne garder bloqués que les robots d'*entraînement* si on le souhaite.
- **Faible** — Pas de `/llms.txt` (404). Optionnel : Google l'ignore, certains assistants le lisent.
- Le JSON-LD et la FAQ en texte clair sont de bons atouts pour être cité dès que l'accès est ouvert.

## 7. Images — 60/100

- Aucune image `<img>` sans texte alternatif (le site utilise des SVG en ligne).
- **Critique** (déjà compté plus haut) — images OG/Twitter inaccessibles.
- **Moyenne** — La page Tarifs et la page de connexion n'ont pas de `og:image` : leur `openGraph` défini localement remplace celui du layout et perd l'image.

## Limites de cet audit

- Pas d'accès à Google Search Console, CrUX ni GA4 : aucune donnée réelle d'indexation, de positions ou de Core Web Vitals.
- Pas de captures d'écran mobile (Playwright non lancé) ni d'analyse des backlinks.
- Python n'est pas installé sur le poste : les scripts du plugin (rapport PDF, rendu de page) n'ont pas pu tourner ; l'analyse a été faite avec curl et Node.
