# Analyse du code legacy `ipedis-platform`

Document de référence : ce qui a été extrait du ZIP, ce qui est conservé dans la nouvelle plateforme, et ce qui est refactorisé.

---

## 1. Stack legacy détectée

| Couche | Stack legacy | Stack cible |
|---|---|---|
| Backend | Symfony 7 + API Platform + Doctrine ORM + PostgreSQL | Next.js 15 (Server Actions/Route Handlers) + Supabase (Postgres + Auth + RLS) |
| Frontend | Angular 21 + NgRx Signals + Angular Material + ngx-translate | Next.js 15 App Router + React 19 + Tailwind + Radix/shadcn |
| Auth | Symfony Security + JWT custom | Supabase Auth (email/password + magic link) |
| Files | MinIO (S3-compatible) | Supabase Storage |
| Mailer | Mailpit (dev) + Mailer Symfony | Resend + React Email |
| Architecture | DDD/CQRS (Application, Domain, Infrastructure layers) | Approche pragmatique : Server Components + Server Actions + Repositories isolés |

Le legacy compte **~628 fichiers PHP** et **~541 fichiers TypeScript**. Beaucoup de complexité venait du CQRS strict et d'une infrastructure DDD lourde. La nouvelle plateforme garde la richesse du modèle métier mais simplifie radicalement l'infrastructure.

---

## 2. Modèle métier extrait

### 2.1 Hiérarchie des entités

```
Client (organisation cliente)
 └── Project (un site web ou app à auditer)
      └── Audit (une campagne d'audit)
           ├── Pages (échantillon : pages testées)
           │    └── PageConformity (statut par critère et par page)
           └── Anomalies (non-conformités)
                └── liées à : Page + Criteria + Test
```

### 2.2 Référentiels supportés (table `Reference`)

- **RGAA** (versions multiples, ex : 4.1.2)
- **WCAG** (2.1, 2.2)
- **RAWeb** (Référentiel d'accessibilité du web - Mauritanie/Afrique francophone)
- **RAAM** (Référentiel d'accessibilité des applications mobiles)
- **PDF UA**
- **EN 301 549**

Chaque référentiel a une structure :  
`Reference → Thematic (thème) → Criteria (critère numéroté) → Test (test technique)`

Champs Criteria importants conservés : `identifier` (ex: "6.1"), `name`, `url` (lien vers la doc officielle), `disabilities` (handicaps concernés : VISUAL, COGNITIVE, AUDITORY, MOTOR).

### 2.3 Statuts d'audit (workflow)

Conservés et simplifiés :  
`PENDING → PLANNED → IN_PROGRESS → DELIVERED → REMEDIATION → COUNTER_AUDIT → ONLINE → COMPLETED`  
+ `ARCHIVED` et `DELETED` (soft delete).

### 2.4 Types d'audit

- `AUDIT` : audit standard avec contre-audit
- `NO_COUNTER_AUDIT` : audit sans contre-audit
- `COMPLIANCE_AUDIT` : audit de conformité simple

### 2.5 Plateformes

- `DESKTOP` (Web)
- `MOBILE` (Application mobile)

### 2.6 Pages de l'échantillon

Deux types détectés :
- `MANDATORY` : pages obligatoires (Accueil, Contact, Mentions légales, Plan du site, Page d'Accessibilité)
- `OPTIONAL` : pages représentatives spécifiques au site

Niveaux de complexité : `ULTRA_SIMPLE`, `SIMPLE`, `MINIMAL`, `COMPLICATE`.

Cas spécial : les **"Éléments transverses"** sont une page virtuelle (`Page::ELEMENTS_TRANSVERSES`) à laquelle on rattache les NC qui ne dépendent pas d'une page particulière (ex : navigation, footer).

### 2.7 Conformité par critère et par page

Trois statuts : `COMPLIANT` (conforme) / `NON_COMPLIANT` (non conforme) / `NOT_APPLICABLE` (non applicable).

### 2.8 Non-conformités (Anomalies)

Statuts détectés : `OPEN`, `DRAFT`, `CORRECTED`, `NON_REPRODUCIBLE`, `RESOLVED`, `REJECTED`, `CANCELLED`, `IN_PROGRESS`.

Sévérités legacy : `NOTE`, `MINOR`, `MAJOR`, `BLOCKING` → renommées en `LOW` / `MEDIUM` / `HIGH` / `CRITICAL` selon la directive (avec `NOTE` comme cinquième niveau informatif optionnel).

Champs conservés : `name`, `page`, `thematic`, `criteria`, `test`, `resultContent` (description), `solutionContent` (recommandation), `severity`, `status`, `reference` (lien externe), médias.

### 2.9 Rôles utilisateur

Mapping legacy → nouveau :

| Legacy | Nouveau | Description |
|---|---|---|
| `ROLE_INTERNAL_ADMIN` | `auditor` | Équipe interne, accès total |
| `ROLE_EXTERNAL_ADMIN` | `client_admin` | Admin côté client, voit tous les audits de son organisation |
| `ROLE_EXTERNAL_USER` | `client_member` | Membre côté client, voit uniquement les audits auxquels il est assigné |

---

## 3. Calcul du score (formule extraite)

Trouvée dans `Page/Infrastructure/Entity/Properties/PageScore.php` :

```php
public static function calculateScore(
  int $totalOfCompliant,
  int $totalOfNonApplicable,
  int $totalCriteria
): float {
    if ($totalCriteria === $totalOfNonApplicable) return 0.0;
    $score = ($totalOfCompliant / ($totalCriteria - $totalOfNonApplicable)) * 100;
    return round($score, 2);
}
```

Niveaux de conformité officiels (RGAA) :
- `0 ≤ score ≤ 49` : non conforme
- `50 ≤ score ≤ 99` : partiellement conforme
- `score == 100` : totalement conforme

**Cette formule est portée à l'identique** dans `src/lib/score.ts`.

Pendant l'audit (statuts `PENDING`, `PLANNED`, `IN_PROGRESS`, `DELIVERED`), le score est stocké dans `data.initialScore`.  
Pendant la remédiation/contre-audit, il est stocké dans `data.finalScore`.

---

## 4. Simulateur de remédiation

La feature existe déjà dans le legacy (`audit-simulator.component.ts` côté Angular). Le principe :

> Permettre à l'utilisateur de cocher virtuellement des NC comme "corrigées" pour visualiser l'impact immédiat sur le score, **sans modifier l'audit officiel**.

Dans la nouvelle plateforme cette feature est :
- **Côté client uniquement** (aucune persistance) : on ne touche jamais à la base
- **Calculée à la volée** avec la même formule officielle
- Permet de prioriser les corrections par impact (« corriger ces 3 critiques fait passer de 62% à 78% »)

Implémentation : `src/app/(dashboard)/audits/[uuid]/simulator/page.tsx` + composant `RemediationSimulator`.

---

## 5. Ce qui est délibérément abandonné du legacy

| Élément legacy | Raison de l'abandon |
|---|---|
| Architecture DDD/CQRS stricte (Application/Domain/Infrastructure) | Surcouche inutile pour la taille du projet, ralentit les itérations |
| API Platform avec ses Providers/Processors | Les Server Actions Next.js + Supabase suffisent largement |
| Système de feature flags sur entités | À reconstruire si besoin via des flags Vercel ou un simple booléen DB |
| `builder-pattern` en TypeScript (frontend Angular) | Pas idiomatique React, on utilise des objets simples |
| NgRx Signals stores | React Server Components + Server Actions = pas besoin de store global |
| Système de `Stub*Builder` partout | Tests via fixtures Supabase + Vitest |
| Workflow Symfony avec transitions complexes | Une simple machine à états dans `lib/audit-workflow.ts` |
| `Schedule.php` et `Scheduler/` (cron jobs PHP) | Vercel Cron + Supabase Edge Functions si besoin |
| ClamAV pour scanner les uploads | Supabase Storage + validation côté client suffisent en V1 |
| HubSpot URL field | Supprimé de la V1 — ajoutable plus tard via integrations |

---

## 6. Ce qui est conservé tel quel

- **La formule de calcul du score** (vérifiée, conforme RGAA)
- **L'organisation hiérarchique** Client → Project → Audit → Pages + Anomalies
- **Les énumérations métier** (statuts, sévérités, types) avec renommage cohérent
- **Le concept "Éléments transverses"** pour les NC non liées à une page
- **Le simulateur de remédiation** (refait en React mais même logique)
- **Les pages obligatoires** : Accueil, Contact, Mentions Légales, Plan du site, Page d'Accessibilité
- **Le multi-référentiel** (RGAA, WCAG, RAWeb, RAAM)

---

## 7. Améliorations apportées

1. **Sécurité by design** : Row Level Security activé sur toutes les tables — impossible de voir un audit qui ne nous est pas assigné, même avec une requête SQL forgée
2. **Multi-tenant strict** : la table `clients` isole tout, et chaque utilisateur appartient à un seul tenant (sauf les `auditor` internes)
3. **Mode sombre/clair natif** : `next-themes` + tokens CSS, transitions douces sans flash
4. **Accessibilité de l'outil lui-même** :
   - Tous les composants sur Radix UI (gestion native du clavier, ARIA, focus trap)
   - Contrastes vérifiés (palette OK pour AA et AAA)
   - Skip links, landmarks, focus visible
   - Fait pour passer un audit RGAA AA sur lui-même
5. **TypeScript strict** : zéro `any`, types générés depuis le schéma Supabase
6. **Server Components par défaut** : pages plus rapides, moins de JS envoyé au client
