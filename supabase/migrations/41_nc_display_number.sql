-- ============================================================================
-- Migration 41 : numéro séquentiel des NC par audit
-- ----------------------------------------------------------------------------
-- Ajoute `display_number` (int) sur `non_conformities`, auto-attribué par
-- audit dans l'ordre de création. Permet d'afficher "NC #001", "NC #002"…
-- et de naviguer NC précédente / suivante sur la fiche détail.
--
-- Implémentation :
--   - colonne nullable, backfillée par `row_number() over (audit_id ORDER BY
--     created_at)` ;
--   - trigger BEFORE INSERT qui attribue `max + 1` au sein de l'audit, avec
--     un `pg_advisory_xact_lock` sur l'audit_id pour sérialiser les inserts
--     concurrents (pas de doublon, pas de saut) ;
--   - index unique partiel `(audit_id, display_number) WHERE display_number
--     IS NOT NULL` — sert aussi à l'ordre prev/next.
--
-- Idempotente.
-- ============================================================================

begin;

-- 1) Colonne
alter table public.non_conformities
  add column if not exists display_number integer;

-- 2) Backfill chronologique
with numbered as (
  select id,
         row_number() over (
           partition by audit_id
           order by created_at, id
         )::int as rn
    from public.non_conformities
)
update public.non_conformities nc
   set display_number = numbered.rn
  from numbered
 where nc.id = numbered.id
   and nc.display_number is null;

-- 3) Index unique partiel (avant le trigger pour bloquer les doublons)
create unique index if not exists idx_nc_display_number_unique
  on public.non_conformities(audit_id, display_number)
  where display_number is not null;

create index if not exists idx_nc_audit_display_number
  on public.non_conformities(audit_id, display_number);

-- 4) Trigger BEFORE INSERT pour attribuer le numéro à la création
create or replace function public.assign_nc_display_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_audit_lock bigint;
begin
  if new.display_number is null then
    -- Sérialise les inserts concurrents sur le même audit pour garantir une
    -- séquence sans trou et sans doublon. `hashtextextended` est compatible
    -- avec un uuid::text qu'on transforme en bigint stable.
    v_audit_lock := hashtextextended(new.audit_id::text, 0);
    perform pg_advisory_xact_lock(v_audit_lock);

    select coalesce(max(display_number), 0) + 1
      into new.display_number
      from public.non_conformities
     where audit_id = new.audit_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_assign_nc_display_number on public.non_conformities;
create trigger trg_assign_nc_display_number
  before insert on public.non_conformities
  for each row execute function public.assign_nc_display_number();

notify pgrst, 'reload schema';

commit;
