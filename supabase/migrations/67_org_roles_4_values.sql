-- ============================================================================
-- Axessio · Phase 2 — Refonte rôles d'organisation : 6 → 4 valeurs
-- ----------------------------------------------------------------------------
-- Source de vérité : ROLES_ROADMAP.md à la racine du repo.
--
-- Avant :  owner, admin, manager, member, viewer, guest (6 valeurs)
-- Après :  owner, admin, auditor, viewer (4 valeurs)
--
-- Mapping data :
--   owner   → owner
--   admin   → admin
--   manager → auditor   (absorption)
--   member  → auditor   (absorption)
--   viewer  → viewer    (élargi : peut désormais commenter)
--   guest   → viewer    (rétrogradation à terme : les vrais invités passent
--                        par audit_assignees.role = 'contact' — Phase 5)
--
-- Permissions chat split :
--   chat.read  → chat.client.read  + chat.review.read
--   chat.write → chat.client.write + chat.review.write
--
-- Postgres ne permet pas de retirer une valeur d'un enum sans recréer le
-- type. Les fonctions et policies qui référencent l'enum doivent donc être
-- droppées au préalable puis recréées. Cette migration fait les deux dans
-- la même transaction pour rester atomique.
--
-- Idempotente (skips si l'enum a déjà 4 valeurs).
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 0) Idempotence : si l'enum a déjà été migré, on s'arrête tôt.
-- ----------------------------------------------------------------------------
do $$
begin
  if (select count(*) from pg_enum
        where enumtypid = 'public.org_role'::regtype) = 4 then
    raise notice 'Phase 2 : enum org_role déjà à 4 valeurs — migration sautée.';
    return;
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 1) Ajouter les nouvelles permissions de chat split
-- ----------------------------------------------------------------------------
insert into public.permissions (code, category, description, is_dangerous) values
  ('chat.client.read',  'chat', 'Lire le fil de messages côté client d''une NC',     false),
  ('chat.client.write', 'chat', 'Écrire dans le fil de messages côté client d''une NC', false),
  ('chat.review.read',  'chat', 'Lire le fil de relecture interne d''une NC',         false),
  ('chat.review.write', 'chat', 'Écrire dans le fil de relecture interne d''une NC',  false)
on conflict (code) do update
  set category    = excluded.category,
      description = excluded.description,
      is_dangerous= excluded.is_dangerous;

-- Suppression des anciennes (cascade sur role_permissions).
delete from public.permissions where code in ('chat.read', 'chat.write');

-- ----------------------------------------------------------------------------
-- 2) Drop les policies qui dépendent de has_org_role / has_workspace_role
--    (on les recréera plus bas avec la même sémantique, ajustée à la
--    nouvelle hiérarchie 4 niveaux)
-- ----------------------------------------------------------------------------
drop policy if exists organizations_update on public.organizations;
drop policy if exists organizations_delete on public.organizations;
drop policy if exists org_members_select on public.organization_members;
drop policy if exists org_members_manage on public.organization_members;
drop policy if exists org_auth_methods_select on public.org_auth_methods;
drop policy if exists org_auth_methods_manage on public.org_auth_methods;
drop policy if exists workspaces_manage on public.workspaces;
drop policy if exists workspace_members_select on public.workspace_members;
drop policy if exists workspace_members_manage on public.workspace_members;
drop policy if exists webhook_endpoints_select on public.webhook_endpoints;
drop policy if exists webhook_endpoints_manage on public.webhook_endpoints;
drop policy if exists webhook_deliveries_select on public.webhook_deliveries;
drop policy if exists api_tokens_select on public.api_tokens;
drop policy if exists api_tokens_manage on public.api_tokens;
drop policy if exists audit_logs_select_org_admin on public.audit_logs;

-- ----------------------------------------------------------------------------
-- 3) Drop les fonctions typées org_role
-- ----------------------------------------------------------------------------
drop function if exists public.has_org_role(uuid, public.org_role);
drop function if exists public.has_workspace_role(uuid, public.org_role);
drop function if exists public.my_organizations();
drop function if exists public.my_workspaces();

-- ----------------------------------------------------------------------------
-- 4) Passage des colonnes en text pour le remap data
-- ----------------------------------------------------------------------------
alter table public.organization_members
  alter column role drop default;
alter table public.organization_members
  alter column role type text using role::text;

alter table public.workspace_members
  alter column role drop default;
alter table public.workspace_members
  alter column role type text using role::text;

-- ----------------------------------------------------------------------------
-- 5) Mapping data : 6 → 4 valeurs
-- ----------------------------------------------------------------------------
update public.organization_members
   set role = 'auditor'
 where role in ('manager', 'member');

update public.organization_members
   set role = 'viewer'
 where role = 'guest';

update public.workspace_members
   set role = 'auditor'
 where role in ('manager', 'member');

update public.workspace_members
   set role = 'viewer'
 where role = 'guest';

-- ----------------------------------------------------------------------------
-- 6) Recréer l'enum + re-typer les colonnes
-- ----------------------------------------------------------------------------
drop type if exists public.org_role;
create type public.org_role as enum ('owner', 'admin', 'auditor', 'viewer');

alter table public.organization_members
  alter column role type public.org_role using role::public.org_role;

alter table public.workspace_members
  alter column role type public.org_role using role::public.org_role;

alter table public.workspace_members
  alter column role set default 'auditor'::public.org_role;

-- ----------------------------------------------------------------------------
-- 7) Recréer les helpers (signatures et hiérarchie alignées sur 4 valeurs)
-- ----------------------------------------------------------------------------
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
     where organization_id = p_org_id
       and user_id = auth.uid()
     limit 1
  ),
  hierarchy(role, weight) as (
    values
      ('viewer'::public.org_role,  1),
      ('auditor'::public.org_role, 2),
      ('admin'::public.org_role,   3),
      ('owner'::public.org_role,   4)
  )
  select exists(
    select 1 from my_role m
    join hierarchy h_my  on h_my.role = m.role
    join hierarchy h_min on h_min.role = p_min_role
    where h_my.weight >= h_min.weight
  );
$$;

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
  with my_role as (
    select role from public.workspace_members
     where workspace_id = p_workspace_id and user_id = auth.uid()
    union all
    select m.role
      from public.workspaces ws
      join public.organization_members m
        on m.organization_id = ws.organization_id
       and m.user_id = auth.uid()
     where ws.id = p_workspace_id
       and m.role in ('owner','admin')
     limit 1
  ),
  hierarchy(role, weight) as (
    values
      ('viewer'::public.org_role,  1),
      ('auditor'::public.org_role, 2),
      ('admin'::public.org_role,   3),
      ('owner'::public.org_role,   4)
  )
  select exists(
    select 1 from my_role m
    join hierarchy h_my  on h_my.role = m.role
    join hierarchy h_min on h_min.role = p_min_role
    where h_my.weight >= h_min.weight
  );
$$;

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

create or replace function public.my_workspaces()
returns table(
  workspace_id    uuid,
  organization_id uuid,
  slug            citext,
  name            text,
  description     text,
  is_default      boolean,
  is_archived     boolean,
  effective_role  public.org_role
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
-- 8) Recréer les policies droppées au point 2
--    Note : 'manager' (legacy) devient 'auditor' partout. Le seuil 'admin'
--    et 'owner' restent inchangés.
-- ----------------------------------------------------------------------------

-- organizations
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

create policy organizations_delete on public.organizations
  for delete to authenticated
  using (
    public.is_admin()
    or public.has_org_role(id, 'owner')
  );

-- organization_members
create policy org_members_select on public.organization_members
  for select to authenticated
  using (
    public.is_admin()
    or user_id = auth.uid()
    or public.has_org_role(organization_id, 'auditor')
  );

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

-- org_auth_methods (mig. 53)
create policy org_auth_methods_select on public.org_auth_methods
  for select to authenticated
  using (
    public.is_admin()
    or public.has_org_role(organization_id, 'admin')
  );

create policy org_auth_methods_manage on public.org_auth_methods
  for all to authenticated
  using (
    public.is_admin()
    or public.has_org_role(organization_id, 'admin')
  )
  with check (
    public.is_admin()
    or public.has_org_role(organization_id, 'admin')
  );

-- workspaces (mig. 54)
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

create policy workspace_members_select on public.workspace_members
  for select to authenticated
  using (
    public.is_admin()
    or user_id = auth.uid()
    or public.has_workspace_role(workspace_id, 'auditor')
  );

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

-- webhook_endpoints + deliveries (mig. 56)
create policy webhook_endpoints_select on public.webhook_endpoints
  for select to authenticated
  using (
    public.is_admin()
    or public.has_org_role(organization_id, 'admin')
  );

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

create policy webhook_deliveries_select on public.webhook_deliveries
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.webhook_endpoints e
       where e.id = webhook_deliveries.endpoint_id
         and public.has_org_role(e.organization_id, 'admin')
    )
  );

-- api_tokens (mig. 58)
create policy api_tokens_select on public.api_tokens
  for select to authenticated
  using (
    public.is_admin()
    or public.has_org_role(organization_id, 'admin')
  );

create policy api_tokens_manage on public.api_tokens
  for all to authenticated
  using (
    public.is_admin()
    or public.has_org_role(organization_id, 'admin')
  )
  with check (
    public.is_admin()
    or public.has_org_role(organization_id, 'admin')
  );

-- audit_logs (mig. 59) — la policy d'origine combinait organization_id et
-- has_org_role(organization_id, 'admin'). On reprend tel quel.
create policy audit_logs_select_org_admin on public.audit_logs
  for select to authenticated
  using (
    public.is_admin()
    or (
      organization_id is not null
      and public.has_org_role(organization_id, 'admin')
    )
  );

-- ----------------------------------------------------------------------------
-- 9) Re-seed role_permissions selon la matrice cible (4 rôles)
-- ----------------------------------------------------------------------------
delete from public.role_permissions where scope = 'org';

-- owner + admin : toutes les permissions du catalogue
insert into public.role_permissions (scope, role_code, permission)
select 'org', r.role_code, p.code
  from (values ('owner'), ('admin')) as r(role_code)
 cross join public.permissions p;

-- auditor : contribution complète aux audits (matrix, NC, projet, chat),
-- pas de gestion clients/membres/facturation
insert into public.role_permissions (scope, role_code, permission) values
  ('org', 'auditor', 'audit.view'),
  ('org', 'auditor', 'audit.edit'),
  ('org', 'auditor', 'audit.delete'),
  ('org', 'auditor', 'audit.assign_auditor'),
  ('org', 'auditor', 'matrix.edit'),
  ('org', 'auditor', 'nc.create'),
  ('org', 'auditor', 'nc.edit'),
  ('org', 'auditor', 'nc.delete'),
  ('org', 'auditor', 'nc.update_status_client'),
  ('org', 'auditor', 'remediation.view'),
  ('org', 'auditor', 'chat.client.read'),
  ('org', 'auditor', 'chat.client.write'),
  ('org', 'auditor', 'chat.review.read'),
  ('org', 'auditor', 'chat.review.write'),
  ('org', 'auditor', 'project.manage');

-- viewer : lecture totale (y compris fil review) + commentaires partout.
-- Pas d'édition de matrice ni de NC, pas de gestion d'audit.
insert into public.role_permissions (scope, role_code, permission) values
  ('org', 'viewer', 'audit.view'),
  ('org', 'viewer', 'remediation.view'),
  ('org', 'viewer', 'chat.client.read'),
  ('org', 'viewer', 'chat.client.write'),
  ('org', 'viewer', 'chat.review.read'),
  ('org', 'viewer', 'chat.review.write');

notify pgrst, 'reload schema';

commit;
