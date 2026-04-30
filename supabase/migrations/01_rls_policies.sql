-- ============================================================================
-- Axessio · Row Level Security
-- ----------------------------------------------------------------------------
-- Règles d'accès :
--
--   auditor       : voit tout, peut tout faire
--   client_admin  : voit tous les audits/projets/membres de SON client
--   client_member : voit uniquement les projets auxquels il est rattaché
--                   ET les audits dans ces projets
-- ============================================================================

-- Helpers ---------------------------------------------------------------------

-- role de l'utilisateur courant (depuis le JWT de Supabase Auth)
create or replace function public.current_role()
returns user_role
language sql stable
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- client_id de l'utilisateur courant (null pour les auditeurs internes)
create or replace function public.current_client_id()
returns uuid
language sql stable
as $$
  select client_id from public.profiles where id = auth.uid()
$$;

-- l'utilisateur courant est-il auditeur interne ?
create or replace function public.is_auditor()
returns boolean
language sql stable
as $$
  select coalesce((select role from public.profiles where id = auth.uid()) = 'auditor', false)
$$;

-- liste des project_ids auxquels l'utilisateur courant a accès
-- (pour les client_member : projets dans project_members ;
--  pour les client_admin  : tous les projets de leur client ;
--  pour les auditor       : tous les projets)
create or replace function public.accessible_project_ids()
returns table(project_id uuid)
language sql stable
as $$
  select p.id
  from public.projects p
  where
    public.is_auditor()                                                                    -- auditeur : tout
    or (public.current_role() = 'client_admin' and p.client_id = public.current_client_id()) -- client_admin : tout son client
    or (public.current_role() = 'client_member' and exists (                                -- client_member : ses projets
        select 1 from public.project_members pm
        where pm.project_id = p.id and pm.profile_id = auth.uid()
    ))
$$;

-- ============================================================================
-- Activation RLS sur toutes les tables sensibles
-- ============================================================================
alter table public.clients              enable row level security;
alter table public.profiles             enable row level security;
alter table public.projects             enable row level security;
alter table public.project_members      enable row level security;
alter table public.audits               enable row level security;
alter table public.audit_assignees      enable row level security;
alter table public.pages                enable row level security;
alter table public.page_conformities    enable row level security;
alter table public.non_conformities     enable row level security;
alter table public.nc_attachments       enable row level security;

-- Tables référentielles : lecture publique authentifiée, écriture auditeur seul
alter table public.references           enable row level security;
alter table public.thematics            enable row level security;
alter table public.criteria             enable row level security;
alter table public.tests                enable row level security;

-- ============================================================================
-- Policies : profiles
-- ----------------------------------------------------------------------------
-- - Tout user authentifié voit son propre profil
-- - Les auditeurs voient tout le monde
-- - Les client_admin voient les profils de leur client
-- ============================================================================
create policy profiles_select_self on public.profiles
  for select to authenticated
  using (id = auth.uid());

create policy profiles_select_auditor on public.profiles
  for select to authenticated
  using (public.is_auditor());

create policy profiles_select_same_client on public.profiles
  for select to authenticated
  using (
    public.current_role() = 'client_admin'
    and client_id = public.current_client_id()
  );

create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

create policy profiles_admin_all on public.profiles
  for all to authenticated
  using (public.is_auditor())
  with check (public.is_auditor());

-- ============================================================================
-- Policies : clients
-- ============================================================================
create policy clients_select_own on public.clients
  for select to authenticated
  using (
    public.is_auditor()
    or id = public.current_client_id()
  );

create policy clients_admin_all on public.clients
  for all to authenticated
  using (public.is_auditor())
  with check (public.is_auditor());

-- ============================================================================
-- Policies : projects
-- ============================================================================
create policy projects_select on public.projects
  for select to authenticated
  using (id in (select project_id from public.accessible_project_ids()));

create policy projects_admin_all on public.projects
  for all to authenticated
  using (public.is_auditor())
  with check (public.is_auditor());

-- ============================================================================
-- Policies : project_members
-- ============================================================================
create policy project_members_select on public.project_members
  for select to authenticated
  using (project_id in (select project_id from public.accessible_project_ids()));

create policy project_members_admin_all on public.project_members
  for all to authenticated
  using (public.is_auditor())
  with check (public.is_auditor());

-- ============================================================================
-- Policies : audits
-- ============================================================================
create policy audits_select on public.audits
  for select to authenticated
  using (project_id in (select project_id from public.accessible_project_ids()));

create policy audits_insert_auditor on public.audits
  for insert to authenticated
  with check (public.is_auditor());

create policy audits_update_auditor on public.audits
  for update to authenticated
  using (public.is_auditor())
  with check (public.is_auditor());

create policy audits_delete_auditor on public.audits
  for delete to authenticated
  using (public.is_auditor());

-- ============================================================================
-- Policies : audit_assignees, pages, conformities, NC, attachments
-- (toutes héritent de la visibilité de l'audit parent)
-- ============================================================================
create policy assignees_select on public.audit_assignees
  for select to authenticated
  using (audit_id in (
    select id from public.audits where project_id in (select project_id from public.accessible_project_ids())
  ));

create policy assignees_admin on public.audit_assignees
  for all to authenticated
  using (public.is_auditor())
  with check (public.is_auditor());

create policy pages_select on public.pages
  for select to authenticated
  using (audit_id in (
    select id from public.audits where project_id in (select project_id from public.accessible_project_ids())
  ));

create policy pages_admin on public.pages
  for all to authenticated
  using (public.is_auditor())
  with check (public.is_auditor());

create policy pc_select on public.page_conformities
  for select to authenticated
  using (audit_id in (
    select id from public.audits where project_id in (select project_id from public.accessible_project_ids())
  ));

create policy pc_admin on public.page_conformities
  for all to authenticated
  using (public.is_auditor())
  with check (public.is_auditor());

create policy nc_select on public.non_conformities
  for select to authenticated
  using (audit_id in (
    select id from public.audits where project_id in (select project_id from public.accessible_project_ids())
  ));

create policy nc_admin on public.non_conformities
  for all to authenticated
  using (public.is_auditor())
  with check (public.is_auditor());

-- Les client_admin/client_member peuvent UPDATE le statut d'une NC pour la
-- marquer "corrigée" sur leur audit (workflow remédiation)
create policy nc_update_status_client on public.non_conformities
  for update to authenticated
  using (
    audit_id in (select id from public.audits where project_id in (select project_id from public.accessible_project_ids()))
    and not public.is_auditor()
  )
  with check (
    audit_id in (select id from public.audits where project_id in (select project_id from public.accessible_project_ids()))
    and not public.is_auditor()
  );

create policy attach_select on public.nc_attachments
  for select to authenticated
  using (non_conformity_id in (
    select nc.id from public.non_conformities nc
    where nc.audit_id in (
      select id from public.audits where project_id in (select project_id from public.accessible_project_ids())
    )
  ));

create policy attach_admin on public.nc_attachments
  for all to authenticated
  using (public.is_auditor())
  with check (public.is_auditor());

-- ============================================================================
-- Référentiels : lecture pour tous, écriture auditeurs seulement
-- ============================================================================
create policy refs_select on public.references
  for select to authenticated using (true);
create policy refs_admin on public.references
  for all to authenticated using (public.is_auditor()) with check (public.is_auditor());

create policy them_select on public.thematics
  for select to authenticated using (true);
create policy them_admin on public.thematics
  for all to authenticated using (public.is_auditor()) with check (public.is_auditor());

create policy crit_select on public.criteria
  for select to authenticated using (true);
create policy crit_admin on public.criteria
  for all to authenticated using (public.is_auditor()) with check (public.is_auditor());

create policy tests_select on public.tests
  for select to authenticated using (true);
create policy tests_admin on public.tests
  for all to authenticated using (public.is_auditor()) with check (public.is_auditor());
