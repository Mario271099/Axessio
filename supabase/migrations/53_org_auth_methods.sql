-- ============================================================================
-- Migration 53 : SSO/SCIM (Phase 5) — schéma org_auth_methods (placeholder)
-- ----------------------------------------------------------------------------
-- Pose la table qui stockera les configurations d'authentification par org
-- (SAML, OIDC, social, etc.). Aucune UI n'est livrée à cette étape — le
-- branchement réel avec un fournisseur d'identité (WorkOS, Auth0, ou la
-- SAML native de Supabase) sera fait dans une migration ultérieure quand
-- le fournisseur sera choisi.
--
-- La colonne `config` est un jsonb opaque : son schéma dépend du provider
-- (entityID, metadataURL, certificat, client_id/secret OIDC, etc.) et n'a
-- pas vocation à être typé côté DB. Le code applicatif chiffrera les
-- secrets sensibles avant insertion (cf. KMS / pgsodium quand activé).
--
-- Idempotente.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. Enum des providers
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'auth_provider') then
    create type public.auth_provider as enum (
      'password',   -- défaut Supabase
      'saml',       -- SSO entreprise via SAML 2.0
      'oidc',       -- SSO via OpenID Connect
      'google',     -- social login Google
      'microsoft',  -- social login Microsoft
      'scim'        -- provisioning SCIM (pas réellement une méthode de login)
    );
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 2. Table principale
-- ----------------------------------------------------------------------------
create table if not exists public.org_auth_methods (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  provider          public.auth_provider not null,
  is_enabled        boolean not null default false,
  is_default        boolean not null default false,
  display_name      text,
  metadata_url      text,     -- pour SAML/OIDC
  config            jsonb not null default '{}'::jsonb,
  -- Domaine d'email qui force l'utilisation de cette méthode (ex: "@acme.com"
  -- redirige automatiquement vers le SSO SAML d'Acme). NULL = pas de routing.
  email_domain      citext,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Un seul provider 'default' par org.
create unique index if not exists idx_org_auth_methods_one_default
  on public.org_auth_methods(organization_id)
  where is_default = true;

create index if not exists idx_org_auth_methods_org
  on public.org_auth_methods(organization_id);

create index if not exists idx_org_auth_methods_email_domain
  on public.org_auth_methods(email_domain)
  where email_domain is not null;

drop trigger if exists trg_org_auth_methods_set_updated_at on public.org_auth_methods;
create trigger trg_org_auth_methods_set_updated_at
  before update on public.org_auth_methods
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 3. RLS — lecture/écriture réservée aux admins/owners de l'org
-- ----------------------------------------------------------------------------
alter table public.org_auth_methods enable row level security;

drop policy if exists org_auth_methods_select on public.org_auth_methods;
create policy org_auth_methods_select on public.org_auth_methods
  for select to authenticated
  using (
    public.is_admin()
    or public.has_org_role(organization_id, 'admin')
  );

drop policy if exists org_auth_methods_manage on public.org_auth_methods;
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

notify pgrst, 'reload schema';

commit;
