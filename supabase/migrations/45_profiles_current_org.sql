-- ============================================================================
-- Migration 45 : org active persistée côté DB (profiles.current_org_id)
-- ----------------------------------------------------------------------------
-- Le cookie HTTP-only de la Phase 1 marche pour la UI mais pas pour RLS :
-- Supabase Auth ne propage pas notre cookie dans le JWT, donc `current_org()`
-- ne peut pas y accéder. Solution : stocker l'org active dans `profiles` —
-- accessible par tous les helpers SQL sans hack header PostgREST.
--
-- Effets :
--   1. Nouvelle colonne `profiles.current_org_id` (FK → organizations).
--   2. Backfill : org active = première membership chronologique.
--   3. Réécriture de `current_org()` pour lire depuis profiles (et non plus
--      depuis le claim JWT, qu'on ne maîtrise pas avec Supabase Auth).
--   4. Trigger d'auto-init : à chaque nouvelle membership, si l'utilisateur
--      n'a pas encore d'org active, on lui attribue celle-ci.
--
-- Idempotente.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. Colonne profiles.current_org_id
-- ----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists current_org_id uuid
    references public.organizations(id) on delete set null;

create index if not exists idx_profiles_current_org
  on public.profiles(current_org_id);

-- ----------------------------------------------------------------------------
-- 2. Backfill : prendre la première membership de chaque profil
-- ----------------------------------------------------------------------------
with first_org as (
  select user_id,
         (array_agg(organization_id order by joined_at, organization_id))[1]
           as first_org_id
    from public.organization_members
   group by user_id
)
update public.profiles p
   set current_org_id = fo.first_org_id
  from first_org fo
 where p.id = fo.user_id
   and p.current_org_id is null
   and fo.first_org_id is not null;

-- ----------------------------------------------------------------------------
-- 3. Réécrire current_org() pour lire depuis profiles
-- ----------------------------------------------------------------------------
-- SECURITY DEFINER : la fonction lit `profiles` (qui a RLS). Sans definer,
-- on aurait une boucle car les policies de profiles utilisent indirectement
-- current_org(). Definer + search_path = anti-récursion + anti-injection.
create or replace function public.current_org()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select current_org_id from public.profiles where id = auth.uid();
$$;

-- ----------------------------------------------------------------------------
-- 4. Trigger auto-init : première membership → set current_org_id
-- ----------------------------------------------------------------------------
-- Quand un user reçoit sa toute première membership (ex. nouvel inscrit
-- ajouté à une org), on lui assigne automatiquement cette org comme active.
-- Évite que `current_org()` retourne NULL après la première connexion.
create or replace function public.autofill_profile_current_org()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
     set current_org_id = new.organization_id
   where id = new.user_id
     and current_org_id is null;
  return new;
end;
$$;

drop trigger if exists trg_autofill_profile_current_org
  on public.organization_members;
create trigger trg_autofill_profile_current_org
  after insert on public.organization_members
  for each row execute function public.autofill_profile_current_org();

notify pgrst, 'reload schema';

commit;
