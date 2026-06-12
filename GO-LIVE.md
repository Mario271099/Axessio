# Go-live Axessyo — guide pas à pas des points bloquants

> Guide destiné à être suivi dans l'ordre, sans connaissance technique.
> Chaque étape se termine par une vérification « ✅ Comment savoir que ça a
> marché ». Compte ~1h30 au total, hors délais de propagation DNS (étape 1).
>
> Prérequis : accès aux comptes **Resend**, **Vercel**, **Supabase**, **GitHub**
> et au gestionnaire DNS du domaine (l'endroit où axessyo.com a été acheté,
> ou Vercel si le domaine y est géré).

---

## Étape 1 — Resend : sortir du mode sandbox (emails)

**Pourquoi :** tant que ce n'est pas fait, les emails (invitations, contact)
ne partent QUE vers ton adresse personnelle. Tout envoi vers un client échoue.

### 1.1 Déclarer le domaine d'envoi

1. Va sur [resend.com](https://resend.com) et connecte-toi.
2. Menu de gauche → **Domains** → bouton **Add Domain**.
3. Saisis `send.axessyo.com` (un sous-domaine dédié à l'envoi : recommandé,
   ça protège la réputation du domaine principal). Région : Europe (Ireland)
   si proposé.
4. Resend affiche alors une liste d'**enregistrements DNS** à créer
   (généralement : 1 enregistrement MX, 1 TXT « SPF », 1 TXT « DKIM »).
   **Laisse cet onglet ouvert.**

### 1.2 Créer les enregistrements DNS

Dans un autre onglet, ouvre le gestionnaire DNS du domaine :

- **Si le domaine est géré chez Vercel** : vercel.com → ton équipe →
  **Domains** → clique sur `axessyo.com` → onglet **DNS Records**.
- **Sinon** (OVH, Gandi, Cloudflare…) : la section « Zone DNS » de ton
  registrar.

Pour **chaque ligne** affichée par Resend :

1. Clique **Add record** (ou « Ajouter une entrée »).
2. Recopie exactement : le **Type** (MX, TXT…), le **Name/Host**
   (ex. `send` ou `resend._domainkey.send`) et la **Value** (longue chaîne).
   ⚠️ Certains registrars ajoutent automatiquement `.axessyo.com` à la fin du
   Name — dans ce cas ne saisis que la partie avant (ex. `send`, pas
   `send.axessyo.com`).
3. Enregistre.

### 1.3 Vérifier

1. Retourne dans l'onglet Resend → bouton **Verify DNS Records**.
2. Statut attendu : **Verified** (vert) sur chaque ligne. La propagation DNS
   peut prendre de 5 minutes à quelques heures — re-clique plus tard si
   c'est encore « Pending ».

✅ **Comment savoir que ça a marché :** la page Domains de Resend affiche
`send.axessyo.com` avec le statut **Verified**.

### 1.4 Mettre à jour l'expéditeur dans Vercel

1. vercel.com → projet **axessyo** → **Settings** → **Environment Variables**.
2. Cherche `RESEND_FROM_EMAIL`. Si elle existe, clique **Edit** ; sinon **Add**.
3. Valeur : `Axessyo <noreply@send.axessyo.com>` — environnement **Production**
   (coche aussi Preview).
4. Sauvegarde. (Le redéploiement se fera à l'étape 3.6.)

### 1.5 Brancher Resend sur les emails de Supabase Auth

**Pourquoi :** les emails de réinitialisation de mot de passe sont envoyés par
Supabase, pas par notre code. Sans SMTP custom, Supabase les limite à ~3/heure
et ils partent d'une adresse générique souvent classée en spam.

1. Dans Resend : menu **API Keys** → **Create API Key** → nom
   `supabase-smtp`, permission **Sending access** → copie la clé (`re_...`).
2. supabase.com/dashboard → ton projet → ⚙️ **Project Settings** →
   **Authentication** (section Configuration) → bloc **SMTP Settings** →
   active **Enable Custom SMTP** et remplis :
   - Sender email : `noreply@send.axessyo.com`
   - Sender name : `Axessyo`
   - Host : `smtp.resend.com`
   - Port : `465`
   - Username : `resend`
   - Password : la clé API copiée au point 1
3. **Save**.

✅ **Comment savoir que ça a marché :** sur la page de connexion de l'app,
clique « Mot de passe oublié », saisis une adresse **différente** de la tienne
(ex. un compte de test Gmail) : l'email doit arriver, expéditeur
`noreply@send.axessyo.com`.

---

## Étape 2 — Mentions légales et politique de confidentialité

**Pourquoi :** obligation légale française (LCEN art. 6) dès que le site est
public. Les pages actuelles sont des gabarits à compléter.

**Ta seule tâche : rassembler les informations ci-dessous et les donner à
Claude Code, qui mettra les pages à jour.**

À rassembler :

- [ ] Forme juridique et dénomination exacte (ex. « Axessyo SAS », ou
      « Mario Harimanitra EI » si micro-entreprise)
- [ ] Numéro SIREN ou SIRET
- [ ] Ville du RCS (si société) + capital social
- [ ] Numéro de TVA intracommunautaire (si assujetti)
- [ ] Adresse du siège
- [ ] Nom du directeur de la publication (toi, vraisemblablement)
- [ ] Email de contact (contact@axessyo.com ?) et téléphone (facultatif)
- [ ] Confirmation de l'hébergeur à afficher : Vercel Inc. (440 N Barranca
      Ave #4133, Covina, CA 91723, USA) — c'est lui qui sert le site.
      La base de données est chez Supabase ; sa **région** (visible dans
      Supabase → Project Settings → General → Region) doit figurer dans la
      politique de confidentialité.

✅ **Comment savoir que ça a marché :** les pages `/legal` et `/privacy`
affichent les vraies informations (Claude Code fera la modification puis tu
relis).

---

## Étape 3 — Variables d'environnement Vercel (Production)

**Pourquoi :** sans elles, certaines protections sont inactives (rate-limit,
cron) ou le SEO pointe vers le mauvais domaine.

### 3.1 Ouvrir le tableau des variables

vercel.com → projet **axessyo** → **Settings** → **Environment Variables**.
Pour chaque variable ci-dessous : vérifier qu'elle existe **et** que
l'environnement **Production** est coché. Sinon, l'ajouter.

### 3.2 Les 8 variables et où trouver leur valeur

| Variable | Où trouver la valeur |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → ⚙️ Project Settings → **API** → « Project URL » |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Même page → « Project API keys » → **anon public** (longue clé `eyJ...`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Même page → **service_role** (`eyJ...`) — ⚠️ secrète, jamais ailleurs que dans Vercel |
| `RESEND_API_KEY` | Resend → **API Keys** (créer une clé « production » si besoin) |
| `RESEND_FROM_EMAIL` | `Axessyo <noreply@send.axessyo.com>` (fait à l'étape 1.4) |
| `NEXT_PUBLIC_APP_URL` | L'URL publique exacte du site, ex. `https://axessyo.com` (sans `/` final) |
| `REDIS_URL` | Redis Cloud (déjà provisionné) → l'URL `rediss://...` — vérifier qu'elle est bien cochée pour Production |
| `CRON_SECRET` | À **générer** : voir 3.3 |

### 3.3 Générer le CRON_SECRET

C'est un mot de passe interne entre Vercel et les tâches planifiées. Pour le
générer, ouvre PowerShell (menu Démarrer → tape « PowerShell ») et colle :

```powershell
-join ((48..57)+(97..122) | Get-Random -Count 48 | ForEach-Object {[char]$_})
```

Copie la chaîne affichée (48 caractères). C'est ton `CRON_SECRET`.
**Garde-la sous la main : la même valeur sert à l'étape 5.**

### 3.4 (Optionnel mais recommandé) Activer Sentry

Si tu crées un compte gratuit sur [sentry.io](https://sentry.io) (projet type
« Next.js »), ajoute aussi `NEXT_PUBLIC_SENTRY_DSN` avec le DSN affiché à la
création du projet. Tout est déjà branché côté code.

### 3.5 Stripe

Ne rien poser : sans `STRIPE_SECRET_KEY`, la plateforme tourne en mode
tolérant (plan free uniquement). Voir [STRIPE-SETUP.md](STRIPE-SETUP.md) le
jour où les données bancaires sont prêtes.

### 3.6 Redéployer

⚠️ Les variables ne sont prises en compte qu'au déploiement suivant :

1. Onglet **Deployments** → dernier déploiement de la branche `main` →
   menu **⋯** → **Redeploy** → confirme.
2. Attends le statut **Ready** (~2 min).

✅ **Comment savoir que ça a marché :**
- Ouvre `https://axessyo.com/robots.txt` : la ligne `Sitemap:` doit pointer
  vers ton domaine (pas vers une URL `.vercel.app`).
- Le cron : dans Vercel → onglet **Logs**, le lendemain matin à 6h UTC, la
  requête `/api/cron/audit-status-auto` doit répondre **200** (pas 503).

---

## Étape 4 — Supabase Auth : URLs de redirection

**Pourquoi :** les liens dans les emails (réinitialisation de mot de passe,
invitation) sont construits par Supabase à partir de cette configuration.
Mal réglée, ils renvoient vers `localhost:3000` → lien mort pour tes clients.

1. supabase.com/dashboard → ton projet → **Authentication** (icône clé dans
   le menu gauche) → **URL Configuration**.
2. **Site URL** : `https://axessyo.com` (ton domaine de prod exact).
3. **Redirect URLs** → **Add URL**, ajoute les trois :
   - `https://axessyo.com/**`
   - `https://www.axessyo.com/**` (si le www existe)
   - `http://localhost:3000/**` (pour continuer à développer en local)
4. **Save**.

✅ **Comment savoir que ça a marché :** refais un « Mot de passe oublié »
depuis la prod : le lien reçu par email commence par `https://axessyo.com/...`
et la page de saisie du nouveau mot de passe s'ouvre correctement.

---

## Étape 5 — GitHub : secrets des workflows

**Pourquoi :** deux automatisations tournent sur GitHub Actions :
- le **dispatcher de webhooks sortants** (toutes les ~5 min — remplace le
  cron Vercel, interdit en plan Hobby) ;
- la **CI** (tests + build + accessibilité sur chaque PR).

1. github.com → ton repo → **Settings** (du repo, pas du compte) →
   **Secrets and variables** → **Actions**.
2. Vérifie/ajoute ces 4 secrets (**New repository secret**) :

| Secret | Valeur |
|---|---|
| `WEBHOOK_DISPATCH_URL` | `https://axessyo.com/api/cron/webhook-dispatch` |
| `CRON_SECRET` | **Exactement** la même valeur que dans Vercel (étape 3.3) |
| `NEXT_PUBLIC_SUPABASE_URL` | Même valeur qu'à l'étape 3.2 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Même valeur qu'à l'étape 3.2 |

✅ **Comment savoir que ça a marché :** onglet **Actions** du repo →
workflow « Webhook dispatch » → bouton **Run workflow** → l'exécution doit
passer au vert. Idem pour « CI » et « Accessibilité (axe-core) » sur le
prochain push.

---

## Vérification finale — smoke test (15 min)

Une fois les 5 étapes faites, dérouler ce parcours sur l'URL de prod, dans
une fenêtre de navigation privée :

1. [ ] La home, `/pricing`, `/accessibility`, `/legal`, `/privacy` s'affichent.
2. [ ] Inscription d'un compte de test (email secondaire) → l'email de
       confirmation arrive → la connexion fonctionne.
3. [ ] Création d'une organisation → elle est bien en plan **Free**
       (page Facturation).
4. [ ] Création d'un client, d'un projet, d'un audit RGAA → les 6 pages
       obligatoires sont créées.
5. [ ] Saisie de quelques critères dans la matrice → le score se met à jour.
6. [ ] Création d'une NC avec une capture d'écran.
7. [ ] Exports : PDF (si plan le permet), CSV et Excel de la matrice.
8. [ ] Invitation d'un membre vers une autre adresse → l'email arrive et le
       lien fonctionne.
9. [ ] « Mot de passe oublié » → email reçu, lien valide.
10. [ ] Supprimer le compte/l'org de test une fois le tour terminé.

En cas de doute sur un point : noter le message d'erreur exact (capture
d'écran) et le donner à Claude Code.
