-- ============================================================================
-- Migration 59 : audit_logs.organization_id + backfill + trigger autofill
-- ----------------------------------------------------------------------------
-- L'`audit_logs` existant (migration 23) ne porte qu'un audit_id (qui peut
-- être NULL pour les actions hors-audit). Pour avoir une UI "tous les logs
-- de mon organisation" performante, on ajoute une colonne dédiée +
-- un trigger qui la remplit automatiquement depuis audit_id.
--
-- La RLS existante (basée sur `accessible_project_ids()`) continue à
-- fonctionner — on ajoute une seconde policy qui autorise les admins/owners
-- d'org à voir TOUS les logs de leur org (y compris ceux sans audit_id).
--
-- Idempotente.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. Colonne
-- ----------------------------------------------------------------------------
alter table public.audit_logs
  add column if not exists organization_id uuid
  references public.organizations(id) on delete cascade;

create index if not exists idx_audit_logs_org_created
  on public.audit_logs(organization_id, created_at desc);

-- ----------------------------------------------------------------------------
-- 2. Backfill : remplir depuis l'audit parent
-- ----------------------------------------------------------------------------
update public.audit_logs al
   set organization_id = a.organization_id
  from public.audits a
 where al.organization_id is null
   and al.audit_id is not null
   and a.id = al.audit_id;

-- ----------------------------------------------------------------------------
-- 3. Trigger : autofill à l'insert si organization_id manquant
-- ----------------------------------------------------------------------------
create or replace function public.audit_logs_fill_organization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.organization_id is null and new.audit_id is not null then
    select organization_id into new.organization_id
      from public.audits
     where id = new.audit_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_audit_logs_fill_organization on public.audit_logs;
create trigger trg_audit_logs_fill_organization
  before insert on public.audit_logs
  for each row execute function public.audit_logs_fill_organization();

-- ----------------------------------------------------------------------------
-- 4. RLS : seconde policy "org admin/owner peut tout voir dans son org"
--    en complément de la policy existante basée sur accessible_project_ids.
-- ----------------------------------------------------------------------------
drop policy if exists audit_logs_select_org_admin on public.audit_logs;
create policy audit_logs_select_org_admin on public.audit_logs
  for select to authenticated
  using (
    organization_id is not null
    and public.has_org_role(organization_id, 'admin')
  );

notify pgrst, 'reload schema';

commit;
