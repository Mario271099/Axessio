-- ============================================================================
-- Migration 80 : Bascule WRITE matrice + NC sur les permissions d'org
--                (Backlog 6C.2b `page_conformities` + 6C.3 NC)
-- ----------------------------------------------------------------------------
-- Suite des mig. 78/79. On ouvre l'écriture du CONTENU d'un audit aux membres
-- d'org disposant de la permission atomique adéquate, scopée à l'org de l'audit
-- parent. Branch legacy `is_admin()/is_auditor()` conservé (additif).
--
--   page_conformities (matrice) → `matrix.edit`
--   non_conformities  (NC)      → `nc.edit`   (owner/admin/auditor d'org)
--   nc_attachments              → `nc.edit`
--   nc_messages fil 'client'    → via helper `nc_can_access` (chat.client.read)
--   nc_messages fil 'review'    → via helper `current_user_can_access_nc_review`
--                                 (chat.review.read — les CONTACTS restent
--                                  exclus car non-membres de l'org)
--
-- Rappel sécurité (mig. 72) : les clients legacy ne sont plus dans
-- organization_members → aucun n'obtient ces permissions. Les contacts (Porte 2)
-- ne sont pas membres d'org non plus → le fil review leur reste fermé.
--
-- Idempotente.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1) page_conformities (matrice) — write via `matrix.edit` sur l'org
-- ----------------------------------------------------------------------------
drop policy if exists pc_admin on public.page_conformities;
create policy pc_admin on public.page_conformities
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
       where a.id = page_conformities.audit_id
         and public.has_org_permission_on('matrix.edit', a.organization_id)
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
       where a.id = page_conformities.audit_id
         and public.has_org_permission_on('matrix.edit', a.organization_id)
    )
  );

-- ----------------------------------------------------------------------------
-- 2) non_conformities — write via `nc.edit` sur l'org
-- ----------------------------------------------------------------------------
drop policy if exists nc_admin on public.non_conformities;
create policy nc_admin on public.non_conformities
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
       where a.id = non_conformities.audit_id
         and public.has_org_permission_on('nc.edit', a.organization_id)
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
       where a.id = non_conformities.audit_id
         and public.has_org_permission_on('nc.edit', a.organization_id)
    )
  );

-- ----------------------------------------------------------------------------
-- 3) nc_attachments — write via `nc.edit` sur l'org de la NC parente
-- ----------------------------------------------------------------------------
drop policy if exists attach_admin on public.nc_attachments;
create policy attach_admin on public.nc_attachments
  for all to authenticated
  using (
    public.is_admin()
    or (
      public.is_auditor()
      and non_conformity_id in (
        select nc.id from public.non_conformities nc
         where nc.audit_id in (
           select id from public.audits
            where project_id in (select project_id from public.accessible_project_ids())
         )
      )
    )
    or exists (
      select 1
        from public.non_conformities nc
        join public.audits a on a.id = nc.audit_id
       where nc.id = nc_attachments.non_conformity_id
         and public.has_org_permission_on('nc.edit', a.organization_id)
    )
  )
  with check (
    public.is_admin()
    or (
      public.is_auditor()
      and non_conformity_id in (
        select nc.id from public.non_conformities nc
         where nc.audit_id in (
           select id from public.audits
            where project_id in (select project_id from public.accessible_project_ids())
         )
      )
    )
    or exists (
      select 1
        from public.non_conformities nc
        join public.audits a on a.id = nc.audit_id
       where nc.id = nc_attachments.non_conformity_id
         and public.has_org_permission_on('nc.edit', a.organization_id)
    )
  );

-- ----------------------------------------------------------------------------
-- 4) nc_messages — fil 'client' : étendre `nc_can_access` aux membres d'org
-- ----------------------------------------------------------------------------
create or replace function public.nc_can_access(p_nc_id uuid)
returns boolean
language sql stable
security definer set search_path = public
as $$
  select exists(
    select 1
    from public.non_conformities nc
    join public.audits   a on a.id = nc.audit_id
    join public.projects p on p.id = a.project_id
    where nc.id = p_nc_id
      and (
        public.is_auditor()
        or (
          public.current_role() = 'client_admin'
          and p.client_id = public.current_client_id()
        )
        or public.is_contact_of_audit(nc.audit_id)
        or public.has_org_permission_on('chat.client.read', a.organization_id)
      )
  )
$$;

-- ----------------------------------------------------------------------------
-- 5) nc_messages — fil 'review' : étendre aux membres d'org (jamais contacts).
--    Un contact n'est pas membre de l'org → has_org_permission_on renvoie false
--    pour lui : la confidentialité du fil interne est préservée.
-- ----------------------------------------------------------------------------
create or replace function public.current_user_can_access_nc_review(p_nc_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or exists (
      select 1
      from public.non_conformities nc
      join public.audit_assignees aa on aa.audit_id = nc.audit_id
      where nc.id = p_nc_id
        and aa.profile_id = auth.uid()
        and aa.role in ('auditor', 'proofreader')
    )
    or exists (
      select 1
      from public.non_conformities nc
      join public.audits a on a.id = nc.audit_id
      where nc.id = p_nc_id
        and public.has_org_permission_on('chat.review.read', a.organization_id)
    );
$$;

notify pgrst, 'reload schema';

commit;
