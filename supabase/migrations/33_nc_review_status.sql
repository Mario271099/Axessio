-- ============================================================================
-- Migration 33 : statut de relecture par NC + traçabilité
-- ----------------------------------------------------------------------------
-- Ajoute le cycle de relecture interne sur chaque non-conformité :
--
--   not_requested → pending → under_review → (changes_requested | approved)
--
-- Cf. spec "Demande de relecture sur une NC". Idempotente.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. Enum dédié au statut de relecture
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'nc_review_status') then
    create type public.nc_review_status as enum (
      'not_requested',
      'pending',
      'under_review',
      'changes_requested',
      'approved'
    );
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 2. Colonnes sur non_conformities
-- ----------------------------------------------------------------------------
alter table public.non_conformities
  add column if not exists review_status public.nc_review_status
    not null default 'not_requested',
  add column if not exists review_requested_at timestamptz,
  add column if not exists review_requested_by uuid
    references public.profiles(id) on delete set null,
  add column if not exists review_resolved_at timestamptz,
  add column if not exists review_resolved_by uuid
    references public.profiles(id) on delete set null;

-- Index pour les vues "à relire" (filtre dashboard relecteur).
create index if not exists idx_nc_review_status
  on public.non_conformities(review_status)
  where review_status in ('pending', 'under_review', 'changes_requested');

-- ----------------------------------------------------------------------------
-- 3. Trigger : édition de fond d'une NC `approved` ⇒ retour à `pending`
-- ----------------------------------------------------------------------------
-- Quand un auditeur modifie le contenu d'une NC déjà validée, on annule la
-- relecture précédente automatiquement. Critères "modification de fond" :
--   title, description, actual_result, recommendation, severity.
-- Les autres colonnes (statut NC, page, status, etc.) ne déclenchent PAS.
create or replace function public.invalidate_nc_review_on_edit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'UPDATE'
      and old.review_status = 'approved'
      and (
        coalesce(new.title, '')          is distinct from coalesce(old.title, '')
        or coalesce(new.description, '') is distinct from coalesce(old.description, '')
        or coalesce(new.actual_result, '') is distinct from coalesce(old.actual_result, '')
        or coalesce(new.recommendation, '') is distinct from coalesce(old.recommendation, '')
        or new.severity is distinct from old.severity
      ))
  then
    new.review_status := 'pending';
    new.review_requested_at := now();
    new.review_resolved_at := null;
    new.review_resolved_by := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_invalidate_nc_review_on_edit on public.non_conformities;
create trigger trg_invalidate_nc_review_on_edit
  before update on public.non_conformities
  for each row execute function public.invalidate_nc_review_on_edit();

notify pgrst, 'reload schema';

commit;
