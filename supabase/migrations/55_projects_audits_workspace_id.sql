-- ============================================================================
-- Migration 55 : Workspaces (Phase 6 — suite) — colonne workspace_id sur
--                projects et audits + backfill vers le workspace default
-- ----------------------------------------------------------------------------
-- On rattache chaque project (et chaque audit, via trigger de synchro déjà
-- existant) à un workspace. Pour ne pas casser les RLS existantes, la
-- colonne est NULLABLE le temps du backfill — passée NOT NULL à la fin.
--
-- Aucune policy RLS n'est modifiée ici : la bascule "filtrer par workspace"
-- se fera dans une migration ultérieure une fois que l'UI workspace switcher
-- sera en place. Pour l'instant tout reste filtré par organization_id.
--
-- Idempotente.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. Ajout de la colonne (NULLABLE) sur projects
-- ----------------------------------------------------------------------------
alter table public.projects
  add column if not exists workspace_id uuid
  references public.workspaces(id) on delete restrict;

create index if not exists idx_projects_workspace
  on public.projects(workspace_id);

-- ----------------------------------------------------------------------------
-- 2. Ajout de la colonne (NULLABLE) sur audits
-- ----------------------------------------------------------------------------
alter table public.audits
  add column if not exists workspace_id uuid
  references public.workspaces(id) on delete restrict;

create index if not exists idx_audits_workspace
  on public.audits(workspace_id);

-- ----------------------------------------------------------------------------
-- 3. Backfill : chaque project sans workspace pointe vers le default
--    de son organisation
-- ----------------------------------------------------------------------------
update public.projects p
   set workspace_id = w.id
  from public.workspaces w
 where p.workspace_id is null
   and w.organization_id = p.organization_id
   and w.is_default = true;

-- ----------------------------------------------------------------------------
-- 4. Backfill audits : depuis le project parent (qui vient d'être backfillé)
-- ----------------------------------------------------------------------------
update public.audits a
   set workspace_id = p.workspace_id
  from public.projects p
 where a.workspace_id is null
   and a.project_id = p.id;

-- ----------------------------------------------------------------------------
-- 5. Passage NOT NULL une fois le backfill terminé. Si une ligne n'a pas pu
--    être backfillée (incohérence), on n'applique pas la contrainte pour ne
--    pas casser le déploiement — la requête échouera silencieusement et un
--    administrateur pourra corriger manuellement.
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from public.projects where workspace_id is null) then
    alter table public.projects alter column workspace_id set not null;
  end if;
  if not exists (select 1 from public.audits where workspace_id is null) then
    alter table public.audits alter column workspace_id set not null;
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 6. Synchro audits.workspace_id avec audits.project_id (au cas où on
--    changerait le project parent d'un audit — peu probable mais propre).
--    On hooke le trigger existant qui synchronise déjà organization_id.
-- ----------------------------------------------------------------------------
create or replace function public.audits_sync_workspace()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.project_id is not null
     and (new.workspace_id is null or new.project_id is distinct from old.project_id) then
    select workspace_id into new.workspace_id
      from public.projects
     where id = new.project_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_audits_sync_workspace on public.audits;
create trigger trg_audits_sync_workspace
  before insert or update of project_id on public.audits
  for each row execute function public.audits_sync_workspace();

notify pgrst, 'reload schema';

commit;
