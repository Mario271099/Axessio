-- ============================================================================
-- Axessio · Phase 3 — Limites par organisation (overrides + max_clients)
-- ----------------------------------------------------------------------------
-- Source de vérité : ROLES_ROADMAP.md à la racine du repo.
--
-- Trois changements :
--
-- 1. Nouvelle limite `max_clients` ajoutée au catalogue plan_limits.
--    Free=1, Starter=10, Pro=null (illimité), Enterprise=null.
--    Garantit que personas 1 (freelance) et 3 (consultance) peuvent gérer
--    plusieurs clients dans leur org.
--
-- 2. Table `org_limits(organization_id, limit_code, value)` qui stocke des
--    overrides PAR ORG. Permet de débloquer un client précis sans changer
--    son plan (ex: "Starter + max_clients = 30 pour cet utilisateur").
--    Toutes les colonnes sont nullables côté value : null = "illimité".
--
-- 3. Helper SQL `org_effective_limit(org, code)` qui retourne :
--      - l'override `org_limits.value` s'il existe,
--      - sinon la valeur du plan via `plan_limits`.
--    Les helpers existants `org_limit()` et `org_within_limit()` sont
--    réécrits pour passer par `org_effective_limit()`, transparents pour
--    le code applicatif qui les appelle déjà.
--
-- Idempotent. Pas de drop destructif.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1) Seed `max_clients` dans plan_limits
-- ----------------------------------------------------------------------------
insert into public.plan_limits (plan_code, limit_code, value) values
  ('free',       'max_clients', 1),
  ('starter',    'max_clients', 10),
  ('pro',        'max_clients', null),
  ('enterprise', 'max_clients', null)
on conflict (plan_code, limit_code) do update
  set value = excluded.value;

-- ----------------------------------------------------------------------------
-- 2) Table org_limits — overrides par organisation
-- ----------------------------------------------------------------------------
create table if not exists public.org_limits (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  limit_code      text not null,
  value           integer,                       -- null = illimité
  updated_at      timestamptz not null default now(),
  updated_by      uuid references public.profiles(id) on delete set null,
  primary key (organization_id, limit_code)
);

comment on table public.org_limits is
  'Overrides de limites par organisation. Une ligne ici écrase la valeur '
  'fournie par plan_limits pour le couple (org, limit_code). NULL value = '
  'illimité pour cette org sur ce code de limite.';

create index if not exists idx_org_limits_lookup
  on public.org_limits(organization_id, limit_code);

-- RLS : un membre de l'org voit ses overrides. Seul un admin (org ou
-- plateforme) peut les modifier.
alter table public.org_limits enable row level security;

drop policy if exists org_limits_select on public.org_limits;
create policy org_limits_select on public.org_limits
  for select to authenticated
  using (
    public.is_admin()
    or public.is_member_of(organization_id)
  );

drop policy if exists org_limits_manage on public.org_limits;
create policy org_limits_manage on public.org_limits
  for all to authenticated
  using (
    public.is_admin()
    or public.has_org_role(organization_id, 'admin')
  )
  with check (
    public.is_admin()
    or public.has_org_role(organization_id, 'admin')
  );

-- ----------------------------------------------------------------------------
-- 3) Helper effectif : override ou plan
-- ----------------------------------------------------------------------------
-- Renvoie soit la valeur override de org_limits si elle existe pour cette
-- org, soit la valeur par défaut du plan via plan_limits.
-- Le caractère `nullable` est légèrement subtil : la table org_limits peut
-- contenir une LIGNE avec value=NULL (= illimité pour cette org). On
-- distingue donc "pas d'override" (pas de ligne) de "override = illimité"
-- (ligne présente, value null) via un check d'existence.
create or replace function public.org_effective_limit(
  p_org_id     uuid,
  p_limit_code text
)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select case
    when exists (
      select 1 from public.org_limits
       where organization_id = p_org_id
         and limit_code = p_limit_code
    )
    then (
      select value from public.org_limits
       where organization_id = p_org_id
         and limit_code = p_limit_code
    )
    else (
      select pl.value
        from public.plan_limits pl
        join public.subscriptions s
          on s.plan_code = pl.plan_code
       where s.organization_id = p_org_id
         and pl.limit_code = p_limit_code
       limit 1
    )
  end;
$$;

comment on function public.org_effective_limit(uuid, text) is
  'Limite effective d''une org sur un code donné : override org_limits '
  'sinon valeur du plan via plan_limits. NULL = illimité.';

-- ----------------------------------------------------------------------------
-- 4) Réécriture des helpers existants pour passer par org_effective_limit
-- ----------------------------------------------------------------------------
-- `org_limit()` était basé sur current_org() + plan_limits. On passe par
-- le nouveau helper pour que les overrides soient pris en compte
-- automatiquement par tout le code applicatif qui l'appelle déjà.
create or replace function public.org_limit(p_limit_code text)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select public.org_effective_limit(public.current_org(), p_limit_code);
$$;

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
      when public.org_effective_limit(public.current_org(), p_limit_code) is null
        then true   -- limite NULL = illimité
      else
        p_current_usage < public.org_effective_limit(public.current_org(), p_limit_code)
    end;
$$;

notify pgrst, 'reload schema';

commit;
