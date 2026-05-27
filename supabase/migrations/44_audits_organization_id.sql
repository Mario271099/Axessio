-- ============================================================================
-- Migration 44 : organization_id sur audits + projects
-- ----------------------------------------------------------------------------
-- Préparation à la bascule RLS multi-tenant (phase 2). On ajoute la colonne
-- `organization_id` sur les tables métier majeures et on la backfill depuis
-- `projects.client_id` (== organizations.id grâce à la migration 43).
--
-- À ce stade, AUCUNE policy RLS n'est encore modifiée — les RLS existantes
-- (basées sur `accessible_project_ids()` legacy) continuent à fonctionner.
-- La bascule complète sera la phase 2.
--
-- Idempotente.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. projects.organization_id (= clients.id)
-- ----------------------------------------------------------------------------
alter table public.projects
  add column if not exists organization_id uuid
  references public.organizations(id) on delete cascade;

update public.projects p
   set organization_id = p.client_id
 where p.organization_id is null
   and p.client_id is not null
   and exists (select 1 from public.organizations o where o.id = p.client_id);

create index if not exists idx_projects_organization
  on public.projects(organization_id);

-- ----------------------------------------------------------------------------
-- 2. audits.organization_id (dénormalisé depuis projects)
-- ----------------------------------------------------------------------------
alter table public.audits
  add column if not exists organization_id uuid
  references public.organizations(id) on delete cascade;

update public.audits a
   set organization_id = p.organization_id
  from public.projects p
 where p.id = a.project_id
   and a.organization_id is null
   and p.organization_id is not null;

create index if not exists idx_audits_organization
  on public.audits(organization_id);

-- ----------------------------------------------------------------------------
-- 3. Trigger : maintenir audits.organization_id en cohérence avec projects
-- ----------------------------------------------------------------------------
-- À chaque INSERT/UPDATE de project_id, on synchronise.
create or replace function public.sync_audit_organization_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.project_id is not null
     and (tg_op = 'INSERT' or new.project_id is distinct from old.project_id)
  then
    select p.organization_id into new.organization_id
      from public.projects p
     where p.id = new.project_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_audit_org on public.audits;
create trigger trg_sync_audit_org
  before insert or update of project_id on public.audits
  for each row execute function public.sync_audit_organization_id();

-- ----------------------------------------------------------------------------
-- 4. NOT NULL (après backfill complet)
-- ----------------------------------------------------------------------------
-- Pour ne pas casser les éventuelles lignes orphelines, on vérifie d'abord
-- qu'il n'y a aucun null restant — sinon on lève une erreur explicite.
do $$
declare
  v_null_projects int;
  v_null_audits   int;
begin
  select count(*) into v_null_projects
    from public.projects where organization_id is null;
  select count(*) into v_null_audits
    from public.audits where organization_id is null;

  if v_null_projects > 0 then
    raise notice 'Phase 1 : % projets sans organization_id — bascule NOT NULL différée', v_null_projects;
  else
    alter table public.projects alter column organization_id set not null;
  end if;

  if v_null_audits > 0 then
    raise notice 'Phase 1 : % audits sans organization_id — bascule NOT NULL différée', v_null_audits;
  else
    alter table public.audits alter column organization_id set not null;
  end if;
end $$;

notify pgrst, 'reload schema';

commit;
