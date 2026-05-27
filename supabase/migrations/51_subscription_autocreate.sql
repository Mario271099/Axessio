-- ============================================================================
-- Migration 51 : Plans & abonnements — auto-création subscription 'free'
-- ----------------------------------------------------------------------------
-- Toute nouvelle organisation reçoit automatiquement une subscription 'free'.
-- Évite les NULL checks partout dans le code applicatif.
--
-- Idempotente.
-- ============================================================================

begin;

create or replace function public.handle_new_organization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.subscriptions (organization_id, plan_code, status)
  values (new.id, 'free', 'active')
  on conflict (organization_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_org_autocreate_subscription on public.organizations;
create trigger trg_org_autocreate_subscription
  after insert on public.organizations
  for each row execute function public.handle_new_organization();

commit;
