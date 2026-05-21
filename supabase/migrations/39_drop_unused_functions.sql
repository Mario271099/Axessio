-- ============================================================================
-- Migration 39 : suppression des fonctions SQL inutilisées
-- ----------------------------------------------------------------------------
-- Audit complet du code TS : aucune des deux fonctions ci-dessous n'est
-- appelée — ni via `supabase.rpc()`, ni depuis une autre fonction SQL ou
-- policy. Elles ont été ajoutées en prévision d'usages qui ne se sont pas
-- concrétisés.
--
--   - `audit_sample_representative_count(uuid)` (migration 32) — le calcul
--     a été intégré inline dans `audit_status_lifecycle_view`, rendant
--     cette fonction redondante.
--
--   - `is_assigned_to_audit(uuid)` (migration 25) — helper pensé pour des
--     checks granulaires côté policy. Aucune policy ni server action ne
--     l'utilise au final.
--
-- Idempotente.
-- ============================================================================

begin;

drop function if exists public.audit_sample_representative_count(uuid);
drop function if exists public.is_assigned_to_audit(uuid);

notify pgrst, 'reload schema';

commit;
