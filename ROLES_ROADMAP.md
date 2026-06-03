# Axessio — Roadmap des rôles & permissions

> Document de référence pour la refonte du système d'autorisation.
> Source de vérité pour le « qui peut faire quoi » côté UI et serveur.
> À mettre à jour au fil des phases.

## Cible

Une seule source de vérité pour l'autorisation : l'appartenance à
l'organisation (`organization_members.role`). Plus de double système
(`profiles.role` legacy + rôles d'org). Le statut « super-admin
plateforme » devient un simple boolean `profiles.is_platform_admin`.

```
profiles
  └── is_platform_admin: boolean   ← uniquement pour le staff Axessio
       │
       └── peut tout faire, partout (court-circuit RLS)

organization_members
  └── role: owner | admin | auditor | viewer
       │
       └── détermine l'autorisation dans une organisation donnée

audit_assignees (Porte 2)
  └── role: 'contact'
       │
       └── un user externe à l'org, scoped à un audit précis
           (jamais membre, jamais dans le carnet d'adresses)
```

## Matrice de permissions cible

| Capacité | owner / admin | auditor | viewer | contact client¹ |
|---|---|---|---|---|
| Facturation, membres, clients | ✓ | — | — | — |
| Créer projet | ✓ | ✓ | — | — |
| Créer / éditer audit | ✓ | ✓ | — | — |
| Matrice + créer/éditer NC | ✓ | ✓ | — | — |
| Lecture audit / matrice / NC | ✓ | ✓ | ✓ | ✓ |
| Lire fil **client** des NC | ✓ | ✓ | ✓ | ✓ |
| Lire fil **review** des NC | ✓ | ✓ | ✓ | **—** |
| Écrire fil **client** des NC | ✓ | ✓ | ✓ | ✓ |
| Écrire fil **review** des NC | ✓ | ✓ | ✓ | **—** |
| Mettre à jour statut NC | ✓ | ✓ | — | ✓ |

¹ uniquement sur les audits où le contact est assigné via `audit_assignees`.
Le contact n'est jamais membre de l'org : il n'a aucun accès au reste
(autres audits, carnet de clients, facturation, équipe).

## Permissions atomiques

| Code | Catégorie | owner/admin | auditor | viewer | contact |
|---|---|:---:|:---:|:---:|:---:|
| `audit.view` | audit | ✓ | ✓ | ✓ | ✓¹ |
| `audit.edit` | audit | ✓ | ✓ | — | — |
| `audit.delete` | audit | ✓ | — | — | — |
| `audit.assign_auditor` | audit | ✓ | ✓ | — | — |
| `project.manage` | projet | ✓ | ✓ | — | — |
| `client.manage` | admin | ✓ | — | — | — |
| `user.manage` | admin | ✓ | — | — | — |
| `matrix.edit` | matrice | ✓ | ✓ | — | — |
| `nc.create` | NC | ✓ | ✓ | — | — |
| `nc.edit` | NC | ✓ | ✓ | — | — |
| `nc.delete` | NC | ✓ | ✓ | — | — |
| `nc.update_status_client` | NC | ✓ | ✓ | — | ✓¹ |
| `remediation.view` | remédiation | ✓ | ✓ | ✓ | ✓¹ |
| `chat.client.read` | chat | ✓ | ✓ | ✓ | ✓¹ |
| `chat.client.write` | chat | ✓ | ✓ | ✓ | ✓¹ |
| `chat.review.read` | chat | ✓ | ✓ | ✓ | **—** |
| `chat.review.write` | chat | ✓ | ✓ | ✓ | **—** |
| `audit_logs.view_all` | diag | ✓ | — | — | — |
| `impersonate` | diag | (super-admin) | — | — | — |
| `permissions.debug` | diag | ✓ | — | — | — |

¹ scoped à l'audit assigné via `audit_assignees`.

## Mapping legacy → cible

### Rôles plateforme (`profiles.role`)

| Legacy | Cible |
|---|---|
| `admin` | `is_platform_admin = true` |
| `auditor` | aucun (rôle d'org `owner` ou `admin` de leur business) |
| `client_admin` | aucun (rôle d'org `owner`/`admin` de l'org cliente, ou contact via `audit_assignees`) |
| `client` | `audit_assignees.role = 'contact'` |

### Rôles d'organisation (`organization_members.role`)

| Legacy | Cible | Notes |
|---|---|---|
| `owner` | `owner` | inchangé |
| `admin` | `admin` | inchangé |
| `manager` | `auditor` | absorbé dans `auditor` |
| `member` | `auditor` | absorbé dans `auditor` |
| `viewer` | `viewer` | élargi : peut commenter (n'avait que la lecture avant) |
| `guest` | `viewer` | promu : avait moins de droits que viewer ; les vrais invités passent désormais par `audit_assignees.role = 'contact'` (Porte 2) |

### Permissions

| Legacy | Cible |
|---|---|
| `chat.read` | `chat.client.read` + `chat.review.read` (split par fil) |
| `chat.write` | `chat.client.write` + `chat.review.write` (split par fil) |
| autres | inchangées |

## Les 3 gates orthogonaux

Une action est autorisée si **les trois passent** :

```
allow = permission_du_rôle(action)
        AND feature_du_plan(action)
        AND quota_de_l_org(action)
```

- **Permission** → 403 (« ton rôle ne te permet pas »)
- **Feature** → 402 (« plan Pro requis »)
- **Quota** → 402 (« 10/10 clients atteints, upgrade ou archive »)

Les rôles ne sont **jamais** gated par plan. Un viewer reste un viewer
sur Free, Pro ou Enterprise. Le plan ouvre/ferme des features, pas
des rôles.

## Pricing × structure

| Limite | Free | Starter | Pro | Enterprise | Comptée sur |
|---|---|---|---|---|---|
| `max_members` | 2 | 5 | 25 | illimité | `organization_members` (Porte 1) |
| `max_clients` | 1 | 10 | illimité | illimité | `clients.organization_id` |
| `max_active_audits` | 1 | 10 | illimité | illimité | `audits.status != 'ARCHIVED'` |
| `max_audits_per_month` | 2 | 20 | illimité | illimité | `audits.created_at` mois courant |

Les contacts client (Porte 2 via `audit_assignees`) ne sont **pas
comptés** dans `max_members` — c'est ce qui rend le modèle viable
pour une consultance qui invite 50 PO chez ses clients sans payer
50 sièges.

## Plan d'exécution

| Sprint | Phase | Contenu | Statut |
|---|---|---|---|
| 1 | 0 | Quick-fix : `auditor` peut créer un client | ✅ ([4d8db21](#)) |
| 1 | 1 | Schema : clients découplés des orgs (mig. 66) | ✅ ([81ca418](#)) |
| 1 | 4 | Code : `createClient`/`createProject` sans miroir org | ✅ (inclus en P1) |
| 2 | 2 | Rôles d'org : 6 → 4 valeurs + split `chat.client/review` (mig. 67 + 68) | ✅ ([c98d71b](#) + [e5e91aa](#)) |
| 3 | **6A** | Migration `profiles.is_platform_admin` + backfill + `is_admin()` SQL | ⏳ |
| 3 | 5 | Porte 2 : contacts client via `audit_assignees` (role + RLS) | ⏳ |
| 3 | 9 | RLS contacts : fil review masqué pour les contacts | ⏳ (couvert par 5) |
| 4 | 3 | `org_limits` overridables + `max_clients` (mig. 71) | ✅ |
| 4 | 8 | Nouvelles limites côté UI billing + Stripe | ✅ |
| 5 | 6B | TS : `Profile.isPlatformAdmin` + bascule des ~10 checks super-admin | ⏳ |
| 5 | 7 | Onboarding multi-persona (freelance / company / consultancy) | ⏳ |
| 6 | 6C | Bascule des ~60 checks `profile.role` legacy vers org-scopés | ⏳ (gros chantier) |
| 6 | 6D | Drop colonne `profiles.role` + `UserRole` TS | ⏳ |

## Personas servies

| Persona | Org représente | Clients | Membres | Contacts |
|---|---|---|---|---|
| Auditeur freelance | son business solo | ses customers (ministère, etc.) | lui-même (owner) | optionnel |
| Bureau de consultance | la consultance | ses customers | équipe (owner + auditor + viewer) | invite les PO de ses customers |
| Entreprise qui s'audite | sa boîte | elle-même (1 client) ou aucun | équipe interne | invite des auditeurs externes |

## Gardes-fous côté code

- **Une seule source de vérité** : `requireOrgPermission()` côté serveur,
  `canOrg()` côté UI. Jamais de `profile.role === 'X'` inline.
- **RLS = 2ᵉ ligne de défense** : même si un check applicatif est manqué,
  les policies Postgres rejettent la requête.
- **Catalogue versionné** : toute nouvelle permission ajoutée dans
  `src/lib/permissions.ts` doit être miroir d'une ligne dans la
  migration SQL du catalogue (mig. 47 + extensions).
- **Tests** : la matrice est testée dans `src/lib/permissions.test.ts`.
  Si tu modifies un mapping, les tests doivent refléter le changement.

## Anti-patterns à ne pas reproduire

1. Vérifier le rôle plateforme + le rôle d'org à 2 endroits différents
   pour la même action.
2. Ajouter un check de plan dans la matrice des permissions (les axes
   restent orthogonaux).
3. Compter les contacts dans `max_members` (les contacts sont gratuits).
4. Donner `chat.review.*` à un contact (le fil review doit rester
   confidentiel pour l'équipe interne).
5. Backfill mécanique `client → viewer` sans audit des permissions
   gagnées/perdues (cf. CLAUDE.md, le mapping legacy est piégeux).
