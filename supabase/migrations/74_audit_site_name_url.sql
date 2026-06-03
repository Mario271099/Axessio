-- ============================================================================
-- Axessio · L'URL du site descend de project à audit
-- ----------------------------------------------------------------------------
-- Refonte produit : un audit, c'est par site. Un même projet peut héberger
-- plusieurs audits — un par version, par sous-domaine, par release mobile.
-- On déplace donc l'URL du projet vers l'audit, et on ajoute un nom de site
-- obligatoire qui identifie ce que l'audit cible (utile quand le projet
-- regroupe plusieurs sites/apps).
--
-- Changements :
--   1. audits.site_name (text) — nom lisible du site/app audité. Pas
--      NOT NULL au schema pour ne pas casser les lignes legacy ; un default
--      provisoire `''` permet le filtrage applicatif. On laisse le code
--      applicatif faire le check obligatoire à la création.
--   2. audits.site_url (text) — URL du site web OU identifiant de l'app
--      mobile (bundle id, package name). Nullable pour les lignes legacy.
--   3. Backfill : recopie projects.url vers audits.site_url pour les audits
--      existants qui n'ont pas encore de site_url. Aucune perte de donnée.
--   4. projects.url devient nullable (sera supprimé au prochain refacto
--      une fois qu'aucun consumer ne le lit plus côté code).
--
-- Idempotent.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1) Nouvelles colonnes sur audits
-- ----------------------------------------------------------------------------
alter table public.audits
  add column if not exists site_name text;

alter table public.audits
  add column if not exists site_url text;

comment on column public.audits.site_name is
  'Nom lisible du site ou de l''application audité (ex: "Espace client v2"). '
  'Obligatoire à la création depuis le code applicatif — le NOT NULL côté '
  'DB sera posé une fois la totalité du legacy backfillé.';

comment on column public.audits.site_url is
  'URL du site web (https://...) OU identifiant d''app mobile (bundle id, '
  'package name). Nullable pour compat legacy.';

-- ----------------------------------------------------------------------------
-- 2) Backfill : recopie projects.url vers audits.site_url
-- ----------------------------------------------------------------------------
update public.audits a
   set site_url = p.url
  from public.projects p
 where a.project_id = p.id
   and a.site_url is null
   and p.url is not null
   and p.url <> '';

-- Backfill aussi le site_name par défaut = nom du projet (pour les legacy
-- qui n'avaient pas la notion de site distinct du projet). L'utilisateur
-- pourra ensuite éditer.
update public.audits a
   set site_name = p.name
  from public.projects p
 where a.project_id = p.id
   and (a.site_name is null or a.site_name = '');

-- ----------------------------------------------------------------------------
-- 3) projects.url devient nullable (déjà nullable au schema initial, on
--    documente l'intention)
-- ----------------------------------------------------------------------------
comment on column public.projects.url is
  'DEPRECATED — descendu sur audits.site_url. Conservé en lecture le temps '
  'de finir la bascule des consumers. À drop quand zéro consommateur.';

notify pgrst, 'reload schema';

commit;
