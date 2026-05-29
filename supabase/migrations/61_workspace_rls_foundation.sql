-- ============================================================================
-- Migration 61 : fondation RLS workspace (Phase 6 — bascule)
-- ----------------------------------------------------------------------------
-- Branche le cloisonnement par workspace sur les audits/projects, SANS faire
-- perdre l'accès à personne.
--
-- Contexte : aujourd'hui un audit est visible si son projet appartient à
-- `current_org()` (cf. accessible_project_ids(), migration 46). Tout user
-- ayant accès est donc membre de l'org (organization_members). Tous les
-- projets/audits existants sont dans le workspace `default` de leur org
-- (migration 55). Mais `workspace_members` est vide et `has_workspace_access`
-- n'accorde l'accès qu'aux owner/admin d'org ou aux membres explicites.
--
-- => Pour ne verrouiller personne, on backfille chaque membre d'org dans le
--    workspace `default` de son org, on ajoute un trigger d'auto-join, PUIS on
--    ajoute le filtre workspace aux policies SELECT (null-safe). Comme tout le
--    monde est dans `default` et que toutes les données y sont, l'effet est nul
--    sur l'existant : le cloisonnement ne s'activera que pour de futurs
--    workspaces non-default.
--
-- Idempotente.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. Backfill : chaque membre d'org rejoint le workspace `default` de son org
--    (même rôle). on conflict → idempotent.
-- ----------------------------------------------------------------------------
insert into public.workspace_members (workspace_id, user_id, role)
select w.id, m.user_id, m.role
  from public.organization_members m
  join public.workspaces w
    on w.organization_id = m.organization_id
   and w.is_default = true
on conflict (workspace_id, user_id) do nothing;

-- ----------------------------------------------------------------------------
-- 2. Trigger : tout nouveau membre d'org est ajouté au workspace `default`.
--    Garantit qu'on ne crée jamais de membre d'org "orphelin" de workspace
--    (qui serait invisible des audits après la bascule RLS).
-- ----------------------------------------------------------------------------
create or replace function public.autojoin_default_workspace()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role)
  select w.id, new.user_id, new.role
    from public.workspaces w
   where w.organization_id = new.organization_id
     and w.is_default = true
  on conflict (workspace_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_autojoin_default_workspace on public.organization_members;
create trigger trg_autojoin_default_workspace
  after insert on public.organization_members
  for each row execute function public.autojoin_default_workspace();

-- ----------------------------------------------------------------------------
-- 3. Policies SELECT : on AJOUTE le filtre workspace (null-safe).
--    `workspace_id is null` → on reste sur le scope org seul (défense : si un
--    backfill de la migration 55 a laissé une ligne sans workspace, elle ne
--    devient pas invisible). Les tables filles (pages, non_conformities,
--    page_conformities, nc_attachments) héritent du filtre via leurs
--    sous-requêtes `select id from audits ...` (la RLS d'audits s'applique).
-- ----------------------------------------------------------------------------

drop policy if exists projects_select on public.projects;
create policy projects_select on public.projects
  for select to authenticated
  using (
    id in (select project_id from public.accessible_project_ids())
    and (workspace_id is null or public.has_workspace_access(workspace_id))
  );

drop policy if exists audits_select on public.audits;
create policy audits_select on public.audits
  for select to authenticated
  using (
    project_id in (select project_id from public.accessible_project_ids())
    and (workspace_id is null or public.has_workspace_access(workspace_id))
  );

notify pgrst, 'reload schema';

commit;
