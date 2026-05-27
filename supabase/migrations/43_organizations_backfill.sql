-- ============================================================================
-- Migration 43 : backfill des organisations depuis les données existantes
-- ----------------------------------------------------------------------------
-- Stratégie :
--   1. Une org "Axessio Internal" (UUID fixe) héberge tous les staff
--      plateforme (admin / auditor).
--   2. Chaque `clients` existant devient une organisation type='company',
--      avec id réutilisé (= clients.id). Permet de garder les FKs futures
--      sans transformation supplémentaire.
--   3. Les `profiles` actifs sont rendus membres de la bonne org selon
--      leur role legacy.
--
-- Idempotente — `ON CONFLICT DO NOTHING` partout.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. Org "Axessio Internal" — pour les staff plateforme
-- ----------------------------------------------------------------------------
-- UUID stable et bien connu. Référencé dans le code TS via une constante.
insert into public.organizations (id, slug, name, type, billing_email)
values (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'axessio-internal',
  'Axessio',
  'agency',
  'admin@axessio.app'
)
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- 2. Backfill : clients → organizations
-- ----------------------------------------------------------------------------
-- Slug auto-généré : on prend le nom normalisé (lower + tirets), troncqué.
-- En cas de collision (rare), on suffixe avec un short id pour rester unique.
insert into public.organizations (id, slug, name, type, billing_email, created_at)
select
  c.id,
  lower(
    regexp_replace(
      coalesce(c.name, 'client'),
      '[^a-zA-Z0-9]+', '-', 'g'
    )
  ) || '-' || substring(c.id::text from 1 for 6),
  c.name,
  'company'::public.org_type,
  coalesce(c.contact_email, 'no-reply@axessio.app'),
  c.created_at
  from public.clients c
 where not exists (
   select 1 from public.organizations o where o.id = c.id
 );

-- ----------------------------------------------------------------------------
-- 3. Backfill : profiles → organization_members
-- ----------------------------------------------------------------------------
-- Mapping rôles legacy → org_role :
--   admin        → owner de Axessio Internal
--   auditor      → manager de Axessio Internal
--   client_admin → admin de leur org (= clients.id)
--   client       → member de leur org
--
-- Un admin de plateforme ne peut être qu'un seul `owner` par org (garde-fou
-- unique index). On choisit donc le PREMIER admin chronologiquement comme
-- owner, les autres deviennent `admin` (rôle org).
with ranked_admins as (
  select p.id,
         row_number() over (order by p.created_at, p.id) as rn
    from public.profiles p
   where p.role = 'admin' and coalesce(p.is_active, true) = true
)
insert into public.organization_members (organization_id, user_id, role, joined_at)
select
  '00000000-0000-0000-0000-000000000001'::uuid,
  ra.id,
  case when ra.rn = 1 then 'owner'::public.org_role
       else 'admin'::public.org_role
  end,
  now()
  from ranked_admins ra
on conflict (organization_id, user_id) do nothing;

-- Auditors → managers de Axessio Internal
insert into public.organization_members (organization_id, user_id, role, joined_at)
select
  '00000000-0000-0000-0000-000000000001'::uuid,
  p.id,
  'manager'::public.org_role,
  now()
  from public.profiles p
 where p.role = 'auditor' and coalesce(p.is_active, true) = true
on conflict (organization_id, user_id) do nothing;

-- Client admins → admin de leur org cliente (= clients.id)
-- Premier client_admin chronologique → owner de son org, les autres admin.
with ranked_client_admins as (
  select p.id,
         p.client_id,
         row_number() over (partition by p.client_id order by p.created_at, p.id) as rn
    from public.profiles p
   where p.role = 'client_admin'
     and p.client_id is not null
     and coalesce(p.is_active, true) = true
)
insert into public.organization_members (organization_id, user_id, role, joined_at)
select
  rca.client_id,
  rca.id,
  case when rca.rn = 1 then 'owner'::public.org_role
       else 'admin'::public.org_role
  end,
  now()
  from ranked_client_admins rca
  -- Vérifie que l'org existe (cas d'orphelin avec client_id pointant
  -- vers un client supprimé). On skip silencieusement.
 where exists (select 1 from public.organizations o where o.id = rca.client_id)
on conflict (organization_id, user_id) do nothing;

-- Clients → member de leur org
insert into public.organization_members (organization_id, user_id, role, joined_at)
select
  p.client_id,
  p.id,
  'member'::public.org_role,
  now()
  from public.profiles p
 where p.role = 'client'
   and p.client_id is not null
   and coalesce(p.is_active, true) = true
   and exists (select 1 from public.organizations o where o.id = p.client_id)
on conflict (organization_id, user_id) do nothing;

notify pgrst, 'reload schema';

commit;
