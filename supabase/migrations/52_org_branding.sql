-- ============================================================================
-- Migration 52 : Custom branding (Phase 5) — colonnes branding sur organizations
-- ----------------------------------------------------------------------------
-- Ajoute le matériel pour personnaliser l'UI par organisation : logo,
-- couleurs primaires, email de support visible côté plateforme, et un
-- éventuel domaine custom (informatif pour l'instant — pas de reverse
-- proxy multi-domaine en place).
--
-- Le gating "réservé au plan Enterprise" est appliqué côté application
-- (helper `getOrgBranding()` qui retourne null si l'org n'a pas la feature
-- `branding.custom`). On stocke les valeurs même quand le plan est inférieur
-- pour ne pas perdre la config si l'org rétrograde puis revient.
--
-- Idempotente.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. Colonnes branding
-- ----------------------------------------------------------------------------
alter table public.organizations
  add column if not exists logo_url       text,
  add column if not exists primary_color  text,
  add column if not exists accent_color   text,
  add column if not exists support_email  citext,
  add column if not exists custom_domain  citext;

-- Validation léger : couleurs en format #RRGGBB (ou NULL). On reste tolérant
-- côté DB pour ne pas bloquer un parseur tiers ; la vraie validation se fait
-- côté action serveur.
alter table public.organizations
  drop constraint if exists organizations_primary_color_format;
alter table public.organizations
  add constraint organizations_primary_color_format
  check (primary_color is null or primary_color ~ '^#[0-9a-fA-F]{6}$');

alter table public.organizations
  drop constraint if exists organizations_accent_color_format;
alter table public.organizations
  add constraint organizations_accent_color_format
  check (accent_color is null or accent_color ~ '^#[0-9a-fA-F]{6}$');

-- Domaine custom unique (case-insensitive grâce à citext).
create unique index if not exists idx_organizations_custom_domain
  on public.organizations(custom_domain)
  where custom_domain is not null;

-- ----------------------------------------------------------------------------
-- 2. Helper SQL : récupère le branding de l'org courante SI le plan le permet
-- ----------------------------------------------------------------------------
-- Source de vérité côté DB pour les RPC. Le code TS a son propre helper
-- (`getOrgBranding`) qui peut faire la même requête mais en sélectionnant
-- moins de colonnes.
create or replace function public.current_org_branding()
returns table(
  logo_url       text,
  primary_color  text,
  accent_color   text,
  support_email  citext,
  custom_domain  citext
)
language sql
stable
security definer
set search_path = public
as $$
  select o.logo_url, o.primary_color, o.accent_color, o.support_email, o.custom_domain
    from public.organizations o
   where o.id = public.current_org()
     and public.org_has_feature('branding.custom');
$$;

comment on function public.current_org_branding() is
  'Retourne le branding de l''org active uniquement si son plan inclut branding.custom (sinon zéro ligne).';

notify pgrst, 'reload schema';

commit;
