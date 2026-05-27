-- ============================================================================
-- Migration 56 : Webhooks sortants (Phase 5) — endpoints + livraisons
-- ----------------------------------------------------------------------------
-- Permet à une org de s'abonner à des événements métier (audit livré, NC
-- créée, etc.) via une URL HTTP. Quand un événement se produit, on
-- enqueue une ligne dans webhook_deliveries ; un worker cron consomme la
-- file et POSTe vers l'URL configurée avec une signature HMAC.
--
-- Feature gating : `webhooks.outgoing` (Pro / Enterprise). Le check se fait
-- côté code applicatif — la table reste créable techniquement pour les
-- plans inférieurs (mais l'UI est masquée).
--
-- Idempotente.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. Enum des statuts de livraison
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'webhook_delivery_status') then
    create type public.webhook_delivery_status as enum (
      'pending',  -- en attente d'envoi
      'success',  -- 2xx reçu
      'retry',    -- échec récupérable (timeout, 5xx, 429)
      'failed'    -- abandonné après N tentatives
    );
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 2. Table des endpoints
-- ----------------------------------------------------------------------------
create table if not exists public.webhook_endpoints (
  id                       uuid primary key default gen_random_uuid(),
  organization_id          uuid not null references public.organizations(id) on delete cascade,
  url                      text not null,
  description              text,
  secret                   text not null,
  is_active                boolean not null default true,
  subscribed_events        text[] not null default '{}',
  last_delivery_at         timestamptz,
  last_success_at          timestamptz,
  last_failure_at          timestamptz,
  consecutive_failures     integer not null default 0,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  constraint webhook_endpoints_url_https
    check (url ~* '^https?://')
);

create index if not exists idx_webhook_endpoints_org_active
  on public.webhook_endpoints(organization_id)
  where is_active = true;

drop trigger if exists trg_webhook_endpoints_set_updated_at on public.webhook_endpoints;
create trigger trg_webhook_endpoints_set_updated_at
  before update on public.webhook_endpoints
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 3. Table des livraisons (queue + historique)
-- ----------------------------------------------------------------------------
create table if not exists public.webhook_deliveries (
  id                uuid primary key default gen_random_uuid(),
  endpoint_id       uuid not null references public.webhook_endpoints(id) on delete cascade,
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  event_type        text not null,
  payload           jsonb not null,
  status            public.webhook_delivery_status not null default 'pending',
  attempt_count     integer not null default 0,
  http_status       integer,
  response_excerpt  text,         -- premiers 1024 char de la réponse
  error_message     text,
  next_attempt_at   timestamptz not null default now(),
  delivered_at      timestamptz,
  created_at        timestamptz not null default now()
);

-- Index "pop the queue" : les pending dont l'heure est passée.
create index if not exists idx_webhook_deliveries_queue
  on public.webhook_deliveries(next_attempt_at)
  where status in ('pending','retry');

create index if not exists idx_webhook_deliveries_endpoint_created
  on public.webhook_deliveries(endpoint_id, created_at desc);

-- ----------------------------------------------------------------------------
-- 4. Helper : enqueue une livraison pour tous les endpoints souscrits
-- ----------------------------------------------------------------------------
-- Appelée par les triggers métier (migration 57) ou directement depuis le
-- code applicatif via RPC. SECURITY DEFINER pour pouvoir lire les endpoints
-- depuis n'importe quel contexte (incluant les triggers AFTER).
create or replace function public.enqueue_webhook(
  p_organization_id uuid,
  p_event_type      text,
  p_payload         jsonb
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
begin
  insert into public.webhook_deliveries
    (endpoint_id, organization_id, event_type, payload)
  select e.id, e.organization_id, p_event_type, p_payload
    from public.webhook_endpoints e
   where e.organization_id = p_organization_id
     and e.is_active = true
     and p_event_type = any(e.subscribed_events);

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- ----------------------------------------------------------------------------
-- 5. RLS — admin/owner d'org seulement (les endpoints contiennent un secret)
-- ----------------------------------------------------------------------------
alter table public.webhook_endpoints  enable row level security;
alter table public.webhook_deliveries enable row level security;

drop policy if exists webhook_endpoints_select on public.webhook_endpoints;
create policy webhook_endpoints_select on public.webhook_endpoints
  for select to authenticated
  using (
    public.is_admin()
    or public.has_org_role(organization_id, 'admin')
  );

drop policy if exists webhook_endpoints_manage on public.webhook_endpoints;
create policy webhook_endpoints_manage on public.webhook_endpoints
  for all to authenticated
  using (
    public.is_admin()
    or public.has_org_role(organization_id, 'admin')
  )
  with check (
    public.is_admin()
    or public.has_org_role(organization_id, 'admin')
  );

drop policy if exists webhook_deliveries_select on public.webhook_deliveries;
create policy webhook_deliveries_select on public.webhook_deliveries
  for select to authenticated
  using (
    public.is_admin()
    or public.has_org_role(organization_id, 'admin')
  );

-- Pas d'INSERT/UPDATE/DELETE côté authenticated : tout passe par
-- enqueue_webhook() ou par la service-role key (dispatcher cron).

notify pgrst, 'reload schema';

commit;
