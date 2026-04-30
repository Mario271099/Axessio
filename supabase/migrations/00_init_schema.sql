-- ============================================================================
-- Axessio · Schéma de base de données
-- ----------------------------------------------------------------------------
-- Multi-tenant. Tout est isolé par client_id sauf les ressources globales
-- (références, critères, etc).
-- ============================================================================

-- Extensions ------------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Énumérations ----------------------------------------------------------------
create type user_role as enum ('auditor', 'client_admin', 'client_member');

create type platform_type as enum ('WEB', 'MOBILE');

create type reference_type as enum (
  'RGAA',     -- France
  'WCAG',     -- International
  'RAWeb',    -- Mauritanie / Afrique francophone
  'RAAM',     -- Mobile (référentiel applications mobile)
  'PDF_UA',
  'EN_301_549'
);

create type service_type as enum (
  'AUDIT',              -- audit standard avec contre-audit
  'NO_COUNTER_AUDIT',   -- audit sans contre-audit
  'COMPLIANCE_AUDIT'    -- audit de conformité simple
);

create type audit_status as enum (
  'PENDING',
  'PLANNED',
  'IN_PROGRESS',
  'DELIVERED',
  'REMEDIATION',
  'COUNTER_AUDIT',
  'ONLINE',
  'COMPLETED',
  'ARCHIVED'
);

create type page_type as enum ('MANDATORY', 'REPRESENTATIVE', 'TRANSVERSAL');

create type complexity_level as enum ('ULTRA_SIMPLE', 'SIMPLE', 'MINIMAL', 'COMPLEX');

create type conformity_status as enum ('COMPLIANT', 'NON_COMPLIANT', 'NOT_APPLICABLE');

create type nc_severity as enum ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

create type nc_status as enum (
  'OPEN',
  'IN_PROGRESS',
  'CORRECTED',
  'NON_REPRODUCIBLE',
  'RESOLVED',
  'REJECTED',
  'CANCELLED'
);

create type disability_type as enum ('VISUAL', 'COGNITIVE', 'AUDITORY', 'MOTOR');

-- ============================================================================
-- Table 1 : clients (organisations)
-- ============================================================================
create table public.clients (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,
  contract_start_at timestamptz not null default now(),
  logo_url      text,
  has_subscription boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================================
-- Table 2 : profiles (extension de auth.users)
-- ----------------------------------------------------------------------------
-- Supabase Auth gère les credentials. On étend chaque user avec un profil.
-- ============================================================================
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null unique,
  first_name    text not null,
  last_name     text not null,
  role          user_role not null default 'client_member',
  client_id     uuid references public.clients(id) on delete cascade,  -- null pour les auditeurs internes
  language      text not null default 'fr',
  last_login_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint auditor_has_no_client check (
    (role = 'auditor' and client_id is null)
    or (role <> 'auditor' and client_id is not null)
  )
);

create index idx_profiles_client_id on public.profiles(client_id);
create index idx_profiles_role on public.profiles(role);

-- ============================================================================
-- Table 3 : projects (sites/apps à auditer, appartiennent à un client)
-- ============================================================================
create table public.projects (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references public.clients(id) on delete cascade,
  name          text not null,
  url           text,
  logo_url      text,
  account_manager_id uuid references public.profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_projects_client_id on public.projects(client_id);

-- ============================================================================
-- Table 4 : project_members (membres client_member assignés à un projet)
-- ============================================================================
create table public.project_members (
  project_id    uuid not null references public.projects(id) on delete cascade,
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  primary key (project_id, profile_id)
);

-- ============================================================================
-- Tables 5-8 : référentiels (données globales partagées)
-- ============================================================================
create table public.references (
  id            uuid primary key default gen_random_uuid(),
  type          reference_type not null,
  version       text not null,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  unique(type, version)
);

create table public.thematics (
  id            uuid primary key default gen_random_uuid(),
  reference_id  uuid not null references public.references(id) on delete cascade,
  identifier    text not null,                    -- ex: "1", "2"
  name          text not null,                    -- ex: "Images", "Cadres"
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  unique(reference_id, identifier)
);

create table public.criteria (
  id            uuid primary key default gen_random_uuid(),
  thematic_id   uuid not null references public.thematics(id) on delete cascade,
  identifier    text not null,                    -- ex: "1.1"
  name          text not null,                    -- libellé du critère
  url           text,                             -- lien vers la doc officielle
  disabilities  disability_type[] not null default '{}',
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  unique(thematic_id, identifier)
);

create index idx_criteria_thematic on public.criteria(thematic_id);

create table public.tests (
  id            uuid primary key default gen_random_uuid(),
  criteria_id   uuid not null references public.criteria(id) on delete cascade,
  identifier    text not null,                    -- ex: "1.1.1"
  name          text not null,
  sort_order    int not null default 0,
  unique(criteria_id, identifier)
);

-- ============================================================================
-- Table 9 : audits
-- ============================================================================
create table public.audits (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  reference_id  uuid not null references public.references(id),
  service_type  service_type not null default 'AUDIT',
  platform      platform_type not null default 'WEB',
  status        audit_status not null default 'PENDING',
  language      text not null default 'fr',

  -- Planning
  expected_start_at  timestamptz,
  expected_end_at    timestamptz,
  delivered_at       timestamptz,
  online_at          timestamptz,

  -- Scoring
  initial_score float,           -- score à la livraison initiale
  final_score   float,           -- score post-remédiation
  accessibility_link text,       -- URL de la page d'accessibilité du site

  -- Métadonnées
  custom_fields jsonb not null default '[]',
  notes         text,

  created_by    uuid references public.profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_audits_project on public.audits(project_id);
create index idx_audits_status on public.audits(status);

-- ============================================================================
-- Table 10 : audit_assignees (auditeurs assignés à un audit)
-- ============================================================================
create table public.audit_assignees (
  audit_id      uuid not null references public.audits(id) on delete cascade,
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  role          text not null default 'auditor',  -- auditor | proofreader | contact
  primary key (audit_id, profile_id, role)
);

-- ============================================================================
-- Table 11 : pages (échantillon)
-- ============================================================================
create table public.pages (
  id            uuid primary key default gen_random_uuid(),
  audit_id      uuid not null references public.audits(id) on delete cascade,
  name          text not null,
  url           text,
  page_type     page_type not null default 'REPRESENTATIVE',
  complexity    complexity_level,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);

create index idx_pages_audit on public.pages(audit_id);

-- ============================================================================
-- Table 12 : page_conformities (statut conformité par critère et par page)
-- ============================================================================
create table public.page_conformities (
  id            uuid primary key default gen_random_uuid(),
  audit_id      uuid not null references public.audits(id) on delete cascade,
  page_id       uuid not null references public.pages(id) on delete cascade,
  criteria_id   uuid not null references public.criteria(id) on delete cascade,
  status        conformity_status not null,
  updated_at    timestamptz not null default now(),
  unique(page_id, criteria_id)
);

create index idx_conformities_audit on public.page_conformities(audit_id);
create index idx_conformities_page on public.page_conformities(page_id);

-- ============================================================================
-- Table 13 : non_conformities
-- ============================================================================
create table public.non_conformities (
  id            uuid primary key default gen_random_uuid(),
  audit_id      uuid not null references public.audits(id) on delete cascade,
  page_id       uuid references public.pages(id) on delete set null,  -- null = transversal
  criteria_id   uuid not null references public.criteria(id),
  test_id       uuid references public.tests(id),
  identifier    text,                                                  -- ex: "LIN001"
  title         text not null,
  description   text,
  recommendation text,
  external_reference text,                                              -- lien vers design system, etc
  severity      nc_severity not null default 'MEDIUM',
  status        nc_status not null default 'OPEN',
  created_by    uuid references public.profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_nc_audit on public.non_conformities(audit_id);
create index idx_nc_page on public.non_conformities(page_id);
create index idx_nc_criteria on public.non_conformities(criteria_id);
create index idx_nc_status on public.non_conformities(status);

-- ============================================================================
-- Table 14 : nc_attachments (pièces jointes des NC : captures, vidéos)
-- ============================================================================
create table public.nc_attachments (
  id            uuid primary key default gen_random_uuid(),
  non_conformity_id uuid not null references public.non_conformities(id) on delete cascade,
  storage_path  text not null,             -- path dans Supabase Storage
  mime_type     text,
  size_bytes    bigint,
  kind          text not null default 'result',  -- result | recommendation
  created_at    timestamptz not null default now()
);

-- ============================================================================
-- Triggers : maintenance des updated_at
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_clients_updated before update on public.clients
  for each row execute function public.set_updated_at();
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trg_projects_updated before update on public.projects
  for each row execute function public.set_updated_at();
create trigger trg_audits_updated before update on public.audits
  for each row execute function public.set_updated_at();
create trigger trg_nc_updated before update on public.non_conformities
  for each row execute function public.set_updated_at();
create trigger trg_pc_updated before update on public.page_conformities
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Auto-création du profil à l'inscription
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name, role, client_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'client_member'),
    nullif(new.raw_user_meta_data->>'client_id', '')::uuid
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
