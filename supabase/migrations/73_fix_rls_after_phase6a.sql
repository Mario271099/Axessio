-- ============================================================================
-- Axessio · Fix RLS post-Phase 6A — débloque création client + audit
-- ----------------------------------------------------------------------------
-- Deux problèmes diagnostiqués sur le test de bout-en-bout :
--
-- 1. INSERT clients refusé pour les auditeurs.
--    Cause : la quick-fix Phase 0 a ajouté `client.manage` au rôle plateforme
--    `auditor` côté TS, mais la matrice SQL `role_permissions` du rôle d'ORG
--    `auditor` ne contenait pas cette permission. La policy clients_insert
--    (mig. 66) consulte `has_org_permission_on('client.manage', org_id)` qui
--    retournait false → RLS rejet.
--    Fix : on aligne la matrice SQL en ajoutant `client.manage` au rôle
--    `auditor` (org-scopé). C'est cohérent : un freelance qui est seul dans
--    son org est auditor + doit pouvoir y créer des clients.
--
-- 2. INSERT audits refusé pour le super-admin et l'auditor.
--    Cause probable : `is_admin()` a été réécrit en mig. 69 pour lire
--    `is_platform_admin` ; si le backfill `is_platform_admin = (role='admin')`
--    n'a pas matché correctement (race avec un autre re-run, ordre des mig.),
--    Mario peut se retrouver avec is_platform_admin = false. La policy
--    `audits_insert_auditor` consulte `is_auditor()` qui lui-même appelle
--    `current_role()` (legacy enum) → cascade d'incohérences.
--    Fix : on rend `is_admin()` tolérant à la transition — il retourne true
--    si is_platform_admin=true OU si role='admin' (legacy). Garantit que
--    Mario passe quoi qu'il en soit pendant la bascule progressive.
--
-- Idempotente.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1) Aligner role_permissions : auditor (org) peut gérer les clients
--    de son org. Idempotent via ON CONFLICT DO NOTHING.
-- ----------------------------------------------------------------------------
insert into public.role_permissions (scope, role_code, permission)
values ('org', 'auditor', 'client.manage')
on conflict (scope, role_code, permission) do nothing;

-- ----------------------------------------------------------------------------
-- 2) is_admin() tolérant à la transition Phase 6A → 6C
--    Garantit le super-admin pendant la double-source legacy/nouveau.
-- ----------------------------------------------------------------------------
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
  )
  or coalesce(
    (select role = 'admin'
       from public.profiles
      where id = auth.uid()),
    false
  );
$$;

comment on function public.is_admin() is
  'Vrai si l''utilisateur courant est super-admin plateforme. Pendant la '
  'transition Phase 6A→6C, on lit profiles.is_platform_admin ET on tombe '
  'sur le legacy role=''admin'' si la première colonne est false. Garantit '
  'que Mario garde son accès tout-puissant même si le backfill mig. 69 a '
  'partiellement raté.';

-- ----------------------------------------------------------------------------
-- 3) Filet de sécurité : re-applique le backfill is_platform_admin si la
--    mig. 69 n'a pas correctement marqué les super-admins.
-- ----------------------------------------------------------------------------
update public.profiles
   set is_platform_admin = true
 where role = 'admin'
   and (is_platform_admin is null or is_platform_admin = false);

notify pgrst, 'reload schema';

commit;
