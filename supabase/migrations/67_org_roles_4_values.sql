-- ============================================================================
-- Axessio · Phase 2 — Rôles d'organisation : remap vers 4 valeurs utiles
-- ----------------------------------------------------------------------------
-- Source de vérité : ROLES_ROADMAP.md à la racine du repo.
--
-- Le modèle métier passe de 6 rôles à 4 :
--   Avant : owner, admin, manager, member, viewer, guest
--   Après : owner, admin, auditor, viewer
--
-- Mapping data appliqué par cette migration :
--   manager → auditor   (absorption)
--   member  → auditor   (absorption)
--   guest   → viewer    (les vrais invités passent par audit_assignees
--                        en Phase 5)
--   owner / admin / viewer inchangés
--
-- Stratégie technique — ADDITIVE :
--   - On AJOUTE la valeur 'auditor' à l'enum existant (les valeurs legacy
--     restent dans le type, mais aucune ligne ne les utilisera plus).
--   - Aucun drop de fonction ni de policy : CREATE OR REPLACE suffit pour
--     mettre à jour les bodies sans casser les dépendances.
--
-- Permissions chat split :
--   chat.read  → chat.client.read  + chat.review.read
--   chat.write → chat.client.write + chat.review.write
--
-- NB : `ALTER TYPE ... ADD VALUE` ne peut pas tourner dans une transaction
-- explicite. Cette migration ne contient PAS de BEGIN/COMMIT — Supabase
-- exécute chaque statement en autocommit, ce qui satisfait Postgres.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Ajouter 'auditor' à l'enum si nécessaire (idempotent)
-- ----------------------------------------------------------------------------
alter type public.org_role add value if not exists 'auditor';

-- ----------------------------------------------------------------------------
-- 2) Ajouter les nouvelles permissions chat et retirer les legacy
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
-- 3) Remap data : manager/member → auditor, guest → viewer
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
-- 4) Mettre à jour le default de workspace_members.role
-- ----------------------------------------------------------------------------
alter table public.workspace_members
  alter column role set default 'auditor'::public.org_role;

-- ----------------------------------------------------------------------------
-- 5) Réécrire `has_org_role` avec une hiérarchie alignée sur les 4 rôles
--    utiles. Les valeurs legacy gardent un poids de 0 (jamais satisfait).
--    CREATE OR REPLACE : ne casse aucune policy dépendante.
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
-- 6) Idem pour `has_workspace_role`
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
-- 7) Adapter quelques policies dont le seuil a changé sémantiquement
--    (l'ancien `manager` devient `auditor` — c'est-à-dire le seuil 2 dans
--    la nouvelle hiérarchie). Les autres policies utilisent 'admin' ou
--    'owner' (toujours valides).
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
-- 8) Re-seed `role_permissions` selon la matrice cible (4 rôles)
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
