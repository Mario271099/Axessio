-- ============================================================================
-- Migration 60 : forcer HTTPS pour les webhooks sortants (anti-SSRF)
-- ----------------------------------------------------------------------------
-- La contrainte précédente (migration 56) acceptait `http://` aussi. Combiné
-- à l'absence de validation IP côté code, n'importe quel admin d'org pouvait
-- pointer un endpoint vers une URL interne (metadata cloud, Redis, etc.).
-- La défense principale est la résolution DNS + blocklist d'IPs privées
-- côté Node (cf. src/lib/webhooks/ssrf.ts). Cette migration rend juste le
-- modèle de données honnête : pas de `http://` en base.
--
-- Idempotente.
-- ============================================================================

begin;

-- 1. Toute ligne existante en http:// devient injectable comme SSRF — on
--    préfère la supprimer plutôt que la conserver dans un état "désactivé"
--    où un admin pourrait la réactiver par erreur. La feature webhooks est
--    récente (Pro+), peu de chance que prod en contienne déjà.
delete from public.webhook_endpoints
 where url !~* '^https://';

-- 2. Remplacer la contrainte par une version stricte.
alter table public.webhook_endpoints
  drop constraint if exists webhook_endpoints_url_https;

alter table public.webhook_endpoints
  add constraint webhook_endpoints_url_https
  check (url ~* '^https://');

notify pgrst, 'reload schema';

commit;
