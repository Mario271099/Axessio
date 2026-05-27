-- ============================================================================
-- Migration 54 : Workspaces (Phase 6) — sous-divisions à l'intérieur d'une org
-- ----------------------------------------------------------------------------
-- Un workspace est une sous-organisation logique : utile pour les agences
-- qui veulent isoler les audits de leur équipe "Accessibilité Web" de ceux
-- de leur équipe "Mobile", ou pour cloisonner les projets d'un gros client.
--
-- Modèle :
--   - 1 org -> N workspaces (jamais 0 : un default est auto-créé)
--   - Un user membre d'org est implicitement membre de tous les workspaces
--     SI son rôle org est admin/owner. Les manager/member/viewer/guest n'ont
--     accès qu'aux workspaces où ils sont explicitement ajoutés.
--
-- On réutilise l'enum `public.org_role` (même hiérarchie owner..guest) — pas
-- besoin d'un type dédié.
--
-- Cette migration NE TOUCHE PAS encore aux audits / projects : la migration
-- 55 ajoutera la colonne workspace_id et fera le backfill.
--
-- Idempotente.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. Tables
-- ----------------------------------------------------------------------------
create table if not exists public.workspaces (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  slug            citext not null,
  name            text not null,
  description     text,
  is_default      boolean not null default false,
  is_archived     boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (organization_id, slug)
);

-- Un seul workspace `is_default = true` par org.
create unique index if not exists idx_workspaces_one_default
  on public.workspaces(organization_id)
  where is_default = true;

create index if not exists idx_workspaces_org
  on public.workspaces(organization_id)
  where is_archived = false;

drop trigger if exists trg_workspaces_set_updated_at on public.workspaces;
create trigger trg_workspaces_set_updated_at
  before update on public.workspaces
  for each row execute function public.set_updated_at();

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  role         public.org_role not null,
  invited_by   uuid references public.profiles(id) on delete set null,
  joined_at    timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create index if not exists idx_workspace_members_user
  on public.workspace_members(user_id);

-- ----------------------------------------------------------------------------
-- 2. Helpers SQL
-- ----------------------------------------------------------------------------

-- Vrai si l'utilisateur courant a accès au workspace (via membership
-- explicite OU via son rôle org admin/owner).
create or replace function public.has_workspace_access(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with ws as (
    select organization_id from public.workspaces
     where id = p_workspace_id
  )
  select
    -- Bypass plateforme
    public.is_admin()
    -- Bypass org admin/owner
    or exists (
      select 1
        from ws, public.organization_members m
       where m.organization_id = ws.organization_id
         and m.user_id = auth.uid()
         and m.role in ('owner','admin')
    )
    -- Membership explicite sur le workspace
    or exists (
      select 1 from public.workspace_members
       where workspace_id = p_workspace_id
         and user_id = auth.uid()
    );
$$;

-- Vrai si l'utilisateur courant a au moins le rôle p_min_role sur le
-- workspace donné (en remontant l'éventuel rôle org admin/owner comme étant
-- supérieur à tout rôle workspace).
create or replace function public.has_workspace_role(
  p_workspace_id uuid,
  p_min_role     public.org_role
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with weights(role, weight) as (
    values
      ('guest'::public.org_role,   1),
      ('viewer'::public.org_role,  2),
      ('member'::public.org_role,  3),
      ('manager'::public.org_role, 4),
      ('admin'::public.org_role,   5),
      ('owner'::public.org_role,   6)
  ),
  ws as (
    select organization_id from public.workspaces where id = p_workspace_id
  ),
  my_role as (
    -- 1) Cherche d'abord un rôle org admin/owner (qui surclasse tout)
    select m.role
      from ws, public.organization_members m
     where m.organization_id = ws.organization_id
       and m.user_id = auth.uid()
       and m.role in ('owner','admin')
    union all
    -- 2) Sinon le rôle workspace explicite
    select wm.role
      from public.workspace_members wm
     where wm.workspace_id = p_workspace_id
       and wm.user_id = auth.uid()
    order by 1 desc
    limit 1
  )
  select exists (
    select 1 from my_role m
    join weights w_my  on w_my.role = m.role
    join weights w_min on w_min.role = p_min_role
    where w_my.weight >= w_min.weight
  );
$$;

-- Liste des workspaces visibles par l'utilisateur courant, dans son org
-- active. Utilisé par la page /organizations/[slug]/workspaces et un futur
-- workspace switcher dans la sidebar.
create or replace function public.my_workspaces()
returns table(
  workspace_id   uuid,
  organization_id uuid,
  slug           citext,
  name           text,
  description    text,
  is_default     boolean,
  is_archived    boolean,
  effective_role public.org_role
)
language sql
stable
security definer
set search_path = public
as $$
  with my_org_role as (
    select m.organization_id, m.role
      from public.organization_members m
     where m.user_id = auth.uid()
  )
  select
    w.id,
    w.organization_id,
    w.slug,
    w.name,
    w.description,
    w.is_default,
    w.is_archived,
    coalesce(
      (select role from public.workspace_members
        where workspace_id = w.id and user_id = auth.uid()),
      (select role from my_org_role mor
        where mor.organization_id = w.organization_id and mor.role in ('owner','admin'))
    ) as effective_role
   from public.workspaces w
  where w.is_archived = false
    and (
      public.is_admin()
      or exists (select 1 from my_org_role mor
                  where mor.organization_id = w.organization_id
                    and mor.role in ('owner','admin'))
      or exists (select 1 from public.workspace_members
                  where workspace_id = w.id and user_id = auth.uid())
    )
  order by w.is_default desc, w.name;
$$;

-- ----------------------------------------------------------------------------
-- 3. Trigger : auto-créer un workspace default à la création d'une org
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_organization_workspace()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.workspaces (organization_id, slug, name, is_default)
  values (new.id, 'default', 'Workspace principal', true)
  on conflict (organization_id, slug) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_org_autocreate_workspace on public.organizations;
create trigger trg_org_autocreate_workspace
  after insert on public.organizations
  for each row execute function public.handle_new_organization_workspace();

-- ----------------------------------------------------------------------------
-- 4. Backfill : créer le workspace default pour les orgs existantes
-- ----------------------------------------------------------------------------
insert into public.workspaces (organization_id, slug, name, is_default)
select id, 'default', 'Workspace principal', true
  from public.organizations
 where deleted_at is null
on conflict (organization_id, slug) do nothing;

-- ----------------------------------------------------------------------------
-- 5. RLS
-- ----------------------------------------------------------------------------
alter table public.workspaces        enable row level security;
alter table public.workspace_members enable row level security;

drop policy if exists workspaces_select on public.workspaces;
create policy workspaces_select on public.workspaces
  for select to authenticated
  using (public.has_workspace_access(id));

-- Owner/admin de l'org peuvent créer/modifier les workspaces.
drop policy if exists workspaces_manage on public.workspaces;
create policy workspaces_manage on public.workspaces
  for all to authenticated
  using (
    public.is_admin()
    or public.has_org_role(organization_id, 'admin')
  )
  with check (
    public.is_admin()
    or public.has_org_role(organization_id, 'admin')
  );

drop policy if exists workspace_members_select on public.workspace_members;
create policy workspace_members_select on public.workspace_members
  for select to authenticated
  using (
    public.is_admin()
    or user_id = auth.uid()
    or public.has_workspace_role(workspace_id, 'manager')
  );

drop policy if exists workspace_members_manage on public.workspace_members;
create policy workspace_members_manage on public.workspace_members
  for all to authenticated
  using (
    public.is_admin()
    or public.has_workspace_role(workspace_id, 'admin')
  )
  with check (
    public.is_admin()
    or public.has_workspace_role(workspace_id, 'admin')
  );

notify pgrst, 'reload schema';

commit;
