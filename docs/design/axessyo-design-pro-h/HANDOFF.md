# Axessyo — Refonte « Pro H » : brief pour Claude Code

Ce dossier contient la nouvelle direction visuelle validée par Mario (piste « Pro H »).
Il sert de référence pour appliquer le design **dans le code existant**, sans toucher à la logique métier.

- `tokens.css` : les variables de couleur, rayons, ombres. À reporter dans `src/app/globals.css`.
- `maquettes/*.html` : une maquette par écran. Ce sont des sources de référence (HTML + styles en ligne + données fictives dans le script en bas de fichier). Elles utilisent un moteur de maquette : ne pas les ouvrir dans le navigateur, **lire leur code** pour reprendre structure, espacements, couleurs et effets de survol.
- Maquettes visuelles consultables par Mario sur sa planche de design (claude.ai).

## Règles à respecter

0. **NE PAS TOUCHER AU LOGO.** Les fichiers `src/components/brand/*` (`logo.tsx`, `wordmark.tsx`, `ax-icon.tsx`, `index.ts`), les variables `--brand-*` et `--color-brand-*` de `globals.css`, la police DM Sans chargée pour le logo, `src/app/icon.svg`, `apple-icon.tsx`, `opengraph-image.tsx` et `twitter-image.tsx` restent **strictement identiques**. Dans les maquettes, le petit carré bleu à quatre pastilles à côté du mot « Axessyo » est un **emplacement provisoire** : partout où il apparaît, utiliser le composant `<Logo />` existant, tel quel.
1. **Ne rien changer à la logique** : server actions, requêtes Supabase, RLS, permissions, calcul du score (`src/lib/score.ts`), i18n. On ne touche qu'au rendu.
2. **Garder les conventions de `CLAUDE.md`** : composants style React 19 (pas de `forwardRef`), Server Components par défaut, textes via `next-intl` (ajouter les clés FR et EN), pas d'emoji.
3. **Données réelles uniquement** : les chiffres des maquettes sont fictifs. Si un écran de la maquette montre une donnée que l'app ne calcule pas encore (ex. « +6 points en 3 mois », charge des auditeurs), la laisser de côté et le signaler à Mario, ne pas l'inventer.
4. **Accessibilité non négociable** : focus visible 3 px cobalt, vrais `<button>`/`<a>`/`<input>`/`<label>`, contrastes des tokens respectés, `prefers-reduced-motion` respecté, la couleur ne porte jamais seule une information (sévérité = libellé + couleur).
5. **Tests** : `npm run typecheck`, `npm run lint`, `npm test` doivent rester verts ; mettre à jour les sélecteurs E2E si un titre change.
6. **Une étape à la fois**, un commit par étape, Mario valide dans le navigateur entre chaque étape.

## Principes visuels

- Fond gris-bleu très clair `#F5F6FA`, cartes blanches `#FFFFFF`, bordure `#E4E7F0`, rayon 16 px.
- Une seule couleur de marque : **cobalt `#2440C8`** (boutons principaux, élément actif du menu, focus, liens).
- Accent **ambre `#FFB020`** uniquement graphique (anneau du score moyen, avatar), jamais pour du texte sur fond clair.
- **Cartes sombres `#161A2E`** pour les blocs de synthèse (score moyen, plan, astuces, simulateur).
- **13 couleurs de thématique RGAA** (`--theme-1` à `--theme-13`) : pastilles numérotées, références de critères, barres par thème.
- Logo : **inchangé** (composant `<Logo />` existant, DM Sans). Le logo n'est pas recoloré en cobalt.
- Police **Figtree** pour l'interface, titres en 900 avec lettrage serré (`letter-spacing: -0.03em`), texte courant 15 px.
- Pas de dégradés décoratifs, pas de surtitres en majuscules, pas d'emoji.

## Composants à créer ou restyler (dans `src/components/ui` et `src/components/…`)

| Composant | Référence maquette | Comportement |
|---|---|---|
| `Button` (variantes default, ghost/outline, danger, dark) | toutes | Hauteur 44 px, rayon 10 px, ombre cobalt ; survol plus foncé, icône « + » qui tourne de 90°, flèche qui glisse ; `:active` scale .97 |
| `Card` | toutes | Blanc, bordure `--border`, rayon 16 px, sans ombre au repos |
| Carte « lift » (cliquable) | ProAudits (vue cartes), ProClients, ProDashboard | Survol : monte de 3 px, bordure et ombre de la couleur du client/thème (`--c`) |
| `Sidebar` 256 px | ProDashboard, ProAudits… | Item actif : fond cobalt + texte blanc ; survol : fond `#EEF1FB`, icône qui grossit ; compteur en pastille ; sélecteur d'organisation en haut ; Paramètres + profil en bas |
| Rail 76 px (pages d'un audit) | ProAudit, ProEchantillon, ProNCListe… | Icônes seules, info-bulle au survol et au focus |
| En-tête d'audit + onglets | ProAudit, ProEchantillon, ProNCListe, ProNCFiche, ProSimulateur | Monogramme client, titre, statut en pastille, onglets soulignés (soulignement qui s'étend au survol) |
| `ScoreRing` | ProDashboard, ProAudit, ProAudits | Anneau SVG animé au chargement (stroke-dashoffset), couleur selon seuils 50/100 |
| `LifecycleSteps` (7 étapes) | ProDashboard (mini), ProAudit (complet) | Étape en cours : halo animé / barre qui pulse |
| `SeverityBadge` | ProNCListe, ProNCFiche | Fond pastel + texte foncé (tokens `--severity-*`) |
| `StatusDot` | ProNCListe, ProParametres | Point de couleur + libellé |
| `ThemeChip` | ProMatrice, ProAudit | Pastille numérotée couleur de thème ; sélectionnée = fond plein |
| `FilterChip` | ProAudits, ProNCListe, ProClients | Pilule 36 px ; pressée = fond encre `#161A2E` |
| `C / NC / NA` segmenté | ProMatrice | Vrais boutons radio ; C vert, NC rouge, NA ardoise |
| `Switch` | ProAudit, ProSimulateur, ProParametres | Interrupteur accessible (input checkbox) |
| Barre d'actions groupées | ProNCListe | Apparaît quand des lignes sont cochées |

## Correspondance écrans → routes

| Maquette | Route du projet |
|---|---|
| `ProAccueil.html` | `src/app/page.tsx` (+ `components/public/*`) |
| `ProAuth.html` | Connexion **et** création de compte : `src/app/(auth)/login/` et `src/app/(auth)/register/` (+ `components/auth/auth-layout.tsx`). Un sélecteur « Se connecter / Créer un compte » en haut ; le panneau bleu de droite change selon le mode. À décliner sur forgot / reset / setup-password. Le cadre « Logo Axessyo actuel » = composant `<Logo />` existant. |
| `ProDashboard.html` | `src/app/(dashboard)/dashboard/page.tsx` + `components/dashboard/*` |
| `ProAudits.html` | `src/app/(dashboard)/audits/page.tsx` (+ `audits-table.tsx`, `audits-filters.tsx`) |
| `ProNouvelAudit.html` | `src/app/(dashboard)/audits/new/` (`audit-form.tsx`) |
| `ProAudit.html` | `src/app/(dashboard)/audits/[uuid]/page.tsx` |
| `ProEchantillon.html` | `src/app/(dashboard)/audits/[uuid]/sample/` |
| `ProMatrice.html` | `src/app/(dashboard)/audits/[uuid]/matrix/` |
| `ProNCListe.html` | `src/app/(dashboard)/audits/[uuid]/anomalies/page.tsx` |
| `ProNCFiche.html` | `src/app/(dashboard)/audits/[uuid]/anomalies/[ncId]/` — ordre imposé : 1) « Détails de la non-conformité » (constat, impact, recommandation, code), 2) « Captures » (visionneuse annotée + miniatures), 3) échanges, 4) **« Annexe, critère lié » repliée par défaut en bas de page**. Statut / infos / historique dans la colonne de droite. |
| `ProSimulateur.html` | `src/app/(dashboard)/audits/[uuid]/simulator/` (`components/audit/remediation-simulator.tsx`) |
| `ProPlanning.html` | `src/app/(dashboard)/planning/page.tsx` |
| `ProClients.html` | `src/app/(dashboard)/clients/page.tsx` |
| `ProParametres.html` | `src/app/(dashboard)/organizations/[slug]/…` (membres, facturation) |

## Fenêtres modales (`maquettes/modales/`)

Toutes s'appuient sur les composants `ui/dialog.tsx`, `ui/alert-dialog.tsx` et `ui/sheet.tsx` restylés une seule fois (fond assombri `rgba(22,26,46,.55)`, fenêtre blanche rayon 22 px, en-tête icône + titre + description, croix qui pivote au survol, pied avec « Annuler » à gauche de l'action principale, entrée en fondu). Radix gère déjà le focus, Échap et `aria-modal` : ne pas le casser.

| Maquette | Fichier du projet |
|---|---|
| `ModNC.html` | `audits/[uuid]/matrix/non-conformity-modal.tsx` |
| `ModCapture.html` | `audits/[uuid]/anomalies/[ncId]/nc-attachments-card.tsx` (aperçu plein écran) |
| `ModStatut.html` | `components/audit/audit-status-actions.tsx` (conditions de transition issues de `lib/audit-status.ts`, ne pas en inventer) |
| `ModRelecture.html` | `components/audit/nc-review-actions.tsx` (même gabarit pour demander, approuver, annuler) |
| `ModAssigner.html` | `components/audit/audit-assignees.tsx` et `audit-proofreaders.tsx` |
| `ModInviter.html` | `users/user-dialogs.tsx` (invitation + changement de rôle), `components/audit/audit-contacts.tsx` |
| `ModClient.html` | `clients/clients-list.tsx`, `clients/[clientId]/client-dialogs.tsx` (client et projet) |
| `ModModele.html` | `organizations/[slug]/nc-templates/new-template-dialog.tsx`, `template-row.tsx` |
| `ModBienvenue.html` | `dashboard/welcome-modal.tsx` |
| `ModVoirComme.html` | `components/layout/impersonation-launcher.tsx` |
| `ModConfirmations.html` | toutes les `AlertDialog` de suppression / retrait (audits-table, anomalies-list, sample-actions-bar, client-detail, nc-discussion, users-list, mfa-section…) |
| `ModSupprimerCompte.html` | `settings/delete-account-form.tsx` |
| `ModMenuMobile.html` | `components/layout/mobile-nav-sheet.tsx`, `components/public/public-mobile-nav.tsx` |

Les textes des modales qui décrivent un comportement (ce qui se passe après une relecture, une suppression de compte, un aperçu de rôle) doivent refléter le fonctionnement réel du code : en cas d'écart, garder le comportement du code et signaler à Mario.

Écrans sans maquette (pricing, référentiels, rapport, admin, légal) : appliquer les mêmes composants et principes.

## Ordre de travail proposé

1. **Fondations** : `tokens.css` → `globals.css` (en conservant tel quel le bloc des variables `--brand-*`), police Figtree dans `layout.tsx`, primitives `ui/` (Button, Card, Badge, Input, Select, Tabs, Checkbox, Switch, Tooltip). Vérifier que l'app compile et reste lisible partout.
2. **Coque** : Sidebar, Topbar, menu mobile, rail + en-tête d'audit.
3. **Tableau de bord** puis **liste des audits**.
4. **Page d'un audit** : vue d'ensemble, échantillon, matrice.
5. **Non-conformités** : liste, fiche.
6. **Simulateur**, **planning**, **clients**, **paramètres**.
7. **Fenêtres modales** : restyler `ui/dialog`, `ui/alert-dialog`, `ui/sheet`, puis chaque modale du tableau ci-dessus.
8. **Pages publiques** : accueil, connexion et création de compte, tarifs.
9. **Mode sombre** : à dériver des tokens en fin de chantier (non maquetté).
