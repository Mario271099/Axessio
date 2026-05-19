-- ============================================================================
-- Migration 22 : correction du trigger notify_on_nc_message
-- ----------------------------------------------------------------------------
-- Bug dans la migration 19 : le trigger lisait `audits.client_id`, colonne
-- inexistante. Le client_id vit sur `projects`, lié à audits via `project_id`.
-- Conséquence : tout INSERT dans `nc_messages` échouait avec
--   « column a.client_id does not exist ».
--
-- Idempotente : on remplace simplement le corps de la fonction. Le trigger
-- reste attaché.
-- ============================================================================

begin;

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
  -- Récupère audit_id + créateur de la NC.
  select nc.audit_id, nc.created_by
    into v_audit_id, v_nc_creator
    from public.non_conformities nc
   where nc.id = new.non_conformity_id;

  -- Récupère client_id via la jointure projects (audits.project_id → projects.client_id).
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
         and prof.role in ('client_admin', 'client_member')
       )
     );

  return new;
end;
$$;

notify pgrst, 'reload schema';

commit;
