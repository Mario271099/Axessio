-- ============================================================================
-- Migration 19 : notifications in-app
-- ----------------------------------------------------------------------------
-- Table `notifications` + RLS + trigger SECURITY DEFINER qui crée une ligne
-- par destinataire à chaque insert dans `nc_messages`.
--
-- Destinataires d'un nouveau message NC :
--   - L'auteur de la NC (non_conformities.created_by)
--   - Tous les profiles avec role IN ('client_admin', 'client_member') liés au
--     client de l'audit
--   - Moins le sender lui-même
--
-- Idempotente.
-- ============================================================================

begin;

-- 1) Table -------------------------------------------------------------------
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        text not null,
  audit_id    uuid references public.audits(id) on delete cascade,
  nc_id       uuid references public.non_conformities(id) on delete cascade,
  message_id  uuid references public.nc_messages(id) on delete cascade,
  sender_id   uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  read_at     timestamptz
);

create index if not exists idx_notifications_user_unread
  on public.notifications(user_id, created_at desc)
  where read_at is null;

create index if not exists idx_notifications_user_recent
  on public.notifications(user_id, created_at desc);

-- 2) RLS ---------------------------------------------------------------------
alter table public.notifications enable row level security;

drop policy if exists notifications_select on public.notifications;
drop policy if exists notifications_update on public.notifications;
drop policy if exists notifications_delete on public.notifications;

create policy notifications_select on public.notifications
  for select using (user_id = auth.uid());

create policy notifications_update on public.notifications
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy notifications_delete on public.notifications
  for delete using (user_id = auth.uid());

-- Pas de policy INSERT côté public : seul le trigger SECURITY DEFINER insère.

-- 3) Fonction trigger : à chaque nouveau message NC, crée les notifications --
create or replace function public.notify_on_nc_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_audit_id uuid;
  v_client_id uuid;
  v_nc_creator uuid;
begin
  -- Récupère audit_id + créateur de la NC
  select nc.audit_id, nc.created_by
    into v_audit_id, v_nc_creator
    from public.non_conformities nc
   where nc.id = new.non_conformity_id;

  -- Récupère client_id de l'audit
  select a.client_id into v_client_id
    from public.audits a
   where a.id = v_audit_id;

  -- Insère une notification par destinataire (auditeur créateur + users client),
  -- en excluant le sender et en dédupliquant.
  insert into public.notifications
    (user_id, type, audit_id, nc_id, message_id, sender_id)
  select distinct p.id,
         'nc_message',
         v_audit_id,
         new.non_conformity_id,
         new.id,
         new.author_id
    from public.profiles p
   where p.id != new.author_id
     and (
       p.id = v_nc_creator
       or (
         p.client_id = v_client_id
         and p.role in ('client_admin', 'client_member')
       )
     );

  return new;
end;
$$;

drop trigger if exists on_nc_message_inserted on public.nc_messages;
create trigger on_nc_message_inserted
  after insert on public.nc_messages
  for each row execute function public.notify_on_nc_message();

notify pgrst, 'reload schema';

commit;
