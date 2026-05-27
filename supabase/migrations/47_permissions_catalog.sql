-- ============================================================================
-- Migration 47 : Permissions atomiques (Phase 3) — catalogue + mapping
-- ----------------------------------------------------------------------------
-- Brique RBAC suivante : on stocke en DB le catalogue des permissions
-- atomiques et la matrice org_role -> permissions. Le code TS (permissions.ts)
-- reste la source de vérité côté UX, mais la DB peut désormais répondre
-- atomiquement à la question : "tel utilisateur, dans son org active, a-t-il
-- la permission X ?" sans dépendre des rôles legacy.
--
-- Cette migration NE TOUCHE PAS aux policies existantes — elle ajoute
-- uniquement le matériel. La bascule des policies vers has_org_permission()
-- se fera dans une migration ultérieure, étape par étape.
--
--   permissions          → catalogue des codes (audit.view, nc.create, ...)
--   role_permissions     → mapping org_role -> permission (scope='org')
--
-- Idempotente : tous les seeds passent par ON CONFLICT.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. Catalogue des permissions atomiques
-- ----------------------------------------------------------------------------
create table if not exists public.permissions (
  code          text primary key,
  category      text not null,
  description   text not null,
  is_dangerous  boolean not null default false,
  created_at    timestamptz not null default now()
);

comment on table public.permissions is
  'Catalogue immuable des permissions atomiques. Source de vérité partagée code/DB.';

-- Seed du catalogue. Les codes doivent rester strictement alignés avec le
-- type Permission de src/lib/permissions.ts. Si tu ajoutes une permission,
-- mets à jour les deux côtés (code + DB).
insert into public.permissions (code, category, description, is_dangerous) values
  ('audit.view',                'audit',    'Consulter un audit',                                  false),
  ('audit.edit',                'audit',    'Modifier les métadonnées d''un audit',                false),
  ('audit.delete',              'audit',    'Supprimer un audit',                                  true ),
  ('audit.assign_auditor',      'audit',    'Désigner ou retirer un auditeur',                     false),
  ('matrix.edit',               'matrix',   'Modifier la matrice de conformité',                   false),
  ('nc.create',                 'nc',       'Créer une non-conformité',                            false),
  ('nc.edit',                   'nc',       'Modifier une non-conformité',                         false),
  ('nc.delete',                 'nc',       'Supprimer une non-conformité',                        true ),
  ('nc.update_status_client',   'nc',       'Mettre à jour le statut côté client (corrigé, etc.)', false),
  ('remediation.view',          'remediation','Accéder au simulateur de remédiation',              false),
  ('chat.read',                 'chat',     'Lire les commentaires',                               false),
  ('chat.write',                'chat',     'Écrire des commentaires',                             false),
  ('client.manage',             'admin',    'Gérer les clients (legacy) / organisations',          false),
  ('project.manage',            'admin',    'Gérer les projets',                                   false),
  ('user.manage',               'admin',    'Gérer les utilisateurs / membres',                    false),
  ('audit_logs.view_all',       'diag',     'Consulter le journal d''audit global',                false),
  ('impersonate',               'diag',     'Emprunter l''identité d''un autre utilisateur',       true ),
  ('permissions.debug',         'diag',     'Inspecter les permissions effectives',                false)
on conflict (code) do update
  set category     = excluded.category,
      description  = excluded.description,
      is_dangerous = excluded.is_dangerous;

-- ----------------------------------------------------------------------------
-- 2. Mapping role -> permissions
-- ----------------------------------------------------------------------------
-- Pourquoi un `scope` ? Parce qu'on aura des permissions plateforme (super
-- admin, niveau "instance"), des permissions org (le cas courant) et un jour
-- peut-être des permissions workspace. Pour l'instant on n'utilise que 'org'.
create table if not exists public.role_permissions (
  scope       text not null check (scope in ('platform','org','workspace')),
  role_code   text not null,
  permission  text not null references public.permissions(code) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (scope, role_code, permission)
);

comment on table public.role_permissions is
  'Matrice rôle -> permissions. `scope` distingue org / platform / workspace.';

create index if not exists idx_role_permissions_lookup
  on public.role_permissions(scope, role_code);

-- ----------------------------------------------------------------------------
-- 3. Seed du mapping org_role -> permissions
-- ----------------------------------------------------------------------------
-- Reset propre du scope 'org' avant insertion pour garantir que les
-- exécutions répétées restent cohérentes (sinon une permission retirée du
-- seed resterait orpheline en base).
delete from public.role_permissions where scope = 'org';

-- owner & admin : toutes les permissions
insert into public.role_permissions (scope, role_code, permission)
select 'org', r.role_code, p.code
  from (values ('owner'), ('admin')) as r(role_code)
 cross join public.permissions p;

-- manager : audit (sans delete), matrix, nc.*, remediation, chat, project.manage
insert into public.role_permissions (scope, role_code, permission) values
  ('org', 'manager', 'audit.view'),
  ('org', 'manager', 'audit.edit'),
  ('org', 'manager', 'audit.assign_auditor'),
  ('org', 'manager', 'matrix.edit'),
  ('org', 'manager', 'nc.create'),
  ('org', 'manager', 'nc.edit'),
  ('org', 'manager', 'nc.delete'),
  ('org', 'manager', 'nc.update_status_client'),
  ('org', 'manager', 'remediation.view'),
  ('org', 'manager', 'chat.read'),
  ('org', 'manager', 'chat.write'),
  ('org', 'manager', 'project.manage');

-- member : contribue à l'audit sans le supprimer
insert into public.role_permissions (scope, role_code, permission) values
  ('org', 'member', 'audit.view'),
  ('org', 'member', 'audit.edit'),
  ('org', 'member', 'matrix.edit'),
  ('org', 'member', 'nc.create'),
  ('org', 'member', 'nc.edit'),
  ('org', 'member', 'nc.update_status_client'),
  ('org', 'member', 'remediation.view'),
  ('org', 'member', 'chat.read'),
  ('org', 'member', 'chat.write');

-- viewer : lecture seule
insert into public.role_permissions (scope, role_code, permission) values
  ('org', 'viewer', 'audit.view'),
  ('org', 'viewer', 'remediation.view'),
  ('org', 'viewer', 'chat.read');

-- guest : juste l'audit auquel il est explicitement invité + status client
insert into public.role_permissions (scope, role_code, permission) values
  ('org', 'guest', 'audit.view'),
  ('org', 'guest', 'nc.update_status_client'),
  ('org', 'guest', 'remediation.view'),
  ('org', 'guest', 'chat.read'),
  ('org', 'guest', 'chat.write');

-- ----------------------------------------------------------------------------
-- 4. RLS — lecture seule, ouverte aux authentifiés (catalogue partagé)
-- ----------------------------------------------------------------------------
alter table public.permissions      enable row level security;
alter table public.role_permissions enable row level security;

drop policy if exists permissions_select on public.permissions;
create policy permissions_select on public.permissions
  for select to authenticated using (true);

drop policy if exists role_permissions_select on public.role_permissions;
create policy role_permissions_select on public.role_permissions
  for select to authenticated using (true);

-- Pas de policy d'écriture : on passe par les migrations (déploiement).

notify pgrst, 'reload schema';

commit;
