-- ============================================================================
-- Migration 58 : API tokens scoped (Phase 5) — accès programmatique
-- ----------------------------------------------------------------------------
-- Tokens "Bearer" liés à une organisation, créés par un owner/admin. Permet
-- l'intégration côté client (scripts, automatisations, no-code) sans avoir
-- à partager des credentials utilisateur.
--
-- Sécurité :
--   - Le token complet n'est JAMAIS stocké en clair. On stocke un SHA-256
--     hex de la totalité, + un préfixe public de 12 caractères pour le
--     reconnaître dans l'UI (genre "axe_live_abc1...").
--   - Le secret n'est affiché à l'utilisateur QU'UNE SEULE FOIS, à la
--     création. Perdu = il faut le régénérer.
--   - Les scopes sont des chaînes opaques (`audits:read`, etc.) — la logique
--     d'autorisation est côté application, on stocke juste la liste.
--   - Révocation = `revoked_at IS NOT NULL`. Pas de DELETE pour garder
--     l'historique d'usage.
--
-- Feature gating : `api.access` (Enterprise). Vérifié côté code applicatif.
--
-- Idempotente.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. Table
-- ----------------------------------------------------------------------------
create table if not exists public.api_tokens (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by      uuid references public.profiles(id) on delete set null,
  name            text not null,
  prefix          text not null,           -- ex. "axe_live_abc1"
  token_hash      text not null unique,    -- sha256 hex du token complet
  scopes          text[] not null default '{}',
  last_used_at    timestamptz,
  expires_at      timestamptz,             -- NULL = sans expiration
  revoked_at      timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists idx_api_tokens_org_active
  on public.api_tokens(organization_id)
  where revoked_at is null;

create index if not exists idx_api_tokens_prefix
  on public.api_tokens(prefix);

-- ----------------------------------------------------------------------------
-- 2. Helper : valider un token et retourner son contexte
-- ----------------------------------------------------------------------------
-- Appelée par le middleware Bearer côté API. Le caller doit déjà avoir
-- calculé le SHA-256 hex du token (on ne le fait pas dans la fonction pour
-- éviter de logguer accidentellement le hash dans les logs Postgres).
--
-- Retourne 0 ligne si invalide / expiré / révoqué.
create or replace function public.validate_api_token(p_token_hash text)
returns table(
  token_id        uuid,
  organization_id uuid,
  scopes          text[]
)
language sql
security definer
set search_path = public
as $$
  select id, organization_id, scopes
    from public.api_tokens
   where token_hash = p_token_hash
     and revoked_at is null
     and (expires_at is null or expires_at > now())
   limit 1;
$$;

-- Bump `last_used_at` après chaque appel réussi. Appelée séparément pour
-- ne pas bloquer le retour de validate_api_token() avec un UPDATE.
create or replace function public.touch_api_token(p_token_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.api_tokens set last_used_at = now() where id = p_token_id;
$$;

-- ----------------------------------------------------------------------------
-- 3. RLS — admin/owner seulement, et sans exposer token_hash côté client
-- ----------------------------------------------------------------------------
alter table public.api_tokens enable row level security;

drop policy if exists api_tokens_select on public.api_tokens;
create policy api_tokens_select on public.api_tokens
  for select to authenticated
  using (
    public.is_admin()
    or public.has_org_role(organization_id, 'admin')
  );

drop policy if exists api_tokens_manage on public.api_tokens;
create policy api_tokens_manage on public.api_tokens
  for all to authenticated
  using (
    public.is_admin()
    or public.has_org_role(organization_id, 'admin')
  )
  with check (
    public.is_admin()
    or public.has_org_role(organization_id, 'admin')
  );

notify pgrst, 'reload schema';

commit;
