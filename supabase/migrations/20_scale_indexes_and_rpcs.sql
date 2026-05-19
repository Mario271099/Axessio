-- ============================================================================
-- Migration 20 : scaling à 150k+ audits
-- ----------------------------------------------------------------------------
-- 1. Indexes composites/partiels manquants sur les chemins chauds :
--    /audits (liste, filtres, recherche), /dashboard (KPIs), matrice.
-- 2. Fonctions RPC SECURITY INVOKER (= respectent la RLS) pour calculer les
--    agrégats de dashboard côté Postgres au lieu de transférer toute la table.
--
-- Idempotente.
-- ============================================================================

begin;

-- ============================================================================
-- 1. Indexes
-- ============================================================================

-- Liste /audits : déjà couvert par idx_audits_updated_at_desc (migration 18).
-- Filtres par statut + tri par updated_at : on ajoute un index composite pour
-- couvrir les filtres status simultanément au tri.
create index if not exists idx_audits_status_updated_at
  on public.audits(status, updated_at desc);

-- Filtre par platform (utile sur la liste).
create index if not exists idx_audits_platform
  on public.audits(platform);

-- Recherche full-text par nom de projet (ilike) — on indexe en trigrammes
-- pour que `ilike '%foo%'` soit rapide à grande échelle.
create extension if not exists pg_trgm;

create index if not exists idx_projects_name_trgm
  on public.projects using gin (name gin_trgm_ops);

create index if not exists idx_clients_name_trgm
  on public.clients using gin (name gin_trgm_ops);

-- non_conformities — tri created_at desc fréquent sur le dashboard et /anomalies.
create index if not exists idx_nc_created_at_desc
  on public.non_conformities(created_at desc);

-- Combiné severity+status pour les filtres NC.
create index if not exists idx_nc_severity_status
  on public.non_conformities(severity, status);

-- nc_messages tri chronologique (Realtime + fil de discussion).
create index if not exists idx_nc_messages_created_at
  on public.nc_messages(created_at);

-- page_conformities est interrogé en boucle (matrice). On a déjà l'index sur
-- audit_id mais on ajoute un composite (audit_id, criteria_id) pour servir
-- les JOINs natifs sans bitmap scan.
create index if not exists idx_conformities_audit_criteria
  on public.page_conformities(audit_id, criteria_id);

-- ============================================================================
-- 2. RPCs SECURITY INVOKER (= RLS respectée)
-- ============================================================================

-- 2.1 Score moyen — remplace l'agrégation côté JS qui transférait toutes les
-- lignes au client.
create or replace function public.audits_avg_score()
returns numeric
language sql
stable
security invoker
set search_path = public
as $$
  select avg(coalesce(final_score, initial_score))::numeric
  from public.audits
  where final_score is not null or initial_score is not null;
$$;

grant execute on function public.audits_avg_score() to authenticated;

-- 2.2 Répartition par statut — un seul aller-retour pour les 4 groupes.
--
-- On renvoie quatre colonnes nommées plutôt qu'un set pour simplifier le
-- typage côté client (le client lit `data[0].pending` etc).
create or replace function public.audits_status_breakdown()
returns table (
  pending_count bigint,
  in_progress_count bigint,
  completed_count bigint,
  archived_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    count(*) filter (where status in ('PENDING', 'PLANNED')) as pending_count,
    count(*) filter (where status in ('IN_PROGRESS', 'DELIVERED', 'REMEDIATION', 'COUNTER_AUDIT')) as in_progress_count,
    count(*) filter (where status in ('COMPLETED', 'ONLINE')) as completed_count,
    count(*) filter (where status = 'ARCHIVED') as archived_count
  from public.audits;
$$;

grant execute on function public.audits_status_breakdown() to authenticated;

notify pgrst, 'reload schema';

commit;
