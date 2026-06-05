-- ============================================================================
-- Migration 78 : Bascule WRITE du domaine audit sur les permissions d'org
--                (Backlog 6C.2 de ROLES_ROADMAP.md — déclenché par le self-serve)
-- ----------------------------------------------------------------------------
-- Contexte. L'inscription self-serve crée un owner d'org (rôle d'org `owner`,
-- rôle legacy `client_admin`). Mais tout le chemin d'écriture du domaine audit
-- (projects, audits, audit_assignees) est encore gated sur le rôle plateforme
-- legacy `is_auditor()` — donc un owner d'org ne peut rien créer.
--
-- La mig. 72 (6C.1) a déjà fermé le piège d'escalade : les clients legacy ont
-- été sortis de `organization_members` (déplacés en contacts audit_assignees).
-- Aucun membre d'org n'a donc de permission qu'il ne devrait pas. On peut
-- maintenant ouvrir les writes sur les permissions d'org SANS risque.
--
-- Principe : changements ADDITIFS. On conserve toujours le branch
-- `is_admin() OR is_auditor()` (staff plateforme) et on AJOUTE un branch
-- `has_org_permission_on('<code>', organization_id)` scopé à l'org de la
-- ressource. Aucune fuite cross-tenant : un membre n'a la permission que dans
-- SON org.
--
-- Idempotente.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 0. Fix bug latent : org_id d'un projet dérivé du CLIENT, pas de client_id.
-- ----------------------------------------------------------------------------
-- La mig. 65 posait `new.organization_id := new.client_id`, valable au temps
-- de la convention legacy `clients.id == organizations.id`. Depuis la mig. 66
-- (clients découplés), un client a son propre id ET un organization_id distinct.
-- On dérive donc l'org depuis le client. Rétro-compatible : pour les clients
-- legacy, `clients.organization_id` a été backfillé à `id` (mig. 66).
create or replace function public.sync_project_organization_id()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Cas 1 : organization_id non fourni mais client_id présent → on déduit
  --         depuis le client (sa colonne organization_id).
  if new.organization_id is null and new.client_id is not null then
    select c.organization_id into new.organization_id
      from public.clients c
     where c.id = new.client_id;
  end if;

  -- Cas 2 : client_id change après-coup → resynchronise.
  if tg_op = 'UPDATE'
     and new.client_id is distinct from old.client_id
     and new.client_id is not null
  then
    select c.organization_id into new.organization_id
      from public.clients c
     where c.id = new.client_id;
  end if;

  -- Cas 3 : workspace_id non fourni → workspace `default` de l'org.
  if new.workspace_id is null and new.organization_id is not null then
    select id into new.workspace_id
      from public.workspaces
     where organization_id = new.organization_id
       and is_default = true
     limit 1;
  end if;

  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 1. projects : write ouvert aux gestionnaires de projet de l'org.
-- ----------------------------------------------------------------------------
drop policy if exists projects_admin_all on public.projects;
drop policy if exists projects_write on public.projects;
create policy projects_write on public.projects
  for all to authenticated
  using (
    public.is_admin()
    or public.is_auditor()
    or public.has_org_permission_on('project.manage', organization_id)
  )
  with check (
    public.is_admin()
    or public.is_auditor()
    or public.has_org_permission_on('project.manage', organization_id)
  );

-- ----------------------------------------------------------------------------
-- 2. project_members : géré par les gestionnaires de projet de l'org du projet.
-- ----------------------------------------------------------------------------
drop policy if exists project_members_admin_all on public.project_members;
drop policy if exists project_members_write on public.project_members;
create policy project_members_write on public.project_members
  for all to authenticated
  using (
    public.is_admin()
    or public.is_auditor()
    or exists (
      select 1 from public.projects p
       where p.id = project_members.project_id
         and public.has_org_permission_on('project.manage', p.organization_id)
    )
  )
  with check (
    public.is_admin()
    or public.is_auditor()
    or exists (
      select 1 from public.projects p
       where p.id = project_members.project_id
         and public.has_org_permission_on('project.manage', p.organization_id)
    )
  );

-- ----------------------------------------------------------------------------
-- 3. audits : insert/update via `audit.edit`, delete via `audit.delete`.
--    organization_id est posé par le trigger BEFORE sync_audit_organization_id
--    (mig. 44) avant l'évaluation du with check.
-- ----------------------------------------------------------------------------
drop policy if exists audits_insert_auditor on public.audits;
create policy audits_insert_auditor on public.audits
  for insert to authenticated
  with check (
    public.is_admin()
    or public.is_auditor()
    or public.has_org_permission_on('audit.edit', organization_id)
  );

drop policy if exists audits_update_auditor on public.audits;
create policy audits_update_auditor on public.audits
  for update to authenticated
  using (
    public.is_admin()
    or public.is_auditor()
    or public.has_org_permission_on('audit.edit', organization_id)
  )
  with check (
    public.is_admin()
    or public.is_auditor()
    or public.has_org_permission_on('audit.edit', organization_id)
  );

drop policy if exists audits_delete_auditor on public.audits;
create policy audits_delete_auditor on public.audits
  for delete to authenticated
  using (
    public.is_admin()
    or public.is_auditor()
    or public.has_org_permission_on('audit.delete', organization_id)
  );

-- ----------------------------------------------------------------------------
-- 4. audit_assignees : géré par qui a `audit.assign_auditor` sur l'org de
--    l'audit (en plus du branch is_auditor + accessible de la mig. 75).
-- ----------------------------------------------------------------------------
drop policy if exists assignees_auditor_manage on public.audit_assignees;
create policy assignees_auditor_manage on public.audit_assignees
  for all to authenticated
  using (
    public.is_admin()
    or (
      public.is_auditor()
      and audit_id in (
        select id from public.audits
         where project_id in (select project_id from public.accessible_project_ids())
      )
    )
    or exists (
      select 1 from public.audits a
       where a.id = audit_assignees.audit_id
         and public.has_org_permission_on('audit.assign_auditor', a.organization_id)
    )
  )
  with check (
    public.is_admin()
    or (
      public.is_auditor()
      and audit_id in (
        select id from public.audits
         where project_id in (select project_id from public.accessible_project_ids())
      )
    )
    or exists (
      select 1 from public.audits a
       where a.id = audit_assignees.audit_id
         and public.has_org_permission_on('audit.assign_auditor', a.organization_id)
    )
  );

notify pgrst, 'reload schema';

commit;
