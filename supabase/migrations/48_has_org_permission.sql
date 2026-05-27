-- ============================================================================
-- Migration 48 : Permissions atomiques (Phase 3 — suite) — helper SQL
-- ----------------------------------------------------------------------------
-- Maintenant qu'on a le catalogue + le mapping (migration 47), on expose
-- une fonction unique que les RLS et les server actions pourront appeler :
--
--   has_org_permission('audit.delete')
--     -> true si l'utilisateur courant a cette permission dans son org active
--
--   has_org_permission_on('audit.delete', org_id)
--     -> idem mais sur une org passée en paramètre (ex : avant switch)
--
-- Toutes les fonctions sont SECURITY DEFINER avec search_path verrouillé
-- pour éviter toute récursion RLS et tout détournement.
--
-- Idempotente.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. Permission sur l'org active (current_org())
-- ----------------------------------------------------------------------------
create or replace function public.has_org_permission(p_code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.organization_members m
      join public.role_permissions rp
        on rp.scope = 'org'
       and rp.role_code = m.role::text
       and rp.permission = p_code
     where m.user_id = auth.uid()
       and m.organization_id = public.current_org()
  );
$$;

comment on function public.has_org_permission(text) is
  'Vrai si l''utilisateur courant a la permission donnée dans son org active.';

-- ----------------------------------------------------------------------------
-- 2. Permission sur une org explicite (avant bascule, page d'admin globale…)
-- ----------------------------------------------------------------------------
create or replace function public.has_org_permission_on(
  p_code   text,
  p_org_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.organization_members m
      join public.role_permissions rp
        on rp.scope = 'org'
       and rp.role_code = m.role::text
       and rp.permission = p_code
     where m.user_id = auth.uid()
       and m.organization_id = p_org_id
  );
$$;

comment on function public.has_org_permission_on(text, uuid) is
  'Vrai si l''utilisateur courant a la permission donnée dans l''org passée.';

-- ----------------------------------------------------------------------------
-- 3. Introspection : liste les permissions effectives sur l'org active
-- ----------------------------------------------------------------------------
-- Utile pour la page /debug/permissions et pour précharger les flags UI
-- côté client (un seul round-trip RPC au lieu de N appels has_org_permission).
create or replace function public.my_org_permissions()
returns setof text
language sql
stable
security definer
set search_path = public
as $$
  select rp.permission
    from public.organization_members m
    join public.role_permissions rp
      on rp.scope = 'org'
     and rp.role_code = m.role::text
   where m.user_id = auth.uid()
     and m.organization_id = public.current_org()
   order by rp.permission;
$$;

comment on function public.my_org_permissions() is
  'Liste les permissions atomiques effectives de l''utilisateur sur son org active.';

notify pgrst, 'reload schema';

commit;
