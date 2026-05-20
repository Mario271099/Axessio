-- ============================================================================
-- Migration 26 : nouvelles dates clés pour le planning d'audit
-- ----------------------------------------------------------------------------
-- On ajoute deux dates planifiées :
--   - restitution_at  : date de restitution prévue (présentation rapport)
--   - counter_audit_at : date du contre-audit (pour les prestations qui en
--                        comprennent un — cf. ServiceType `AUDIT`)
--
-- Toutes deux nullable (un audit sans restitution planifiée reste valide).
-- Le champ existant `delivered_at` reste la date réelle de livraison
-- (différent d'une date prévue).
--
-- Indexes : on indexe `restitution_at` et `counter_audit_at` pour permettre la
-- vue Planning de filtrer "audits avec une date à venir" rapidement.
-- ============================================================================

begin;

alter table public.audits
  add column if not exists restitution_at  timestamptz,
  add column if not exists counter_audit_at timestamptz;

create index if not exists idx_audits_restitution_at
  on public.audits(restitution_at) where restitution_at is not null;

create index if not exists idx_audits_counter_audit_at
  on public.audits(counter_audit_at) where counter_audit_at is not null;

create index if not exists idx_audits_expected_start_at
  on public.audits(expected_start_at) where expected_start_at is not null;

create index if not exists idx_audits_expected_end_at
  on public.audits(expected_end_at) where expected_end_at is not null;

notify pgrst, 'reload schema';

commit;
