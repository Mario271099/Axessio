-- ============================================================================
-- Axessio · Onboarding première connexion — `profiles.welcome_dismissed_at`
-- ----------------------------------------------------------------------------
-- Stocke le timestamp où l'utilisateur a fermé/dismissé la modale d'accueil.
-- NULL = le user n'a jamais vu la modale et elle sera proposée au prochain
-- arrivée sur /dashboard. Toute valeur non-NULL = ne plus afficher.
--
-- On utilise un timestamp plutôt qu'un booléen pour pouvoir :
--   - tracer quand l'onboarding a été passé (analytics)
--   - éventuellement la re-proposer si on remet à zéro une cohorte
--
-- Idempotente.
-- ============================================================================

begin;

alter table public.profiles
  add column if not exists welcome_dismissed_at timestamptz;

comment on column public.profiles.welcome_dismissed_at is
  'Timestamp de fermeture de la modale d''accueil (first-run onboarding). '
  'NULL = jamais affichée ou jamais fermée — la modale s''affichera au '
  'prochain accès dashboard. Migration 76.';

-- Backfill : les utilisateurs déjà actifs (qui ont au moins un audit
-- accessible) ne devraient pas voir la modale, ils sont au-delà du first run.
-- On marque leur welcome comme dismissé pour ne pas les déranger.
update public.profiles p
   set welcome_dismissed_at = now()
 where welcome_dismissed_at is null
   and exists (
     select 1 from public.audit_assignees aa
      where aa.profile_id = p.id
   );

-- Idem : les profils créés depuis plus de 30 jours sont considérés
-- comme « anciens » et ne reçoivent pas la modale.
update public.profiles
   set welcome_dismissed_at = now()
 where welcome_dismissed_at is null
   and created_at < now() - interval '30 days';

notify pgrst, 'reload schema';

commit;
