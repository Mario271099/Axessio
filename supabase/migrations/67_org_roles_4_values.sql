-- ============================================================================
-- Axessio · Phase 2 — Ajout de la valeur 'auditor' à l'enum org_role
-- ----------------------------------------------------------------------------
-- Source de vérité : ROLES_ROADMAP.md à la racine du repo.
--
-- Cette migration est isolée parce que `ALTER TYPE ... ADD VALUE` ne peut
-- pas tourner dans une transaction explicite ET la nouvelle valeur doit
-- être commitée avant d'être utilisée (Postgres : "unsafe use of new
-- value, new enum values must be committed before they can be used").
--
-- La migration 68 réutilise la valeur 'auditor' pour le remap des données,
-- la mise à jour des fonctions, et le re-seed de role_permissions.
--
-- Pas de BEGIN/COMMIT explicite : Supabase exécute en autocommit, ce qui
-- satisfait la contrainte Postgres pour ADD VALUE.
-- ============================================================================

alter type public.org_role add value if not exists 'auditor';
