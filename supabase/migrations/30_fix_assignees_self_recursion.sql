-- ============================================================================
-- Migration 30 : corrige la récursion sur `audit_assignees` (suite)
-- ----------------------------------------------------------------------------
-- La migration 29 a corrigé `accessible_project_ids()` et
-- `is_assigned_to_audit()` en les passant en SECURITY DEFINER, mais l'erreur
-- "infinite recursion detected in policy for relation audit_assignees"
-- persiste à cause d'une AUTRE source de récursion : la policy
-- `assignees_proofreader_manage` (migration 27) interroge la table
-- `audit_assignees` DIRECTEMENT depuis son `using/with check`, ce qui
-- rejoue les policies sur cette même table → boucle.
--
-- Fix : on extrait le test "l'utilisateur courant est-il assigné comme
-- auditeur à cet audit ?" dans un helper SECURITY DEFINER, puis on l'utilise
-- dans la policy. Le helper bypasse RLS sur audit_assignees, plus de boucle.
--
-- Idempotente.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. Helper : current_user_is_auditor_on(audit_id)
-- ----------------------------------------------------------------------------
-- Renvoie true si l'utilisateur courant a une ligne `audit_assignees` de
-- rôle 'auditor' pour cet audit. SECURITY DEFINER pour casser la récursion.
create or replace function public.current_user_is_auditor_on(p_audit_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.audit_assignees aa
     where aa.audit_id = p_audit_id
       and aa.profile_id = auth.uid()
       and aa.role = 'auditor'
  );
$$;

-- ----------------------------------------------------------------------------
-- 2. Réécriture de la policy `assignees_proofreader_manage`
-- ----------------------------------------------------------------------------
-- Plus aucun SELECT sur audit_assignees dans le corps : on passe par le
-- helper SECURITY DEFINER. Logique inchangée fonctionnellement.
drop policy if exists assignees_proofreader_manage on public.audit_assignees;

create policy assignees_proofreader_manage on public.audit_assignees
  for all to authenticated
  using (
    role = 'proofreader'
    and (
      public.is_admin()
      or (
        public.current_role() = 'auditor'
        and public.current_user_is_auditor_on(audit_id)
      )
    )
  )
  with check (
    role = 'proofreader'
    and (
      public.is_admin()
      or (
        public.current_role() = 'auditor'
        and public.current_user_is_auditor_on(audit_id)
      )
    )
  );

notify pgrst, 'reload schema';

commit;
