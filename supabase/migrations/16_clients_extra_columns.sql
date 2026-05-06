-- ============================================================================
-- Migration 16 : colonnes supplémentaires sur clients
-- ----------------------------------------------------------------------------
-- Ajoute website, contact_email, contact_name pour la fiche client détaillée.
-- Idempotente — peut être ré-exécutée sans danger.
-- ============================================================================

begin;

alter table public.clients
  add column if not exists website       text,
  add column if not exists contact_email text,
  add column if not exists contact_name  text;

commit;
