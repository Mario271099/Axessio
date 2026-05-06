-- ============================================================================
-- Migration 15 : ajout du flag is_active sur les profils
-- ----------------------------------------------------------------------------
-- Permet de désactiver un utilisateur sans supprimer son compte.
-- Idempotent — peut être ré-exécutée sans danger.
-- ============================================================================

alter table public.profiles
  add column if not exists is_active boolean not null default true;

create index if not exists idx_profiles_is_active
  on public.profiles(is_active);
