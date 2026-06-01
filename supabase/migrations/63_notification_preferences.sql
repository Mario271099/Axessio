-- ============================================================================
-- Axessio · Préférences de notification par utilisateur
-- ----------------------------------------------------------------------------
-- Table simple `(user_id, type, enabled)`. Une ligne n'existe que si
-- l'utilisateur a explicitement coché/décoché — l'absence de ligne signifie
-- « valeur par défaut = activé ». Le helper `is_notif_enabled()` encapsule
-- cette logique pour les triggers de notification.
--
-- Types reconnus (mise à jour à chaque ajout côté code) :
--   - 'nc_message'        : nouveau message dans le fil client d'une NC
--   - 'nc.review_message' : nouveau message dans le fil review d'une NC
--
-- Les triggers `notify_on_nc_message` et `notify_on_nc_review_message`
-- (définis en migration 37) sont réécrits à l'identique avec un filtre
-- supplémentaire sur `is_notif_enabled()`.
--
-- Idempotent.
-- ============================================================================

begin;

-- 1) Table ------------------------------------------------------------------
create table if not exists public.notification_preferences (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  type       text not null,
  enabled    boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, type)
);

-- 2) RLS --------------------------------------------------------------------
alter table public.notification_preferences enable row level security;

drop policy if exists np_select on public.notification_preferences;
drop policy if exists np_insert on public.notification_preferences;
drop policy if exists np_update on public.notification_preferences;
drop policy if exists np_delete on public.notification_preferences;

create policy np_select on public.notification_preferences
  for select using (user_id = auth.uid());

create policy np_insert on public.notification_preferences
  for insert with check (user_id = auth.uid());

create policy np_update on public.notification_preferences
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy np_delete on public.notification_preferences
  for delete using (user_id = auth.uid());

-- 3) Helper SECURITY DEFINER ------------------------------------------------
-- Appelé depuis les triggers de notification. Default = true : absence de
-- ligne signifie « activé ». Permet de stocker uniquement les opt-out.
create or replace function public.is_notif_enabled(
  p_user_id uuid,
  p_type text
)
returns boolean
language sql stable
security definer set search_path = public
as $$
  select coalesce(
    (select enabled from public.notification_preferences
      where user_id = p_user_id and type = p_type),
    true
  );
$$;

-- 4) Réécriture des triggers ------------------------------------------------
-- Recopie fidèle des fonctions de la migration 37, avec un filtre additionnel
-- sur is_notif_enabled() pour respecter les préférences utilisateur.

-- 4.a) Fil client -----------------------------------------------------------
create or replace function public.notify_on_nc_message()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_audit_id   uuid;
  v_client_id  uuid;
  v_nc_creator uuid;
begin
  if new.thread <> 'client' then
    return new;
  end if;

  select nc.audit_id, nc.created_by
    into v_audit_id, v_nc_creator
    from public.non_conformities nc
   where nc.id = new.non_conformity_id;

  select p.client_id into v_client_id
    from public.audits a
    join public.projects p on p.id = a.project_id
   where a.id = v_audit_id;

  insert into public.notifications
    (user_id, type, audit_id, nc_id, message_id, sender_id)
  select distinct prof.id,
         'nc_message',
         v_audit_id,
         new.non_conformity_id,
         new.id,
         new.author_id
    from public.profiles prof
   where prof.id <> new.author_id
     and (
       prof.id = v_nc_creator
       or (
         prof.client_id = v_client_id
         and prof.role in ('client_admin', 'client')
       )
     )
     and public.is_notif_enabled(prof.id, 'nc_message');

  return new;
end;
$$;

-- 4.b) Fil review -----------------------------------------------------------
create or replace function public.notify_on_nc_review_message()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_audit_id uuid;
begin
  if new.thread <> 'review' then
    return new;
  end if;

  select nc.audit_id into v_audit_id
    from public.non_conformities nc
   where nc.id = new.non_conformity_id;

  insert into public.notifications
    (user_id, type, audit_id, nc_id, message_id, sender_id)
  select distinct aa.profile_id,
         'nc.review_message',
         v_audit_id,
         new.non_conformity_id,
         new.id,
         new.author_id
    from public.audit_assignees aa
   where aa.audit_id = v_audit_id
     and aa.role in ('auditor', 'proofreader')
     and aa.profile_id <> new.author_id
     and public.is_notif_enabled(aa.profile_id, 'nc.review_message');

  return new;
end;
$$;

notify pgrst, 'reload schema';

commit;
