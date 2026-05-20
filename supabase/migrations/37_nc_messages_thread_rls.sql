-- ============================================================================
-- Migration 37 : RLS nc_messages selon le fil (client vs review)
-- ----------------------------------------------------------------------------
-- Le `thread` (migration 34) cloisonne les fils par audience :
--   - thread='client'  : auditeur + admin + client_admin + client de l'audit
--   - thread='review'  : auditeur + admin + relecteur (proofreader)
--
-- On remplace les policies existantes par des versions qui consultent le
-- thread. Un helper SECURITY DEFINER porte la logique pour éviter toute
-- récursion sur audit_assignees / non_conformities.
--
-- Idempotente.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. Helper : l'utilisateur courant peut-il accéder au fil 'review' d'une NC ?
-- ----------------------------------------------------------------------------
-- Vrai si admin, OU auditor/proofreader assigné à l'audit de la NC.
create or replace function public.current_user_can_access_nc_review(p_nc_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or exists (
      select 1
      from public.non_conformities nc
      join public.audit_assignees aa on aa.audit_id = nc.audit_id
      where nc.id = p_nc_id
        and aa.profile_id = auth.uid()
        and aa.role in ('auditor', 'proofreader')
    );
$$;

-- ----------------------------------------------------------------------------
-- 2. Réécriture des policies nc_messages — branch par thread
-- ----------------------------------------------------------------------------
-- Le fil 'client' garde la sémantique précédente (nc_can_access, migration 08).
-- Le fil 'review' utilise le nouveau helper.
drop policy if exists nc_messages_select on public.nc_messages;
drop policy if exists nc_messages_insert on public.nc_messages;

create policy nc_messages_select on public.nc_messages
  for select to authenticated
  using (
    (thread = 'client'
       and public.nc_can_access(non_conformity_id))
    or
    (thread = 'review'
       and public.current_user_can_access_nc_review(non_conformity_id))
  );

create policy nc_messages_insert on public.nc_messages
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and (
      (thread = 'client'
         and public.nc_can_access(non_conformity_id))
      or
      (thread = 'review'
         and public.current_user_can_access_nc_review(non_conformity_id))
    )
  );

-- nc_messages_update / nc_messages_delete : `author_id = auth.uid()` inchangé,
-- l'auteur reste maître de son message peu importe le fil.

-- ----------------------------------------------------------------------------
-- 3. Trigger de notif sur fil 'review' : mécanisme parallèle au trigger
--    `notify_on_nc_message` existant qui ne traite que le fil 'client'.
-- ----------------------------------------------------------------------------
-- D'abord on contraint le trigger existant à thread='client'.
create or replace function public.notify_on_nc_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_audit_id   uuid;
  v_client_id  uuid;
  v_nc_creator uuid;
begin
  -- Notification fil client uniquement — le fil review a son propre trigger.
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
   where prof.id != new.author_id
     and (
       prof.id = v_nc_creator
       or (
         prof.client_id = v_client_id
         and prof.role in ('client_admin', 'client')
       )
     );

  return new;
end;
$$;

-- Nouveau trigger dédié au fil review.
create or replace function public.notify_on_nc_review_message()
returns trigger
language plpgsql
security definer
set search_path = public
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

  -- Tous les staff assignés à l'audit (auditor + proofreader) sauf l'auteur.
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
     and aa.profile_id <> new.author_id;

  return new;
end;
$$;

drop trigger if exists trg_notify_on_nc_review_message on public.nc_messages;
create trigger trg_notify_on_nc_review_message
  after insert on public.nc_messages
  for each row execute function public.notify_on_nc_review_message();

notify pgrst, 'reload schema';

commit;
