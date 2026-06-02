-- ============================================================================
-- Axessio · Phase 2 — Remap data + perms (suite de la migration 67)
-- ----------------------------------------------------------------------------
-- À exécuter APRÈS migration 67 (qui a commité l'ajout de la valeur
-- 'auditor' dans l'enum org_role).
--
-- Contenu :
--   1. Permissions chat split : chat.read/chat.write → chat.client.*/review.*
--   2. Remap données : manager/member → auditor, guest → viewer
--   3. Default `auditor` sur workspace_members.role
--   4. Mise à jour des fonctions has_org_role et has_workspace_role
--      avec une hiérarchie alignée sur les 4 rôles utiles
--   5. Ré-écriture des 2 policies dont le seuil change (manager → auditor)
--   6. Re-seed `role_permissions` selon la matrice cible
--
-- Les valeurs legacy 'manager', 'member', 'guest' restent dans l'enum
-- mais aucune ligne ne les utilise plus. Le TS layer ne voit que les
-- 4 valeurs cibles.
--
-- Idempotente. Transaction explicite.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1) Permissions chat split
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

delete from public.permissions where code in ('chat.read', 'chat.write');

-- ----------------------------------------------------------------------------
-- 2) Remap data : manager/member → auditor, guest → viewer
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
-- 3) Default `auditor` sur workspace_members.role
-- ----------------------------------------------------------------------------
alter table public.workspace_members
  alter column role set default 'auditor'::public.org_role;

-- ----------------------------------------------------------------------------
-- 4) `has_org_role` — hiérarchie alignée sur 4 rôles
--    CREATE OR REPLACE ne casse aucune policy dépendante.
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

-- ----------------------------------------------------------------------------
-- 5) `has_workspace_role` — hiérarchie alignée sur 4 rôles
-- ----------------------------------------------------------------------------
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
      ('viewer'::public.org_role,  1),
      ('auditor'::public.org_role, 2),
      ('admin'::public.org_role,   3),
      ('owner'::public.org_role,   4)
  ),
  ws as (
    select organization_id from public.workspaces where id = p_workspace_id
  ),
  my_role as (
    select m.role
      from ws, public.organization_members m
     where m.organization_id = ws.organization_id
       and m.user_id = auth.uid()
       and m.role in ('owner','admin')
    union all
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

-- ----------------------------------------------------------------------------
-- 6) Réécriture des policies dont le seuil sémantique change
--    'manager' (legacy) → 'auditor' (nouveau)
-- ----------------------------------------------------------------------------
drop policy if exists org_members_select on public.organization_members;
create policy org_members_select on public.organization_members
  for select to authenticated
  using (
    public.is_admin()
    or user_id = auth.uid()
    or public.has_org_role(organization_id, 'auditor')
  );

drop policy if exists workspace_members_select on public.workspace_members;
create policy workspace_members_select on public.workspace_members
  for select to authenticated
  using (
    public.is_admin()
    or user_id = auth.uid()
    or public.has_workspace_role(workspace_id, 'auditor')
  );

-- ----------------------------------------------------------------------------
-- 7) Re-seed `role_permissions` selon la matrice cible (4 rôles)
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
insert into public.role_permissions (scope, role_code, permission) values
  ('org', 'viewer', 'audit.view'),
  ('org', 'viewer', 'remediation.view'),
  ('org', 'viewer', 'chat.client.read'),
  ('org', 'viewer', 'chat.client.write'),
  ('org', 'viewer', 'chat.review.read'),
  ('org', 'viewer', 'chat.review.write');

notify pgrst, 'reload schema';

commit;
