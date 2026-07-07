-- ============================================================================
-- Axessyo · Aligne la contrainte client_id de profiles sur l'etat reel de prod
-- ----------------------------------------------------------------------------
-- Drift detecte (juillet 2026) : la contrainte stricte `auditor_has_no_client`
-- de 00_init_schema (tout role <> auditor DOIT avoir un client_id) a ete
-- remplacee MANUELLEMENT en prod par une version permissive
-- `auditor_has_no_client_id` (seul un auditor doit avoir client_id null),
-- sans jamais etre captee dans une migration.
--
-- Consequence : sur une base reconstruite depuis les migrations (staging), la
-- version stricte bloquait la creation de tout compte admin/client sans
-- client_id (trigger handle_new_user), alors que la prod l'autorise.
--
-- Cette migration retablit la version permissive de prod. Idempotente.
-- ============================================================================

alter table public.profiles drop constraint if exists auditor_has_no_client;
alter table public.profiles drop constraint if exists auditor_has_no_client_id;

alter table public.profiles
  add constraint auditor_has_no_client_id
  check (role <> 'auditor'::user_role or client_id is null);
