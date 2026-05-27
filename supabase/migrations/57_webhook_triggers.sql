-- ============================================================================
-- Migration 57 : Webhooks sortants (suite) — triggers métier
-- ----------------------------------------------------------------------------
-- Hooks AFTER INSERT/UPDATE qui appellent enqueue_webhook() avec un payload
-- minimal. Le dispatcher cron consommera la file et postera les payloads
-- vers les endpoints souscrits.
--
-- Catalogue d'événements émis :
--   nc.created              -> non_conformities AFTER INSERT
--   nc.status_changed       -> non_conformities AFTER UPDATE OF status
--   audit.status_changed    -> audits AFTER UPDATE OF status
--   audit.delivered         -> audits AFTER UPDATE quand status passe à DELIVERED
--
-- Le payload reste minimal : l'abonné peut faire un appel API pour récupérer
-- les détails (ou consommera plus tard quand on aura une vraie API publique).
--
-- Idempotente.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. non_conformities : INSERT + UPDATE status
-- ----------------------------------------------------------------------------
create or replace function public.webhook_emit_nc_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_payload jsonb;
begin
  -- Récupérer l'org_id via l'audit parent (les NC n'ont pas directement
  -- organization_id, elles l'héritent via l'audit).
  select a.organization_id into v_org_id
    from public.audits a
   where a.id = new.audit_id;

  if v_org_id is null then
    return new;
  end if;

  v_payload := jsonb_build_object(
    'nc_id',          new.id,
    'audit_id',       new.audit_id,
    'display_number', new.display_number,
    'title',          new.title,
    'status',         new.status,
    'severity',       new.severity
  );

  if tg_op = 'INSERT' then
    perform public.enqueue_webhook(v_org_id, 'nc.created', v_payload);
  elsif tg_op = 'UPDATE' and old.status is distinct from new.status then
    perform public.enqueue_webhook(
      v_org_id,
      'nc.status_changed',
      v_payload || jsonb_build_object('previous_status', old.status)
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_webhook_nc_insert on public.non_conformities;
create trigger trg_webhook_nc_insert
  after insert on public.non_conformities
  for each row execute function public.webhook_emit_nc_event();

drop trigger if exists trg_webhook_nc_status on public.non_conformities;
create trigger trg_webhook_nc_status
  after update of status on public.non_conformities
  for each row execute function public.webhook_emit_nc_event();

-- ----------------------------------------------------------------------------
-- 2. audits : UPDATE status (status_changed + cas particulier delivered)
-- ----------------------------------------------------------------------------
create or replace function public.webhook_emit_audit_status_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payload jsonb;
begin
  if new.organization_id is null then
    return new;
  end if;
  if old.status is not distinct from new.status then
    return new;
  end if;

  v_payload := jsonb_build_object(
    'audit_id',         new.id,
    'project_id',       new.project_id,
    'previous_status',  old.status,
    'status',           new.status
  );

  perform public.enqueue_webhook(
    new.organization_id,
    'audit.status_changed',
    v_payload
  );

  -- Émission supplémentaire ciblée pour le cas DELIVERED (plus simple à
  -- consommer pour les abonnés qui veulent juste "quand un audit est livré").
  if new.status = 'DELIVERED' then
    perform public.enqueue_webhook(
      new.organization_id,
      'audit.delivered',
      v_payload
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_webhook_audit_status on public.audits;
create trigger trg_webhook_audit_status
  after update of status on public.audits
  for each row execute function public.webhook_emit_audit_status_event();

notify pgrst, 'reload schema';

commit;
