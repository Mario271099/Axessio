-- ============================================================================
-- Migration 46 : bascule RLS — isolation tenant par organization_id
-- ----------------------------------------------------------------------------
-- On change la SÉMANTIQUE des helpers existants pour utiliser
-- `current_org()` au lieu du legacy `client_id`. Les policies elles-mêmes
-- restent en place (pas de migration de policy en cascade), ce qui rend la
-- bascule atomique et réversible :
--
--   - `accessible_project_ids()` retourne les projets de l'org active.
--   - `clients_select_own` filtre par l'org active.
--   - `profiles_select_same_client` filtre par membership commune.
--
-- L'admin (`is_admin()`) court-circuit toujours toutes les restrictions.
-- Tous les WRITE-policies (`is_auditor()` etc.) restent inchangés — phase 3.
--
-- Idempotente.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. accessible_project_ids() — sémantique org-scoped
-- ----------------------------------------------------------------------------
-- Avant : retournait selon le rôle legacy + client_id.
-- Après : tous les projets de l'org active de l'utilisateur. Le filtrage
-- par rôle (qui peut écrire) est appliqué côté policies (WHERE auditor).
--
-- Note : on garde la signature (returns table) pour zéro breakage côté
-- callers. Seul le contenu logique change.
create or replace function public.accessible_project_ids()
returns table(project_id uuid)
language sql
stable
security definer
set search_path = public
as $$
  select p.id
    from public.projects p
   where public.is_admin()
      or p.organization_id = public.current_org();
$$;

-- ----------------------------------------------------------------------------
-- 2. Policy clients_select_own — bascule sur organization_id
-- ----------------------------------------------------------------------------
-- `clients` est l'ancien tenant. Aujourd'hui : 1 ligne par tenant historique.
-- Demain (phase 3+) : table merger avec `organizations`. En attendant on
-- filtre par "est-ce que ce client = current_org() ?".
drop policy if exists clients_select_own on public.clients;
create policy clients_select_own on public.clients
  for select to authenticated
  using (
    public.is_admin()
    or id = public.current_org()
  );

-- Policy d'écriture admin (clients_admin_all) inchangée :
-- elle exige is_auditor() (admin + auditor plateforme).

-- ----------------------------------------------------------------------------
-- 3. Policy profiles_select_same_client — bascule sur memberships partagées
-- ----------------------------------------------------------------------------
-- Aujourd'hui : un client_admin voit les profils de "son" client_id.
-- Désormais : on voit les profils qui partagent au moins une org membership
-- avec nous. C'est strictement plus correct (un user dans plusieurs orgs
-- est vu par ses collègues de chaque org).
drop policy if exists profiles_select_same_client on public.profiles;
create policy profiles_select_same_client on public.profiles
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
        from public.organization_members me
        join public.organization_members them
          on them.organization_id = me.organization_id
       where me.user_id = auth.uid()
         and them.user_id = profiles.id
    )
  );

-- ----------------------------------------------------------------------------
-- 4. Garde-fou — un user ne peut activer qu'une org dont il est membre
-- ----------------------------------------------------------------------------
-- Trigger BEFORE UPDATE sur profiles : si on change `current_org_id` à
-- une valeur non null, on vérifie le membership. Ça bloque les tentatives
-- de forge (cookie + SQL update direct).
create or replace function public.validate_profile_current_org()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'UPDATE'
      and new.current_org_id is not null
      and new.current_org_id is distinct from old.current_org_id)
  then
    if not exists (
      select 1 from public.organization_members
       where organization_id = new.current_org_id
         and user_id = new.id
    ) then
      raise exception 'User % is not a member of organization %',
        new.id, new.current_org_id
        using errcode = '42501'; -- insufficient_privilege
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_validate_profile_current_org on public.profiles;
create trigger trg_validate_profile_current_org
  before update of current_org_id on public.profiles
  for each row execute function public.validate_profile_current_org();

notify pgrst, 'reload schema';

commit;
