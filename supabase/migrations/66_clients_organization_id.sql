-- ============================================================================
-- Axessio · Phase 1 — Clients découplés des organisations
-- ----------------------------------------------------------------------------
-- On casse la convention legacy `clients.id == organizations.id` (mig. 43).
-- Désormais une organisation peut héberger N clients dans son carnet
-- d'adresses. Pour l'historique, on backfill `organization_id = id`, ce qui
-- préserve l'intégralité des accès existants.
--
-- Changements :
--   1. Colonne `clients.organization_id` NOT NULL avec FK et index
--   2. Trigger SECURITY DEFINER pour combler l'org_id à l'INSERT (current_org)
--   3. Unique `(organization_id, name)` au lieu de `name` global (deux orgs
--      peuvent avoir un client homonyme)
--   4. Réécriture des policies RLS clients pour scoper par org membership
--      (la lecture est ouverte à tous les membres ; l'écriture exige la
--      permission atomique `client.manage` sur l'org cible)
--
-- Idempotente. Pas de drop destructif.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1) Colonne organization_id + backfill
-- ----------------------------------------------------------------------------
alter table public.clients
  add column if not exists organization_id uuid
  references public.organizations(id) on delete cascade;

-- Backfill : pour les lignes existantes, organization_id = id (convention
-- historique post-mig. 43 où clients.id == organizations.id).
update public.clients
   set organization_id = id
 where organization_id is null
   and exists (select 1 from public.organizations o where o.id = clients.id);

-- Garde-fou : on ne passe NOT NULL que si aucune ligne orpheline ne reste.
do $$
declare
  v_orphans int;
begin
  select count(*) into v_orphans
    from public.clients where organization_id is null;
  if v_orphans > 0 then
    raise notice 'Phase 1 : % clients sans organization_id — NOT NULL différé. À corriger manuellement.', v_orphans;
  else
    alter table public.clients alter column organization_id set not null;
  end if;
end $$;

create index if not exists idx_clients_organization
  on public.clients(organization_id);

-- ----------------------------------------------------------------------------
-- 2) Trigger d'auto-remplissage à l'INSERT
-- ----------------------------------------------------------------------------
-- Si l'application n'a pas explicité organization_id, on retombe sur
-- current_org() — qui lit `profiles.current_org_id`. SECURITY DEFINER pour
-- pouvoir lire current_org() qui dépend du contexte JWT.
create or replace function public.clients_set_organization_id()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.organization_id is null then
    new.organization_id := public.current_org();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_clients_set_org on public.clients;
create trigger trg_clients_set_org
  before insert on public.clients
  for each row execute function public.clients_set_organization_id();

-- ----------------------------------------------------------------------------
-- 3) Unique scopé par org
-- ----------------------------------------------------------------------------
-- Avant : `name` unique global → empêche un consultance et un freelance
--   d'avoir un client "Ministère de la Culture" chacun de leur côté.
-- Après : unique par org → deux orgs peuvent partager un nom.
do $$
begin
  -- Le nom de la contrainte d'origine dépend du dump initial. On essaie
  -- les deux candidates connues.
  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.clients'::regclass
      and conname = 'clients_name_key'
  ) then
    alter table public.clients drop constraint clients_name_key;
  end if;
  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.clients'::regclass
      and conname = 'clients_name_unique'
  ) then
    alter table public.clients drop constraint clients_name_unique;
  end if;
end $$;

create unique index if not exists idx_clients_org_name_unique
  on public.clients(organization_id, name);

-- ----------------------------------------------------------------------------
-- 4) RLS — bascule sur l'appartenance à l'org
-- ----------------------------------------------------------------------------
-- Lecture : tout membre de l'org du client le voit (carnet d'adresses).
-- Écriture : nécessite la perm atomique `client.manage` sur l'org cible.
-- Les contacts client (Porte 2, futur Phase 5) ne sont jamais membres
-- d'org → ils n'ont pas accès au carnet, seulement à leurs audits assignés.
drop policy if exists clients_select_own on public.clients;
drop policy if exists clients_admin_all on public.clients;
drop policy if exists clients_select on public.clients;
drop policy if exists clients_insert on public.clients;
drop policy if exists clients_update on public.clients;
drop policy if exists clients_delete on public.clients;

create policy clients_select on public.clients
  for select to authenticated
  using (
    public.is_admin()
    or public.is_member_of(organization_id)
  );

create policy clients_insert on public.clients
  for insert to authenticated
  with check (
    public.is_admin()
    or public.has_org_permission_on('client.manage', organization_id)
  );

create policy clients_update on public.clients
  for update to authenticated
  using (
    public.is_admin()
    or public.has_org_permission_on('client.manage', organization_id)
  )
  with check (
    public.is_admin()
    or public.has_org_permission_on('client.manage', organization_id)
  );

create policy clients_delete on public.clients
  for delete to authenticated
  using (
    public.is_admin()
    or public.has_org_permission_on('client.manage', organization_id)
  );

notify pgrst, 'reload schema';

commit;
