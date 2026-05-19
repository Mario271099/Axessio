-- ============================================================================
-- Migration 21 : ajoute le test précis qui a déclenché une non-conformité.
-- ----------------------------------------------------------------------------
-- Chaque critère officiel (RGAA / WCAG / RAWeb / RAAM) est subdivisé en un
-- ou plusieurs tests numérotés (`Test 1.1.1`, `Test 1.1.2`...). Jusqu'ici on
-- ne stockait que le critère ; on ajoute désormais la référence textuelle du
-- test source pour la traçabilité (rapport PDF, fil de discussion, audit).
--
-- Idempotente.
-- ============================================================================

begin;

alter table public.non_conformities
  add column if not exists test_reference text;

notify pgrst, 'reload schema';

commit;
