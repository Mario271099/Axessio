-- ============================================================================
-- Migration 32 : RPCs pour le cycle de vie audit_status
-- ----------------------------------------------------------------------------
-- Spec : T1 PENDING → PLANNED (≥ 1 page représentative)
--        T2 PLANNED → IN_PROGRESS (start_date ≤ today)
--        T3 IN_PROGRESS → DELIVERED (matrice 100 %)
--        T4 DELIVERED → REMEDIATION (auto, J+7 livraison)
--
-- On expose 2 RPCs SECURITY DEFINER pour que les server actions calculent
-- les pré-conditions de transition côté Postgres (rapide + RLS-aware).
--
-- Idempotente.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. audit_matrix_completion(audit_id) : taux de complétion de la matrice
-- ----------------------------------------------------------------------------
-- Renvoie nb_pages, nb_criteria, nb_filled, nb_total, percent.
-- "Cellule remplie" = ligne page_conformities avec status non NULL et ∈
-- {COMPLIANT, NON_COMPLIANT, NOT_APPLICABLE}.
--
-- SECURITY DEFINER pour bypasser RLS dans les sous-requêtes (sinon RLS sur
-- pages/criteria/page_conformities peut interférer). L'auditId est validé
-- côté server action avant l'appel.
drop function if exists public.audit_matrix_completion(uuid);
create or replace function public.audit_matrix_completion(p_audit_id uuid)
returns table(
  nb_pages    integer,
  nb_criteria integer,
  nb_filled   integer,
  nb_total    integer,
  percent     numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with t as (
    select
      (select count(*)::int from public.pages where audit_id = p_audit_id)
        as nb_pages,
      (select count(*)::int from public.criteria c
         join public.thematics th on th.id = c.thematic_id
         where th.reference_id = (
           select reference_id from public.audits where id = p_audit_id
         )
      ) as nb_criteria,
      (select count(*)::int from public.page_conformities
         where audit_id = p_audit_id
           and status in ('COMPLIANT', 'NON_COMPLIANT', 'NOT_APPLICABLE')
      ) as nb_filled
  )
  select
    nb_pages,
    nb_criteria,
    nb_filled,
    (nb_pages * nb_criteria) as nb_total,
    case
      when nb_pages = 0 or nb_criteria = 0 then 0::numeric
      else round(100.0 * nb_filled / (nb_pages * nb_criteria), 2)
    end as percent
  from t;
$$;

-- ----------------------------------------------------------------------------
-- 2. audit_sample_representative_count(audit_id)
-- ----------------------------------------------------------------------------
-- Count des pages REPRESENTATIVE pour cet audit. Utilisé pour T1.
drop function if exists public.audit_sample_representative_count(uuid);
create or replace function public.audit_sample_representative_count(p_audit_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
    from public.pages
   where audit_id = p_audit_id
     and page_type = 'REPRESENTATIVE';
$$;

-- ----------------------------------------------------------------------------
-- 3. audit_status_lifecycle_view(audit_id) : tout en une requête
-- ----------------------------------------------------------------------------
-- Vue de commodité retournant tout ce dont la page détail audit a besoin
-- pour calculer les transitions disponibles, en un seul aller-retour réseau.
drop function if exists public.audit_status_lifecycle_view(uuid);
create or replace function public.audit_status_lifecycle_view(p_audit_id uuid)
returns table(
  representative_count integer,
  matrix_filled        integer,
  matrix_total         integer,
  matrix_percent       numeric,
  start_date_set       boolean,
  start_date_reached   boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with rep as (
    select count(*)::int as n
      from public.pages
      where audit_id = p_audit_id and page_type = 'REPRESENTATIVE'
  ),
  matrix as (
    select * from public.audit_matrix_completion(p_audit_id)
  ),
  a as (
    select expected_start_at from public.audits where id = p_audit_id
  )
  select
    rep.n,
    matrix.nb_filled,
    matrix.nb_total,
    matrix.percent,
    (a.expected_start_at is not null),
    (a.expected_start_at is not null
       and a.expected_start_at::date <= current_date)
  from rep, matrix, a;
$$;

notify pgrst, 'reload schema';

commit;
