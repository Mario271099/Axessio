-- ============================================================================
-- Migration 49 : Plans & abonnements (Phase 4) — catalogue de plans
-- ----------------------------------------------------------------------------
-- Première brique billing : on stocke en DB les plans commerciaux, leurs
-- fonctionnalités et leurs limites quantitatives. Les colonnes Stripe
-- (product_id / price_id) restent NULLABLE — on peut faire tourner la
-- plateforme avec un plan 'free' par défaut sans configurer Stripe.
--
-- Trois tables :
--   subscription_plans   → code du plan + prix + Stripe ids
--   plan_features        → many-to-many plan -> feature flag
--   plan_limits          → many-to-many plan -> quota (int)
--
-- Idempotente (DO blocks + ON CONFLICT).
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. Catalogue des plans
-- ----------------------------------------------------------------------------
create table if not exists public.subscription_plans (
  code                       text primary key,
  name                       text not null,
  description                text,
  monthly_price_eur          numeric(10,2),
  yearly_price_eur           numeric(10,2),
  stripe_product_id          text,
  stripe_price_id_monthly    text,
  stripe_price_id_yearly     text,
  sort_order                 integer not null default 0,
  is_public                  boolean not null default true,
  is_active                  boolean not null default true,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);

create index if not exists idx_subscription_plans_active
  on public.subscription_plans(is_active) where is_active = true;

drop trigger if exists trg_plans_set_updated_at on public.subscription_plans;
create trigger trg_plans_set_updated_at
  before update on public.subscription_plans
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 2. Feature flags (string opaque, manipulés par le code applicatif)
-- ----------------------------------------------------------------------------
create table if not exists public.plan_features (
  plan_code     text not null references public.subscription_plans(code) on delete cascade,
  feature_code  text not null,
  primary key (plan_code, feature_code)
);

comment on table public.plan_features is
  'Feature flags binaires par plan. Lus par org_has_feature() / requireFeature().';

-- ----------------------------------------------------------------------------
-- 3. Limites quantitatives (NULL = illimité)
-- ----------------------------------------------------------------------------
create table if not exists public.plan_limits (
  plan_code     text not null references public.subscription_plans(code) on delete cascade,
  limit_code    text not null,
  value         integer,
  primary key (plan_code, limit_code)
);

comment on column public.plan_limits.value is
  'NULL = illimité. 0 = interdit (rarement utile, préférer une feature flag).';

-- ----------------------------------------------------------------------------
-- 4. Seed des plans
-- ----------------------------------------------------------------------------
insert into public.subscription_plans
  (code, name, description, monthly_price_eur, yearly_price_eur, sort_order, is_public, is_active)
values
  ('free',       'Free',       'Pour découvrir Axessio (1 audit, 2 membres)', 0,      0,      10, true,  true),
  ('starter',    'Starter',    'Freelances et petites équipes',                29,     290,    20, true,  true),
  ('pro',        'Pro',        'Agences et équipes growth',                    99,     990,    30, true,  true),
  ('enterprise', 'Enterprise', 'SSO, SCIM, support dédié',                     null,   null,   40, true,  true)
on conflict (code) do update
  set name              = excluded.name,
      description       = excluded.description,
      monthly_price_eur = excluded.monthly_price_eur,
      yearly_price_eur  = excluded.yearly_price_eur,
      sort_order        = excluded.sort_order,
      is_public         = excluded.is_public,
      is_active         = excluded.is_active;

-- ----------------------------------------------------------------------------
-- 5. Seed des features (idempotent via DELETE puis INSERT)
-- ----------------------------------------------------------------------------
delete from public.plan_features;

insert into public.plan_features (plan_code, feature_code) values
  -- Starter
  ('starter',    'export.pdf'),
  ('starter',    'remediation.simulator'),
  -- Pro (inclut tout starter + features collaboration)
  ('pro',        'export.pdf'),
  ('pro',        'remediation.simulator'),
  ('pro',        'audit.proofreading'),
  ('pro',        'audit.collaboration'),
  ('pro',        'audit_logs.export'),
  ('pro',        'webhooks.outgoing'),
  -- Enterprise (tout pro + enterprise-only)
  ('enterprise', 'export.pdf'),
  ('enterprise', 'remediation.simulator'),
  ('enterprise', 'audit.proofreading'),
  ('enterprise', 'audit.collaboration'),
  ('enterprise', 'audit_logs.export'),
  ('enterprise', 'webhooks.outgoing'),
  ('enterprise', 'sso.saml'),
  ('enterprise', 'sso.oidc'),
  ('enterprise', 'scim.provisioning'),
  ('enterprise', 'api.access'),
  ('enterprise', 'branding.custom'),
  ('enterprise', 'support.priority');

-- ----------------------------------------------------------------------------
-- 6. Seed des limites (NULL = illimité)
-- ----------------------------------------------------------------------------
delete from public.plan_limits;

insert into public.plan_limits (plan_code, limit_code, value) values
  -- free : très restrictif
  ('free',       'max_members',           2),
  ('free',       'max_active_audits',     1),
  ('free',       'max_audits_per_month',  2),
  -- starter
  ('starter',    'max_members',           5),
  ('starter',    'max_active_audits',     10),
  ('starter',    'max_audits_per_month',  20),
  -- pro
  ('pro',        'max_members',           25),
  ('pro',        'max_active_audits',     null),
  ('pro',        'max_audits_per_month',  null),
  -- enterprise : illimité partout
  ('enterprise', 'max_members',           null),
  ('enterprise', 'max_active_audits',     null),
  ('enterprise', 'max_audits_per_month',  null);

-- ----------------------------------------------------------------------------
-- 7. RLS lecture seule (catalogue public)
-- ----------------------------------------------------------------------------
alter table public.subscription_plans enable row level security;
alter table public.plan_features      enable row level security;
alter table public.plan_limits        enable row level security;

drop policy if exists subscription_plans_select on public.subscription_plans;
create policy subscription_plans_select on public.subscription_plans
  for select to authenticated using (true);

drop policy if exists plan_features_select on public.plan_features;
create policy plan_features_select on public.plan_features
  for select to authenticated using (true);

drop policy if exists plan_limits_select on public.plan_limits;
create policy plan_limits_select on public.plan_limits
  for select to authenticated using (true);

notify pgrst, 'reload schema';

commit;
