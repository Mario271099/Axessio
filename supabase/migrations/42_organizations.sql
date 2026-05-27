-- ============================================================================
-- Migration 42 : Tenancy (Phase 1) — organizations + organization_members
-- ----------------------------------------------------------------------------
-- Première brique du refactor RBAC moderne. On ajoute deux tables sans
-- toucher à l'existant. Les RLS et les rôles legacy continuent à fonctionner
-- pendant la phase de coexistence (phase 2 basculera).
--
--   organizations          → tenant racine (freelance / agence / entreprise)
--   organization_members   → utilisateur ↔ org avec un rôle
--   helpers SQL            → current_org(), is_member_of(), has_org_role()
--
-- Idempotente.
-- ============================================================================

begin;

-- citext : slug case-insensitive (acme = ACME = Acme).
create extension if not exists citext;

-- ----------------------------------------------------------------------------
-- 1. Enums
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'org_type') then
    create type public.org_type as enum (
      'individual',  -- freelance / consultant
      'agency',      -- mène des audits pour des clients
      'company',     -- audite ses propres produits
      'enterprise'   -- grandes structures avec besoins compliance / SSO
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'org_role') then
    create type public.org_role as enum (
      'owner',   -- unique par org, droits absolus
      'admin',   -- gère membres + facturation
      'manager', -- gère les audits + équipe métier
      'member',  -- contribue aux audits
      'viewer',  -- lecture seule
      'guest'    -- accès restreint à des ressources spécifiques
    );
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 2. Tables
-- ----------------------------------------------------------------------------
create table if not exists public.organizations (
  id              uuid primary key default gen_random_uuid(),
  slug            citext unique not null,
  name            text not null,
  type            public.org_type not null default 'company',
  billing_email   citext not null,
  data_residency  text not null default 'eu'
                  check (data_residency in ('eu','us','asia')),
  deleted_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_organizations_slug on public.organizations(slug);
create index if not exists idx_organizations_deleted on public.organizations(deleted_at)
  where deleted_at is null;

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  role            public.org_role not null,
  invited_by      uuid references public.profiles(id) on delete set null,
  joined_at       timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create index if not exists idx_org_members_user
  on public.organization_members(user_id);
create index if not exists idx_org_members_org_role
  on public.organization_members(organization_id, role);

-- Garde-fou : un seul `owner` par org.
create unique index if not exists idx_org_members_one_owner
  on public.organization_members(organization_id)
  where role = 'owner';

-- ----------------------------------------------------------------------------
-- 3. Trigger updated_at
-- ----------------------------------------------------------------------------
drop trigger if exists trg_org_set_updated_at on public.organizations;
create trigger trg_org_set_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 4. Helpers SQL — SECURITY DEFINER pour éviter toute récursion RLS
-- ----------------------------------------------------------------------------

-- Org active de l'utilisateur, lue depuis le claim JWT `current_org`. Tombe
-- sur NULL si le claim n'est pas posé (premier login, avant le selector).
-- L'autorisation finale est laissée à `is_member_of()` qui refuse si NULL.
create or replace function public.current_org()
returns uuid
language sql
stable
as $$
  select nullif(
    coalesce(
      current_setting('request.jwt.claims', true)::jsonb->>'current_org',
      ''
    ),
    ''
  )::uuid;
$$;

-- L'utilisateur courant est-il membre de l'organisation donnée ?
create or replace function public.is_member_of(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members
     where organization_id = p_org_id
       and user_id = auth.uid()
  );
$$;

-- L'utilisateur courant a-t-il le rôle donné (ou supérieur) dans l'org ?
-- Hiérarchie : owner > admin > manager > member > viewer > guest.
create or replace function public.has_org_role(
  p_org_id uuid,
  p_min_role public.org_role
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with my_role as (
    select role from public.organization_members
     where organization_id = p_org_id and user_id = auth.uid()
  ),
  hierarchy(role, weight) as (
    values
      ('guest'::public.org_role,   1),
      ('viewer'::public.org_role,  2),
      ('member'::public.org_role,  3),
      ('manager'::public.org_role, 4),
      ('admin'::public.org_role,   5),
      ('owner'::public.org_role,   6)
  )
  select exists (
    select 1 from my_role m
    join hierarchy h_my  on h_my.role = m.role
    join hierarchy h_min on h_min.role = p_min_role
    where h_my.weight >= h_min.weight
  );
$$;

-- Toutes les organisations dont l'utilisateur courant est membre. Utilisé
-- par la sidebar org-switcher + page /organizations.
create or replace function public.my_organizations()
returns table(
  organization_id uuid,
  role            public.org_role,
  org_name        text,
  org_slug        citext,
  org_type        public.org_type
)
language sql
stable
security definer
set search_path = public
as $$
  select m.organization_id, m.role, o.name, o.slug, o.type
    from public.organization_members m
    join public.organizations o on o.id = m.organization_id
   where m.user_id = auth.uid()
     and o.deleted_at is null
   order by o.name;
$$;

-- ----------------------------------------------------------------------------
-- 5. RLS sur les nouvelles tables (lecture seule pour membres)
-- ----------------------------------------------------------------------------
alter table public.organizations         enable row level security;
alter table public.organization_members  enable row level security;

drop policy if exists organizations_select on public.organizations;
create policy organizations_select on public.organizations
  for select to authenticated
  using (
    public.is_admin()
    or public.is_member_of(id)
  );

-- Admin (plateforme) peut tout. Owner/admin de l'org peut update sa propre org.
drop policy if exists organizations_update on public.organizations;
create policy organizations_update on public.organizations
  for update to authenticated
  using (
    public.is_admin()
    or public.has_org_role(id, 'admin')
  )
  with check (
    public.is_admin()
    or public.has_org_role(id, 'admin')
  );

drop policy if exists organizations_insert on public.organizations;
create policy organizations_insert on public.organizations
  for insert to authenticated
  with check (
    public.is_admin()
    -- Tout user authentifié peut créer SA PROPRE org (auto-onboarding) ;
    -- le membership owner est ajouté en server action côté code.
    or auth.uid() is not null
  );

drop policy if exists organizations_delete on public.organizations;
create policy organizations_delete on public.organizations
  for delete to authenticated
  using (
    public.is_admin()
    or public.has_org_role(id, 'owner')
  );

-- organization_members : on voit ses propres lignes + toutes celles des orgs
-- dont on est admin ou owner.
drop policy if exists org_members_select on public.organization_members;
create policy org_members_select on public.organization_members
  for select to authenticated
  using (
    public.is_admin()
    or user_id = auth.uid()
    or public.has_org_role(organization_id, 'manager')
  );

drop policy if exists org_members_manage on public.organization_members;
create policy org_members_manage on public.organization_members
  for all to authenticated
  using (
    public.is_admin()
    or public.has_org_role(organization_id, 'admin')
  )
  with check (
    public.is_admin()
    or public.has_org_role(organization_id, 'admin')
  );

notify pgrst, 'reload schema';

commit;
