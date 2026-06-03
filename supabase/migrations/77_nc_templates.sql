-- ============================================================================
-- Migration 77 : Templates de NC fréquentes
-- ----------------------------------------------------------------------------
-- Permet aux organisations de définir des modèles pré-remplis pour leurs
-- non-conformités récurrentes (contraste insuffisant, lien sans intitulé,
-- image sans alt, etc.) afin que les auditeurs gagnent du temps lors de
-- la création.
--
-- Choix de design :
--   - Scopé par organisation (pas de templates globaux pour démarrer — un
--     org peut customiser son langage métier, son ton, ses recommandations
--     types). Une future feature « marketplace de templates » pourra
--     introduire un flag is_system + une jointure orgs↔templates.
--   - `reference_id` nullable : un template peut être universel (s'applique
--     à tous les référentiels) ou ciblé sur un référentiel précis
--     (RGAA 4.1.X, WCAG 2.2, etc.).
--   - `criterion_id` nullable : un template peut suggérer un critère par
--     défaut (auto-sélectionne dans la cascade) ou rester neutre.
--   - On ne stocke PAS de page_id par défaut (les pages sont propres à
--     chaque audit, pas réutilisables entre audits).
--   - La sévérité a un défaut explicite (MEDIUM) — le picker la
--     pré-sélectionne au lieu de laisser l'utilisateur deviner.
--
-- RLS :
--   - SELECT : tous les membres de l'org (auditeurs lisent pour utiliser).
--   - INSERT/UPDATE/DELETE : admin/owner de l'org + super-admin plateforme.
--
-- Idempotente.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. Table
-- ----------------------------------------------------------------------------
create table if not exists public.nc_templates (
  id                      uuid primary key default gen_random_uuid(),
  organization_id         uuid not null references public.organizations(id) on delete cascade,
  label                   text not null,                              -- nom court affiché dans le picker
  reference_id            uuid references public.references(id) on delete cascade,
  criterion_id            uuid references public.criteria(id) on delete set null,
  severity                public.nc_severity not null default 'MEDIUM',
  title_template          text not null,
  description_template    text,
  recommendation_template text,
  created_by              uuid references public.profiles(id) on delete set null,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

comment on table public.nc_templates is
  'Templates de NC pré-remplis par organisation. Sert à pré-remplir le '
  'formulaire de création de NC. Migration 77.';

create index if not exists idx_nc_templates_org
  on public.nc_templates(organization_id);

create index if not exists idx_nc_templates_org_reference
  on public.nc_templates(organization_id, reference_id)
  where reference_id is not null;

-- Auto-bump updated_at à chaque UPDATE (pattern partagé avec d'autres
-- tables — on réutilise set_updated_at() si elle existe, sinon trigger
-- inline simple).
do $$
begin
  if exists (select 1 from pg_proc where proname = 'set_updated_at') then
    drop trigger if exists trg_nc_templates_updated_at on public.nc_templates;
    create trigger trg_nc_templates_updated_at
      before update on public.nc_templates
      for each row execute function public.set_updated_at();
  end if;
end$$;

-- ----------------------------------------------------------------------------
-- 2. RLS
-- ----------------------------------------------------------------------------
alter table public.nc_templates enable row level security;

-- Lecture : tout membre de l'org peut lister les templates. Les auditeurs
-- en ont besoin pour pré-remplir leurs NC.
drop policy if exists nc_templates_select on public.nc_templates;
create policy nc_templates_select on public.nc_templates
  for select to authenticated
  using (
    public.is_admin()
    or public.is_member_of(organization_id)
  );

-- Écriture : admin/owner de l'org seulement. Un auditor pourrait
-- techniquement vouloir contribuer mais on garde la curation à l'admin
-- pour éviter la prolifération de templates inégaux (un admin peut
-- toujours déléguer en discutant).
drop policy if exists nc_templates_manage on public.nc_templates;
create policy nc_templates_manage on public.nc_templates
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
