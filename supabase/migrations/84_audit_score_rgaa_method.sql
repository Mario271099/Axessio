-- ============================================================================
-- Axessyo · Score temps reel aligne sur la methode officielle RGAA
-- ----------------------------------------------------------------------------
-- La migration 38 comptait des CASES page x critere : C / (C + NC). Or la
-- methode DINUM (accessibilite.numerique.gouv.fr/obligations/evaluation-conformite)
-- raisonne PAR CRITERE sur tout l'echantillon :
--   - un critere est non conforme des qu'il echoue sur une page ;
--   - il est valide s'il est valide (ou non applicable) sur toutes les pages ;
--   - il est non applicable seulement s'il l'est sur toutes les pages ;
--   taux global = criteres valides / criteres applicables.
--
-- Audit en cours : un critere sans echec mais non saisi sur toutes les pages
-- n'est pas encore determine et sort du calcul (miroir de computeRgaaRates
-- dans src/lib/score.ts). Renvoie NULL si aucun critere n'est determine.
--
-- Meme signature que la migration 38 : aucun appelant a modifier.
-- Idempotente.
-- ============================================================================

begin;

create or replace function public.audit_current_score(p_audit_id uuid)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  with nb_pages as (
    select count(*)::int as n from public.pages where audit_id = p_audit_id
  ),
  per_criterion as (
    select
      pc.criteria_id,
      count(*)::int                                            as nb_cells,
      count(*) filter (where pc.status = 'NON_COMPLIANT')::int as nb_nc,
      count(*) filter (where pc.status = 'NOT_APPLICABLE')::int as nb_na
    from public.page_conformities pc
    join public.pages p on p.id = pc.page_id and p.audit_id = p_audit_id
    where pc.audit_id = p_audit_id
    group by pc.criteria_id
  ),
  results as (
    select case
      when nb_nc > 0 then 'NC'
      when nb_cells < (select n from nb_pages) then 'PENDING'
      when nb_na = nb_cells then 'NA'
      else 'C'
    end as result
    from per_criterion
  ),
  counts as (
    select
      count(*) filter (where result = 'C')::int  as nb_c,
      count(*) filter (where result = 'NC')::int as nb_nc
    from results
  )
  select case
    when nb_c + nb_nc = 0 then null
    else round(100.0 * nb_c / (nb_c + nb_nc), 2)
  end
  from counts;
$$;

notify pgrst, 'reload schema';

commit;
