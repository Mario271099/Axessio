-- ============================================================================
-- Axessio · Suppression du statut FALSE_POSITIVE des non-conformités
-- ----------------------------------------------------------------------------
-- Décision produit : si une non-conformité a été identifiée à tort, elle doit
-- être supprimée — pas archivée derrière un statut spécial. La présence de
-- FALSE_POSITIVE dans le cycle de vie ajoutait une voie de garage qui
-- alourdissait les rapports sans valeur pour le client final.
--
-- Cette migration :
--   1. Supprime physiquement les NC actuellement en statut FALSE_POSITIVE.
--   2. Pose un CHECK constraint pour empêcher toute réintroduction du statut.
--   3. Laisse la valeur 'FALSE_POSITIVE' dans le type enum `nc_status`
--      (Postgres ne permet pas de retirer une valeur d'enum sans recréer le
--      type, ce qui casserait toutes les dépendances). Le CHECK garantit
--      qu'aucune ligne ne peut plus l'utiliser.
--
-- Idempotent.
-- ============================================================================

begin;

-- 1) Purge des données --------------------------------------------------------
-- Les pièces jointes, messages et notifications sont nettoyés en cascade par
-- les `on delete cascade` posés en migrations 19, 33, 37.
delete from public.non_conformities where status = 'FALSE_POSITIVE';

-- 2) Verrou métier — empêche tout futur INSERT/UPDATE qui ferait revenir
--    la valeur (que ce soit par bug app, console SQL, ou ancien code).
alter table public.non_conformities
  drop constraint if exists nc_status_no_false_positive;
alter table public.non_conformities
  add constraint nc_status_no_false_positive
  check (status::text <> 'FALSE_POSITIVE');

notify pgrst, 'reload schema';

commit;
