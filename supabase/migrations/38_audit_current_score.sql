-- ============================================================================
-- Migration 38 : RPC audit_current_score(audit_id)
-- ----------------------------------------------------------------------------
-- Calcule le score de conformité en TEMPS RÉEL à partir de page_conformities.
-- Formule RGAA officielle (cf. src/lib/score.ts) :
--
--   score = nb_compliant / (nb_compliant + nb_non_compliant) * 100
--
-- Les cellules NOT_APPLICABLE et non remplies sont exclues du dénominateur.
-- Renvoie NULL si le dénominateur vaut 0 (audit vierge → "—" côté UI).
--
-- SECURITY DEFINER : bypasse les policies sur page_conformities pour pouvoir
-- agréger même quand la RLS pourrait restreindre. La fonction est sûre car
-- elle ne lit qu'un audit identifié et ne retourne qu'un agrégat numérique.
-- ============================================================================

begin;

drop function if exists public.audit_current_score(uuid);
create or replace function public.audit_current_score(p_audit_id uuid)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  with t as (
    select
      count(*) filter (where status = 'COMPLIANT')::int     as nb_compliant,
      count(*) filter (where status = 'NON_COMPLIANT')::int as nb_non_compliant
    from public.page_conformities
    where audit_id = p_audit_id
  )
  select case
    when (nb_compliant + nb_non_compliant) = 0 then null
    else round(100.0 * nb_compliant / (nb_compliant + nb_non_compliant), 2)
  end
  from t;
$$;

notify pgrst, 'reload schema';

commit;
