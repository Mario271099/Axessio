-- ============================================================================
-- Migration 18 : index de performance + miroir email_confirmed_at sur profiles
-- ----------------------------------------------------------------------------
-- 1. Ajoute idx_audits_updated_at_desc pour la liste /audits (ORDER BY desc).
-- 2. Mirror auth.users.email_confirmed_at -> profiles.email_confirmed_at via
--    trigger SECURITY DEFINER. Supprime la nécessité d'appeler
--    auth.admin.listUsers() à chaque chargement de /users (gain x100 sur la
--    page) et évite d'utiliser le service-role côté SSR.
--
-- Idempotente — peut être ré-exécutée sans danger.
-- ============================================================================

begin;

-- 1. Index pour ORDER BY updated_at DESC sur /audits
create index if not exists idx_audits_updated_at_desc
  on public.audits(updated_at desc);

-- 2. Colonne miroir
alter table public.profiles
  add column if not exists email_confirmed_at timestamptz;

create index if not exists idx_profiles_email_confirmed_at
  on public.profiles(email_confirmed_at);

-- 3. Backfill initial depuis auth.users
update public.profiles p
   set email_confirmed_at = u.email_confirmed_at
  from auth.users u
 where p.id = u.id
   and p.email_confirmed_at is distinct from u.email_confirmed_at;

-- 4. Trigger : à chaque INSERT/UPDATE sur auth.users, on synchronise profiles.
create or replace function public.sync_email_confirmed_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
     set email_confirmed_at = new.email_confirmed_at
   where id = new.id
     and email_confirmed_at is distinct from new.email_confirmed_at;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_confirmed on auth.users;
create trigger on_auth_user_email_confirmed
  after insert or update of email_confirmed_at on auth.users
  for each row execute function public.sync_email_confirmed_at();

-- 5. Étendre handle_new_user pour pré-remplir email_confirmed_at à l'insertion.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name, role, client_id, email_confirmed_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'client_member'),
    nullif(new.raw_user_meta_data->>'client_id', '')::uuid,
    new.email_confirmed_at
  );
  return new;
end;
$$;

notify pgrst, 'reload schema';

commit;
