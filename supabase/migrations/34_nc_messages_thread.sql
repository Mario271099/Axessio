-- ============================================================================
-- Migration 34 : fil de discussion `thread` sur nc_messages
-- ----------------------------------------------------------------------------
-- Cloisonne les discussions sur une NC en 2 fils :
--   - 'client'  : échanges auditeur ↔ client_admin (remédiation) — existant
--   - 'review'  : échanges auditeur ↔ relecteur (relecture interne) — nouveau
--
-- Backfill : tous les messages existants sont étiquetés 'client' (comportement
-- pré-existant). Le défaut côté insertion future reste 'client'.
--
-- Idempotente.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. Enum dédié
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'nc_message_thread') then
    create type public.nc_message_thread as enum ('client', 'review');
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 2. Colonne `thread` sur nc_messages
-- ----------------------------------------------------------------------------
alter table public.nc_messages
  add column if not exists thread public.nc_message_thread
    not null default 'client';

-- Index pour filtrer rapidement par fil sur une NC donnée.
create index if not exists idx_nc_messages_nc_thread
  on public.nc_messages(non_conformity_id, thread, created_at desc);

notify pgrst, 'reload schema';

commit;
