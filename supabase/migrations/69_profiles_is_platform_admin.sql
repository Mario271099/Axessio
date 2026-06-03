-- ============================================================================
-- Axessio · Phase 6A — Préparation : `profiles.is_platform_admin`
-- ----------------------------------------------------------------------------
-- Source de vérité : ROLES_ROADMAP.md à la racine du repo.
--
-- Première étape de la bascule du système d'autorisation legacy
-- (`profiles.role`) vers le nouveau modèle org-scopé. Cette migration est
-- ADDITIVE et NON destructive — elle prépare la suite sans casser
-- l'existant.
--
-- Contenu :
--   1. Colonne `profiles.is_platform_admin boolean default false`
--   2. Backfill : true pour les profils dont role = 'admin' (super-admin Axessio)
--   3. Helper SQL `is_admin()` réécrit : lit la nouvelle colonne (plus
--      besoin d'aller via `current_role()` qui dépend du legacy enum)
--
-- Ce qui RESTE EN PLACE pour l'instant :
--   - La colonne `profiles.role` (les autres helpers et l'UI continuent à
--     lire les valeurs 'admin' | 'auditor' | 'client_admin' | 'client')
--   - Les helpers `current_role()`, `is_auditor()`, `current_client_id()`,
--     etc. — drop prévu en Phases 6B/6C/6D
--   - Toute la RLS multi-tenant qui passe par `has_org_permission` ou
--     `has_org_role` — inchangée
--
-- Côté code :
--   - Aucun changement TS ni server action dans cette migration
--   - Les phases 6B (TS), 6C (callsites legacy → org-scopés), 6D (drop)
--     viendront ensuite
--
-- Idempotente.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1) Colonne is_platform_admin
-- ----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists is_platform_admin boolean not null default false;

comment on column public.profiles.is_platform_admin is
  'Vrai pour les super-administrateurs plateforme Axessio (court-circuit RLS). '
  'Remplace progressivement profiles.role = ''admin'' — voir ROLES_ROADMAP.md.';

-- ----------------------------------------------------------------------------
-- 2) Backfill depuis le legacy `role = 'admin'`
-- ----------------------------------------------------------------------------
-- Pour qu'aucun super-admin ne perde l'accès le jour où is_admin() bascule
-- sur la nouvelle colonne, on remplit explicitement.
update public.profiles
   set is_platform_admin = true
 where role = 'admin'
   and is_platform_admin = false;

-- ----------------------------------------------------------------------------
-- 3) Réécriture du helper SQL `is_admin()` pour lire la nouvelle colonne
-- ----------------------------------------------------------------------------
-- À partir de maintenant la fonction n'a plus besoin de `current_role()`
-- (qui dépendait de l'enum legacy user_role). CREATE OR REPLACE : ne
-- casse aucune dépendance, le code applicatif et la RLS continuent à
-- tourner sans changement.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_platform_admin
       from public.profiles
      where id = auth.uid()),
    false
  );
$$;

comment on function public.is_admin() is
  'Vrai si l''utilisateur courant est super-admin plateforme. Lit '
  'profiles.is_platform_admin (Phase 6A). Court-circuit la RLS — ne '
  'l''accorder qu''au staff interne Axessio.';

notify pgrst, 'reload schema';

commit;
