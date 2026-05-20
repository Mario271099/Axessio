-- ============================================================================
-- Migration 35 : élargir l'assignation à client_admin de son client
-- ----------------------------------------------------------------------------
-- La spec §3.1 demande que `client_admin` puisse assigner auditeurs ET
-- relecteurs sur les audits de SON client. Aujourd'hui (migrations 25 + 27 +
-- 30) seul `admin` peut. On élargit via une policy additive — les policies
-- RLS s'ajoutent (OR), pas besoin de drop l'existant.
--
-- En conséquence, on supprime aussi `assignees_proofreader_manage` qui
-- autorisait l'auditeur — la spec retire ce pouvoir à l'auditor.
--
-- Idempotente.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. Helper SECURITY DEFINER : audit appartient au client courant ?
-- ----------------------------------------------------------------------------
-- Renvoie true si l'audit ciblé appartient au client_id du user courant.
-- SECURITY DEFINER pour ne pas dépendre des policies sur audits/projects
-- (et casser toute récursion potentielle).
create or replace function public.audit_belongs_to_current_client(p_audit_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.audits a
    join public.projects p on p.id = a.project_id
    where a.id = p_audit_id
      and p.client_id = public.current_client_id()
  );
$$;

-- ----------------------------------------------------------------------------
-- 2. Policy additive : client_admin peut gérer les assignees de son client
-- ----------------------------------------------------------------------------
drop policy if exists assignees_client_admin_manage on public.audit_assignees;

create policy assignees_client_admin_manage on public.audit_assignees
  for all to authenticated
  using (
    public.current_role() = 'client_admin'
    and public.audit_belongs_to_current_client(audit_id)
  )
  with check (
    public.current_role() = 'client_admin'
    and public.audit_belongs_to_current_client(audit_id)
  );

-- ----------------------------------------------------------------------------
-- 3. Retrait de assignees_proofreader_manage (l'auditeur perd ce pouvoir)
-- ----------------------------------------------------------------------------
-- Migration 30 avait introduit cette policy pour permettre à un auditeur
-- assigné de désigner un relecteur. La spec §3.1 retire cette capacité.
drop policy if exists assignees_proofreader_manage on public.audit_assignees;

-- On peut aussi supprimer le helper devenu inutile.
drop function if exists public.current_user_is_auditor_on(uuid);

notify pgrst, 'reload schema';

commit;
