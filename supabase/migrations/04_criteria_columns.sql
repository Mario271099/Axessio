-- ============================================================================
-- Axessio · Extension de `criteria` pour accueillir WCAG / RAWeb / RAAM
-- ----------------------------------------------------------------------------
-- - name_en   : libellé anglais (WCAG)
-- - level     : niveau A / AA / AAA (WCAG uniquement, NULL ailleurs)
-- - principle : Perceivable / Operable / Understandable / Robust (WCAG)
-- - guideline : ex "1.1 Text Alternatives" (WCAG)
--
-- Met également à jour les versions des référentiels RAWeb et RAAM (1.1).
-- Idempotent · à exécuter en transaction unique.
-- ============================================================================

begin;

alter table public.criteria
  add column if not exists name_en   text,
  add column if not exists level     text,
  add column if not exists principle text,
  add column if not exists guideline text;

-- Le niveau WCAG est borné aux 3 valeurs officielles (NULL autorisé pour les
-- référentiels qui n'ont pas la notion de niveau — RGAA, RAWeb, RAAM).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'criteria_level_check'
  ) then
    alter table public.criteria
      add constraint criteria_level_check
      check (level is null or level in ('A', 'AA', 'AAA'));
  end if;
end$$;

update public.references
  set version = '1.1'
  where id = '44444444-4444-4444-4444-444444444444';

update public.references
  set version = '1.1'
  where id = '55555555-5555-5555-5555-555555555555';

commit;
