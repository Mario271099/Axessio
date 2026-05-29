# API Axessio v1

API REST en lecture pour les audits d'accessibilité. Gated par la feature
`api.access` (plan Enterprise).

- **Base URL** : `https://<votre-domaine>/api/v1`
- **Spec OpenAPI** : `GET /api/v1/openapi` (JSON, public, importable dans Postman/Insomnia/Swagger)

## Authentification

Header Bearer sur chaque requête :

```
Authorization: Bearer axe_live_<random>
```

Les tokens se créent depuis **Organisation → API tokens** (le secret n'est
affiché qu'une seule fois à la création). Un token est lié à une organisation
et porte un ensemble de scopes.

Réponses d'erreur d'auth :
- `401` — header manquant/malformé, token invalide, expiré ou révoqué.
- `403` — token valide mais scope insuffisant pour l'opération.

## Scopes

| Scope            | Usage                          |
| ---------------- | ------------------------------ |
| `audits:read`    | Lecture des audits             |
| `audits:write`   | (réservé — écriture future)    |
| `nc:read`        | Lecture des non-conformités    |
| `nc:write`       | (réservé)                      |
| `webhooks:read`  | Lecture de la config webhooks  |

## Quota (rate limit)

**100 requêtes / minute par token** (compteur global, partagé entre toutes
les instances). Chaque réponse porte :

- `RateLimit-Limit` — plafond (100)
- `RateLimit-Remaining` — appels restants dans la fenêtre
- `RateLimit-Reset` — secondes avant réinitialisation

Dépassement → `429 Too Many Requests` + header `Retry-After` (secondes).

## Pagination

Pagination par **curseur** (et non par offset), sur `created_at` décroissant :

1. Premier appel sans `cursor`.
2. La réponse contient `pagination.next_cursor` et `pagination.has_more`.
3. Tant que `has_more` est `true`, rappeler avec `?cursor=<next_cursor>`.

## Endpoints

### `GET /audits`

Liste les audits de l'organisation du token. Scope requis : `audits:read`.

Query params :
- `limit` (optionnel) — 1 à 200, défaut 50.
- `cursor` (optionnel) — `next_cursor` de la page précédente.

Exemple :

```bash
curl -s "https://<domaine>/api/v1/audits?limit=50" \
  -H "Authorization: Bearer axe_live_xxx"
```

Réponse `200` :

```json
{
  "data": [
    {
      "id": "…",
      "project_id": "…",
      "reference_id": "…",
      "service_type": "…",
      "platform": "…",
      "status": "…",
      "language": "fr",
      "expected_start_at": null,
      "expected_end_at": null,
      "delivered_at": null,
      "initial_score": null,
      "final_score": null,
      "created_at": "2026-05-01T10:00:00Z",
      "updated_at": "2026-05-01T10:00:00Z"
    }
  ],
  "pagination": { "limit": 50, "has_more": false, "next_cursor": null }
}
```

## Codes d'erreur

| Code  | Signification                                   |
| ----- | ----------------------------------------------- |
| `401` | Authentification manquante/invalide             |
| `403` | Scope insuffisant                               |
| `429` | Quota dépassé (voir `Retry-After`)              |
| `500` | Erreur serveur                                  |

Format : `{ "error": "<message>" }`.

## Versionnement & dépréciation

- La version est dans le chemin (`/api/v1`).
- En cas de retrait d'une version, un header `Sunset` (RFC 8594) annoncera la
  date de fin de support, avec **au moins 6 mois** de préavis. Aucune
  dépréciation n'est prévue pour `v1` à ce jour.
