-- ============================================================================
-- Migration 50 : Plans & abonnements (Phase 4 — suite) — table subscriptions
-- ----------------------------------------------------------------------------
-- Une ligne par organisation. Les colonnes Stripe restent NULL tant que l'org
-- est sur le plan free (qui ne nécessite pas de passage par Stripe). Quand
-- l'org upgrade, on persiste customer_id + subscription_id pour pouvoir
-- réagir aux webhooks et ouvrir le Customer Portal.
--
-- Helpers SQL exposés :
--   current_org_plan()         → text (code du plan, 'free' par défaut)
--   org_plan_of(org_id)        → text
--   org_has_feature(code)      → boolean
--   org_limit(limit_code)      → integer (NULL = illimité)
--   org_within_limit(c, used)  → boolean
--
-- Idempotente.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. Enum statut Stripe (aligné sur les statuts Stripe officiels)
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'subscription_status') then
    create type public.subscription_status as enum (
      'trialing',
      'active',
      'past_due',
      'canceled',
      'incomplete',
      'incomplete_expired',
      'unpaid',
      'paused'
    );
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 2. Table subscriptions (1 par org)
-- ----------------------------------------------------------------------------
create table if not exists public.subscriptions (
  organization_id        uuid primary key references public.organizations(id) on delete cascade,
  plan_code              text not null references public.subscription_plans(code) on delete restrict default 'free',
  status                 public.subscription_status not null default 'active',
  billing_interval       text check (billing_interval in ('monthly','yearly')),
  current_period_start   timestamptz,
  current_period_end     timestamptz,
  trial_ends_at          timestamptz,
  cancel_at_period_end   boolean not null default false,
  stripe_customer_id     text,
  stripe_subscription_id text unique,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists idx_subscriptions_plan
  on public.subscriptions(plan_code);
create index if not exists idx_subscriptions_status
  on public.subscriptions(status);
create index if not exists idx_subscriptions_stripe_customer
  on public.subscriptions(stripe_customer_id)
  where stripe_customer_id is not null;

drop trigger if exists trg_subscriptions_set_updated_at on public.subscriptions;
create trigger trg_subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 3. Backfill : une subscription 'free' pour chaque org existante
-- ----------------------------------------------------------------------------
insert into public.subscriptions (organization_id, plan_code, status)
select id, 'free', 'active'
  from public.organizations
 where deleted_at is null
on conflict (organization_id) do nothing;

-- ----------------------------------------------------------------------------
-- 4. Helpers SQL (SECURITY DEFINER, search_path verrouillé)
-- ----------------------------------------------------------------------------

-- Plan actif sur une org donnée. Fallback 'free' si pas de ligne (ne devrait
-- pas arriver après la migration 51 qui crée la ligne au moment du INSERT,
-- mais on prévoit le coup pour ne pas casser les checks d'autorisation).
create or replace function public.org_plan_of(p_org_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select plan_code from public.subscriptions
      where organization_id = p_org_id
        and status in ('trialing','active','past_due')
      limit 1),
    'free'
  );
$$;

-- Plan actif sur l'org courante de l'utilisateur.
create or replace function public.current_org_plan()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select public.org_plan_of(public.current_org());
$$;

-- L'org courante a-t-elle la feature donnée ?
create or replace function public.org_has_feature(p_feature_code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.plan_features
     where plan_code = public.current_org_plan()
       and feature_code = p_feature_code
  );
$$;

-- Valeur de la limite (NULL = illimité, donc à interpréter comme "ok partout").
create or replace function public.org_limit(p_limit_code text)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select value
    from public.plan_limits
   where plan_code = public.current_org_plan()
     and limit_code = p_limit_code;
$$;

-- Pratique : l'org courante reste-t-elle sous la limite si elle ajoute une
-- unité ? `p_current_usage` est passé par le code applicatif (count audits,
-- count members, etc.) pour éviter une jointure complexe ici.
create or replace function public.org_within_limit(
  p_limit_code     text,
  p_current_usage  integer
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    case
      when (select value from public.plan_limits
              where plan_code = public.current_org_plan()
                and limit_code = p_limit_code) is null
        then true   -- limite NULL = illimité
      else
        p_current_usage < (
          select value from public.plan_limits
            where plan_code = public.current_org_plan()
              and limit_code = p_limit_code
        )
    end;
$$;

-- ----------------------------------------------------------------------------
-- 5. RLS — chaque membre voit la subscription de SES orgs
-- ----------------------------------------------------------------------------
alter table public.subscriptions enable row level security;

drop policy if exists subscriptions_select on public.subscriptions;
create policy subscriptions_select on public.subscriptions
  for select to authenticated
  using (
    public.is_admin()
    or public.is_member_of(organization_id)
  );

-- Update / insert / delete : on passe par la service-role key côté webhook
-- Stripe et server actions. Aucun INSERT/UPDATE/DELETE depuis le client.
-- (Donc pas de policy correspondante : auth role n'a pas le droit.)

notify pgrst, 'reload schema';

commit;
