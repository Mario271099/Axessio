-- ============================================================================
-- Migration 31 : restaure le garde-fou staff sur les policies WRITE
-- ----------------------------------------------------------------------------
-- BUG DE SÉCURITÉ introduit par la migration 25.
--
-- La migration 25 a remplacé les policies WRITE (`audits_update`, `nc_admin`,
-- `pages_admin`, `pc_admin`, `attach_admin`) qui s'appuyaient sur
-- `is_auditor()` par des policies basées uniquement sur
-- `accessible_project_ids()`. Le problème : cette fonction retourne aussi
-- les projets accessibles aux `client_admin` et aux `client`. Résultat :
-- ces deux rôles pouvaient UPDATE / DELETE / INSERT sur les tables audit,
-- pages, page_conformities, non_conformities, nc_attachments — ce qui
-- annulait le hardening introduit par la migration 14.
--
-- Fix : on ajoute un garde-fou `is_auditor()` (qui depuis la migration 23
-- englobe admin + auditor) à toutes ces policies. La logique devient :
--
--   admin + auditor   : accès si project_id ∈ accessible_project_ids()
--                       (=> admin tout, auditor uniquement ses assignés)
--   client_admin      : refusé (is_auditor = false)
--   client            : refusé (is_auditor = false)
--
-- L'UPDATE par les clients (cas légitime : "marquer une NC corrigée") passe
-- déjà par une policy DÉDIÉE (`nc_update_status_client`, drop en 14, plus
-- de cas client → tout est verrouillé pour les clients sur non_conformities
-- UPDATE direct).
--
-- Idempotente.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- audits : UPDATE + DELETE — staff only, scope ‹accessible projets›
-- ----------------------------------------------------------------------------
drop policy if exists audits_update_auditor on public.audits;
create policy audits_update_auditor on public.audits
  for update to authenticated
  using (
    public.is_auditor()
    and project_id in (select project_id from public.accessible_project_ids())
  )
  with check (
    public.is_auditor()
    and project_id in (select project_id from public.accessible_project_ids())
  );

drop policy if exists audits_delete_auditor on public.audits;
create policy audits_delete_auditor on public.audits
  for delete to authenticated
  using (
    public.is_auditor()
    and project_id in (select project_id from public.accessible_project_ids())
  );

-- ----------------------------------------------------------------------------
-- pages, page_conformities, non_conformities, nc_attachments — staff only
-- ----------------------------------------------------------------------------
drop policy if exists pages_admin on public.pages;
create policy pages_admin on public.pages
  for all to authenticated
  using (
    public.is_auditor()
    and audit_id in (
      select id from public.audits
       where project_id in (select project_id from public.accessible_project_ids())
    )
  )
  with check (
    public.is_auditor()
    and audit_id in (
      select id from public.audits
       where project_id in (select project_id from public.accessible_project_ids())
    )
  );

drop policy if exists pc_admin on public.page_conformities;
create policy pc_admin on public.page_conformities
  for all to authenticated
  using (
    public.is_auditor()
    and audit_id in (
      select id from public.audits
       where project_id in (select project_id from public.accessible_project_ids())
    )
  )
  with check (
    public.is_auditor()
    and audit_id in (
      select id from public.audits
       where project_id in (select project_id from public.accessible_project_ids())
    )
  );

drop policy if exists nc_admin on public.non_conformities;
create policy nc_admin on public.non_conformities
  for all to authenticated
  using (
    public.is_auditor()
    and audit_id in (
      select id from public.audits
       where project_id in (select project_id from public.accessible_project_ids())
    )
  )
  with check (
    public.is_auditor()
    and audit_id in (
      select id from public.audits
       where project_id in (select project_id from public.accessible_project_ids())
    )
  );

drop policy if exists attach_admin on public.nc_attachments;
create policy attach_admin on public.nc_attachments
  for all to authenticated
  using (
    public.is_auditor()
    and non_conformity_id in (
      select nc.id from public.non_conformities nc
       where nc.audit_id in (
         select id from public.audits
          where project_id in (select project_id from public.accessible_project_ids())
       )
    )
  )
  with check (
    public.is_auditor()
    and non_conformity_id in (
      select nc.id from public.non_conformities nc
       where nc.audit_id in (
         select id from public.audits
          where project_id in (select project_id from public.accessible_project_ids())
       )
    )
  );

-- ----------------------------------------------------------------------------
-- Re-vérification (héritée de migration 14) : non_conformities est verrouillé
-- ----------------------------------------------------------------------------
do $$
declare
  permissive_count integer;
begin
  select count(*) into permissive_count
  from pg_policies
  where schemaname = 'public'
    and tablename  = 'non_conformities'
    and cmd in ('UPDATE', 'ALL')
    and (qual is null or qual not like '%is_auditor%');
  if permissive_count > 0 then
    raise exception 'non_conformities : % policy UPDATE/ALL ne contrôle pas is_auditor()', permissive_count;
  end if;
end $$;

notify pgrst, 'reload schema';

commit;
