-- ============================================================================
-- Axessio · Hardening RLS · public.non_conformities
-- ----------------------------------------------------------------------------
-- Le statut d'une non-conformité (NEW / TO_FIX / FIXED / FALSE_POSITIVE)
-- doit redevenir une prérogative exclusive de l'auditeur. La policy
-- `nc_update_status_client` introduite dans 01_rls_policies.sql autorisait
-- les client_admin / client_member à muter ce statut depuis leur audit, ce
-- qui leur permettait de "fermer" une NC sans validation auditeur.
--
-- Cette migration supprime toute policy UPDATE permissive sur
-- non_conformities. À l'issue, la seule policy applicable en UPDATE est
-- `nc_admin` (FOR ALL) qui exige `public.is_auditor() = true`.
--
-- Idempotent · à exécuter en transaction unique.
-- ============================================================================

begin;

-- 1) Suppression de la policy client UPDATE -----------------------------------
drop policy if exists nc_update_status_client on public.non_conformities;

-- Garde-fous : noms alternatifs susceptibles d'avoir été utilisés en
-- environnement local / staging avant uniformisation.
drop policy if exists nc_update_client      on public.non_conformities;
drop policy if exists nc_update_status      on public.non_conformities;
drop policy if exists nc_update_remediation on public.non_conformities;
drop policy if exists nc_client_update      on public.non_conformities;

-- 2) Vérification ------------------------------------------------------------
-- - la policy client UPDATE n'existe plus
-- - aucune policy UPDATE/ALL restante n'autorise un non-auditeur
-- ============================================================================
do $$
declare
  has_client_policy boolean;
  permissive_count  integer;
  update_count      integer;
begin
  select exists(
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'non_conformities'
      and policyname = 'nc_update_status_client'
  ) into has_client_policy;

  if has_client_policy then
    raise exception 'non_conformities : la policy nc_update_status_client est encore présente';
  end if;

  -- Toute policy UPDATE/ALL restante doit invoquer is_auditor() dans son USING
  select count(*) into permissive_count
  from pg_policies
  where schemaname = 'public'
    and tablename  = 'non_conformities'
    and cmd in ('UPDATE', 'ALL')
    and (qual is null or qual not like '%is_auditor%');

  if permissive_count > 0 then
    raise exception 'non_conformities : % policy UPDATE/ALL ne contrôle pas is_auditor()', permissive_count;
  end if;

  select count(*) into update_count
  from pg_policies
  where schemaname = 'public'
    and tablename  = 'non_conformities'
    and cmd in ('UPDATE', 'ALL');

  raise notice 'non_conformities : % policy UPDATE/ALL restante(s) (auditor only)', update_count;
end $$;

commit;
