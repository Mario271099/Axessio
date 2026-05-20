-- ============================================================================
-- Migration 29 : corrige la récursion RLS sur `audit_assignees`
-- ----------------------------------------------------------------------------
-- Bug introduit par la migration 25 : `accessible_project_ids()` interroge
-- maintenant `audit_assignees` pour filtrer les auditeurs à leurs audits
-- assignés. Or la policy `assignees_select` sur cette table dit "audit_id
-- visible via accessible_project_ids()", ce qui rappelle la fonction → boucle
-- infinie ("infinite recursion detected in policy for relation
-- audit_assignees").
--
-- Fix : faire de `accessible_project_ids()` (et `is_assigned_to_audit()`) des
-- fonctions `SECURITY DEFINER`. Elles s'exécutent alors avec les droits du
-- propriétaire et bypassent RLS sur les tables qu'elles interrogent — c'est
-- le pattern documenté dans CLAUDE.md (« Toujours SECURITY DEFINER sur les
-- helpers, sinon récursion infinie »).
--
-- `is_admin()`, `is_auditor()`, `current_role()`, `current_client_id()` ne
-- sont PAS impactées : elles ne lisent que `public.profiles` et la policy
-- `profiles_select_self` (id = auth.uid()) suffit sans déclencher de
-- récursion. On les laisse inchangées.
--
-- Idempotente.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- accessible_project_ids() — bascule en SECURITY DEFINER
-- ----------------------------------------------------------------------------
-- Le corps reste identique à la migration 25, on n'ajoute QUE security
-- definer + set search_path = public (anti-hijack par schéma temporaire,
-- bonne pratique sur tous les SECURITY DEFINER).
create or replace function public.accessible_project_ids()
returns table(project_id uuid)
language sql
stable
security definer
set search_path = public
as $$
  select p.id
  from public.projects p
  where
    public.is_admin()
    or (public.current_role() = 'auditor' and exists (
        select 1 from public.audits a
          join public.audit_assignees aa on aa.audit_id = a.id
         where a.project_id = p.id
           and aa.profile_id = auth.uid()
    ))
    or (public.current_role() = 'client_admin' and p.client_id = public.current_client_id())
    or (public.current_role() = 'client' and exists (
        select 1 from public.project_members pm
        where pm.project_id = p.id and pm.profile_id = auth.uid()
    ))
$$;

-- ----------------------------------------------------------------------------
-- is_assigned_to_audit(audit_id) — même fix
-- ----------------------------------------------------------------------------
-- Interroge audits + audit_assignees + projects + project_members → toutes
-- protégées par RLS qui peuvent rappeler cette fonction. SECURITY DEFINER
-- coupe la boucle.
create or replace function public.is_assigned_to_audit(p_audit_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or exists (
      select 1 from public.audits a
        left join public.audit_assignees aa
               on aa.audit_id = a.id and aa.profile_id = auth.uid()
       where a.id = p_audit_id
         and (
              (public.current_role() = 'auditor' and aa.profile_id is not null)
              or (public.current_role() = 'client_admin'
                  and a.project_id in (
                    select id from public.projects
                    where client_id = public.current_client_id()
                  ))
              or (public.current_role() = 'client' and a.project_id in (
                    select pm.project_id from public.project_members pm
                    where pm.profile_id = auth.uid()
                  ))
         )
    );
$$;

notify pgrst, 'reload schema';

commit;
