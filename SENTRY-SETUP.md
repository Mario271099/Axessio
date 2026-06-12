# Sentry — guide d'activation pas à pas

> Sentry est le service qui capture les erreurs de l'application en
> production : si un utilisateur rencontre un bug (page qui plante, export
> PDF qui échoue, webhook Stripe en erreur), tu reçois un email avec le
> détail technique, l'utilisateur et l'organisation concernés — sans
> attendre qu'on se plaigne.
>
> **Tout est déjà branché côté code** (mode tolérant) : il ne manque que la
> clé. Ce guide prend ~15 minutes. Gratuit (plan Developer : 5 000 erreurs
> par mois, largement suffisant pour démarrer).

---

## Étape 1 — Créer le compte et le projet

1. Va sur [sentry.io/signup](https://sentry.io/signup/) → crée un compte
   (tu peux utiliser « Sign up with GitHub » pour ne pas gérer un mot de
   passe de plus).
2. À la création, Sentry demande un **nom d'organisation** : mets `axessyo`.
3. Il propose ensuite de créer un premier projet :
   - **Platform** : cherche et choisis **Next.js**.
   - **Alert frequency** : laisse le choix par défaut
     (« Alert me on every new issue ») — c'est ce qui déclenche les emails.
   - **Project name** : `axessyo`.
   - Clique **Create Project**.
4. Sentry affiche alors une page d'instructions d'installation —
   **ignore-la entièrement** (l'installation est déjà faite dans le code).
   La seule chose à récupérer dessus : la ligne `dsn: "https://...@....ingest.sentry.io/..."`.

### Récupérer le DSN (si tu as fermé la page)

Menu de gauche → **Settings** (roue dentée) → **Projects** → `axessyo` →
**Client Keys (DSN)** → copie la valeur du champ **DSN**
(`https://...@....ingest.sentry.io/...`).

✅ **Comment savoir que ça a marché :** tu as une chaîne qui commence par
`https://` et contient `ingest.sentry.io` (ou `ingest.de.sentry.io`).

> ℹ️ Le DSN n'est pas un secret sensible : il ne permet que d'ENVOYER des
> événements, pas de lire quoi que ce soit. C'est pour ça qu'il peut être
> `NEXT_PUBLIC_`.

---

## Étape 2 — Poser la clé dans Vercel

1. vercel.com → projet **axessyo** → **Settings** → **Environment Variables**
   → **Add**.
2. - **Key** : `NEXT_PUBLIC_SENTRY_DSN`
   - **Value** : le DSN copié à l'étape 1
   - **Environments** : coche **Production** et **Preview**.
3. **Save**.
4. ⚠️ Redéploie pour que la variable soit prise en compte : onglet
   **Deployments** → dernier déploiement de `main` → menu **⋯** →
   **Redeploy** → confirme. Attends le statut **Ready**.

✅ **Comment savoir que ça a marché :** voir l'étape 4 (test de bout en bout).

---

## Étape 3 (optionnelle) — Stack traces lisibles (source maps)

Sans cette étape, Sentry fonctionne mais les erreurs JavaScript du
navigateur s'affichent en code « minifié » (difficile à lire). Cette étape
permet à Sentry de retrouver le code d'origine. **Tu peux la sauter au
lancement et la faire plus tard.**

1. Dans Sentry : **Settings** → **Auth Tokens** (section Developer Settings)
   → **Create New Token** → nom `vercel-sourcemaps` → crée et copie le token
   (`sntrys_...`). Il ne sera plus affiché ensuite.
2. Dans Vercel → Environment Variables, ajoute ces 3 variables
   (Production + Preview) :

| Key | Value |
|---|---|
| `SENTRY_ORG` | `axessyo` (le slug de ton organisation Sentry, visible dans l'URL : sentry.io/organizations/**axessyo**/) |
| `SENTRY_PROJECT` | `axessyo` (le nom du projet) |
| `SENTRY_AUTH_TOKEN` | le token `sntrys_...` copié au point 1 |

3. Redéploie (comme à l'étape 2.4).

✅ **Comment savoir que ça a marché :** dans les logs de build Vercel
(Deployments → le déploiement → Build Logs), des lignes mentionnent
« Uploading source maps » sans erreur.

---

## Étape 4 — Tester de bout en bout

Le plus simple : demande à Claude Code de créer une **route de test
temporaire** qui déclenche volontairement une erreur, par exemple :

> « Ajoute une route /api/sentry-test qui lève une erreur volontaire,
> je veux tester Sentry, puis on la supprimera. »

Ensuite :

1. Visite `https://axessyo.com/api/sentry-test` dans ton navigateur
   (la page affichera une erreur — c'est voulu).
2. Va sur sentry.io → **Issues** : dans la minute, une issue
   « Sentry test » doit apparaître.
3. Tu dois aussi recevoir un **email d'alerte** de Sentry.
4. Redemande à Claude Code de **supprimer la route de test**.

✅ **Comment savoir que ça a marché :** l'issue apparaît dans Sentry avec
l'environnement `production`, et l'email d'alerte est arrivé.

---

## Ce que Sentry capture (déjà câblé dans le code)

- Toute erreur serveur non gérée (pages, server actions, routes API).
- Les erreurs JavaScript côté navigateur.
- Des captures explicites aux endroits critiques : webhook Stripe,
  génération PDF, dispatcher de webhooks sortants, auto-création de profil.
- Chaque événement est étiqueté avec l'**utilisateur** (id) et
  l'**organisation active** — indispensable pour diagnostiquer un bug
  multi-tenant. Aucune donnée personnelle (ni email ni nom) n'est envoyée.

## Réglages utiles après quelques semaines

- **Quota** : plan gratuit = 5 000 événements/mois. Si une erreur en boucle
  consomme le quota, ouvre l'issue dans Sentry → bouton **Ignore** le temps
  du correctif.
- **Alertes** : par défaut, email à chaque nouvelle issue. Réglable dans
  **Alerts** → la règle créée avec le projet.
- **Performance** : 10 % des requêtes sont tracées (réglé dans le code) —
  visible dans l'onglet **Performance**, utile pour repérer une page lente.
