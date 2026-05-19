-- ============================================================================
-- Migration 23 : refactor des rôles + audit_logs (Phase 1 du chantier RBAC)
-- ----------------------------------------------------------------------------
-- Avant : enum user_role = ('auditor', 'client_admin', 'client_member')
-- Après : enum user_role = ('admin', 'auditor', 'client_admin', 'client')
--
--   - 'client_member' renommé en 'client' (in-place, conserve les FK & data).
--   - 'admin' ajouté pour la super-admin plateforme.
--   - `is_auditor()` étendu pour inclure 'admin' : toutes les policies RLS
--     existantes héritent automatiquement de l'accès admin sans churn.
--   - Nouveau helper `is_admin()` pour les checks stricts (impersonation,
--     gestion utilisateurs).
--   - Nouvelle table `audit_logs` pour l'historique des actions (workflow,
--     impersonation, etc., utilisée plus tard dans la Phase 3).
--
-- IMPORTANT — découpage en 2 transactions :
-- Postgres interdit `ALTER TYPE ... ADD VALUE` puis utilisation immédiate de
-- cette valeur dans la même transaction (erreur 55P04 "unsafe use of new
-- value"). On commit donc d'abord les modifs d'enum, puis on les utilise.
--
-- Idempotente.
-- ============================================================================

-- ============================================================================
-- Transaction 1 : modifications d'enum (à committer avant d'être utilisées)
-- ============================================================================
begin;

-- ALTER TYPE ... RENAME VALUE : in-place, met à jour toutes les colonnes
-- typées user_role sans toucher les lignes (PG 12+).
do $$
begin
  if exists (
    select 1 from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'user_role' and e.enumlabel = 'client_member'
  ) then
    alter type public.user_role rename value 'client_member' to 'client';
  end if;
end $$;

alter type public.user_role add value if not exists 'admin';

commit;

-- ============================================================================
-- Transaction 2 : fonctions, triggers, table audit_logs (utilisent 'admin'/'client')
-- ============================================================================
begin;

-- Nouveau défaut sur profiles.role (après le rename, 'client' existe).
alter table public.profiles alter column role set default 'client';

-- ----------------------------------------------------------------------------
-- Triggers / fonctions qui référençaient 'client_member'
-- ----------------------------------------------------------------------------

-- handle_new_user : fallback role passe de 'client_member' à 'client'.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name, role, client_id, email_confirmed_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'client'),
    nullif(new.raw_user_meta_data->>'client_id', '')::uuid,
    new.email_confirmed_at
  );
  return new;
end;
$$;

-- notify_on_nc_message : on utilise désormais 'client' au lieu de 'client_member'.
create or replace function public.notify_on_nc_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_audit_id uuid;
  v_client_id uuid;
  v_nc_creator uuid;
begin
  select nc.audit_id, nc.created_by
    into v_audit_id, v_nc_creator
    from public.non_conformities nc
   where nc.id = new.non_conformity_id;

  select p.client_id into v_client_id
    from public.audits a
    join public.projects p on p.id = a.project_id
   where a.id = v_audit_id;

  insert into public.notifications
    (user_id, type, audit_id, nc_id, message_id, sender_id)
  select distinct prof.id,
         'nc_message',
         v_audit_id,
         new.non_conformity_id,
         new.id,
         new.author_id
    from public.profiles prof
   where prof.id != new.author_id
     and (
       prof.id = v_nc_creator
       or (
         prof.client_id = v_client_id
         and prof.role in ('client_admin', 'client')
       )
     );

  return new;
end;
$$;

-- accessible_project_ids : 'client_member' renommé en 'client' partout.
create or replace function public.accessible_project_ids()
returns table(project_id uuid)
language sql stable
as $$
  select p.id
  from public.projects p
  where
    public.is_auditor()                                                                    -- auditeur + admin
    or (public.current_role() = 'client_admin' and p.client_id = public.current_client_id())
    or (public.current_role() = 'client' and exists (
        select 1 from public.project_members pm
        where pm.project_id = p.id and pm.profile_id = auth.uid()
    ))
$$;

-- ----------------------------------------------------------------------------
-- Helpers RLS
-- ----------------------------------------------------------------------------

-- Strict : current_role() = 'admin'. Utilisé là où on veut spécifiquement
-- discriminer l'admin (impersonation, gestion utilisateurs, audit_logs global).
create or replace function public.is_admin()
returns boolean
language sql stable
as $$
  select coalesce(public.current_role() = 'admin', false);
$$;

-- is_auditor étendu : admin a TOUT ce que peut faire un auditeur.
-- Conséquence : toutes les policies utilisant `is_auditor()` accordent
-- automatiquement les mêmes droits aux admins, pas de churn.
create or replace function public.is_auditor()
returns boolean
language sql stable
as $$
  select coalesce(public.current_role() in ('auditor', 'admin'), false);
$$;

-- ----------------------------------------------------------------------------
-- Table audit_logs : historique des actions
-- ----------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  audit_id    uuid references public.audits(id) on delete cascade,
  actor_id    uuid references public.profiles(id) on delete set null,
  actor_role  text,
  action      text not null,
  payload     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists idx_audit_logs_audit_created
  on public.audit_logs(audit_id, created_at desc);
create index if not exists idx_audit_logs_actor
  on public.audit_logs(actor_id);
create index if not exists idx_audit_logs_action
  on public.audit_logs(action, created_at desc);

alter table public.audit_logs enable row level security;

drop policy if exists audit_logs_select on public.audit_logs;

create policy audit_logs_select on public.audit_logs
  for select to authenticated
  using (
    public.is_admin()
    or audit_id in (
      select id from public.audits
      where project_id in (select project_id from public.accessible_project_ids())
    )
  );

-- Pas de policy INSERT/UPDATE/DELETE côté public : seuls les server actions
-- et triggers SECURITY DEFINER insèrent. Les logs sont append-only.

notify pgrst, 'reload schema';

commit;
