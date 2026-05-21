-- ============================================================================
-- Migration 40 : suppression complète du workflow éditorial
-- ----------------------------------------------------------------------------
-- Le workflow éditorial (`draft / in_review / validated / delivered`) ajouté
-- par les migrations 24, 27, 28 s'est révélé sans valeur métier — il
-- doublonnait `audit_status` côté lifecycle et le cycle de relecture par NC
-- (migration 33) côté revue.
--
-- On supprime :
--   - colonnes `audits.workflow_status` + `audits.workflow_changed_at`
--   - enum `audit_workflow_status`
--   - trigger + fonction `log_audit_workflow_change`
--   - RPCs `audits_workflow_breakdown` + `audits_avg_review_time_seconds`
--   - index `idx_audits_workflow_status` + `idx_audits_workflow_changed_at`
--
-- On CONSERVE :
--   - la table `audit_logs` (utilisée par les autres flux : assignees,
--     proofreaders, status lifecycle, nc.review_*)
--   - les rôles d'assignation (auditor + proofreader) — ils restent utiles
--     pour la relecture par NC, qui est séparée du workflow éditorial
--   - les anciennes entrées `audit_logs` de type `workflow.*` — historique
--     préservé en lecture seule
--   - les anciennes notifications de type `workflow.*` — historique idem
--
-- Idempotente.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. Drop triggers + fonction de log
-- ----------------------------------------------------------------------------
drop trigger if exists trg_log_audit_workflow on public.audits;
drop function if exists public.log_audit_workflow_change();

-- ----------------------------------------------------------------------------
-- 2. Drop RPCs liés au breakdown workflow + temps moyen de relecture
-- ----------------------------------------------------------------------------
drop function if exists public.audits_workflow_breakdown();
drop function if exists public.audits_avg_review_time_seconds();

-- ----------------------------------------------------------------------------
-- 3. Drop indexes liés
-- ----------------------------------------------------------------------------
drop index if exists public.idx_audits_workflow_status;
drop index if exists public.idx_audits_workflow_changed_at;

-- ----------------------------------------------------------------------------
-- 4. Drop colonnes
-- ----------------------------------------------------------------------------
alter table public.audits drop column if exists workflow_status;
alter table public.audits drop column if exists workflow_changed_at;

-- ----------------------------------------------------------------------------
-- 5. Drop enum (après que toutes les colonnes l'utilisant aient été drop)
-- ----------------------------------------------------------------------------
drop type if exists public.audit_workflow_status;

notify pgrst, 'reload schema';

commit;
