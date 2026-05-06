-- ============================================================================
-- Migration 17 : complétion du schéma clients
-- ----------------------------------------------------------------------------
-- Ajoute is_active pour gérer la désactivation d'un client (cf. actions
-- toggleClientActive et badges Actif/Désactivé dans /clients et /clients/:id).
--
-- Idempotente — peut être ré-exécutée sans danger.
-- ============================================================================

begin;

alter table public.clients
  add column if not exists is_active boolean not null default true;

create index if not exists idx_clients_is_active
  on public.clients(is_active);

-- Force PostgREST à recharger son cache de schéma pour exposer la nouvelle colonne.
notify pgrst, 'reload schema';

commit;
