-- ============================================================================
-- Migration 79 : Bascule WRITE de `pages` sur les permissions d'org
-- ----------------------------------------------------------------------------
-- Complément de la mig. 78. La création d'un audit insère automatiquement les
-- pages obligatoires (5 MANDATORY + 1 TRANSVERSAL) dans `pages`. Or la policy
-- `pages_admin` (mig. 01) gardait encore l'écriture sur `is_auditor()` legacy :
-- un owner d'org self-serve voyait son INSERT d'audit réussir, puis l'INSERT
-- des pages refusé → rollback → « new row violates row-level security policy
-- for table pages ».
--
-- On ouvre l'écriture des pages à qui détient `audit.edit` sur l'org de l'audit
-- parent, en gardant le branch legacy `is_admin()/is_auditor()` (additif).
--
-- NB : la matrice (`page_conformities`) et les NC restent sur `is_auditor()`
-- (backlog 6C.2b / 6C.3) — bascule séparée.
--
-- Idempotente.
-- ============================================================================

begin;

drop policy if exists pages_admin on public.pages;
create policy pages_admin on public.pages
  for all to authenticated
  using (
    public.is_admin()
    or public.is_auditor()
    or exists (
      select 1 from public.audits a
       where a.id = pages.audit_id
         and public.has_org_permission_on('audit.edit', a.organization_id)
    )
  )
  with check (
    public.is_admin()
    or public.is_auditor()
    or exists (
      select 1 from public.audits a
       where a.id = pages.audit_id
         and public.has_org_permission_on('audit.edit', a.organization_id)
    )
  );

notify pgrst, 'reload schema';

commit;
