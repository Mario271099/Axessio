-- ============================================================================
-- Axessio · Phase 6C.1 — Fermer le trou d'escalade des rôles client legacy
-- ----------------------------------------------------------------------------
-- Source de vérité : ROLES_ROADMAP.md.
--
-- Contexte. Le backfill de mig. 43 avait mappé :
--   client       → org `member`
--   client_admin → org `admin` ou `owner`
--
-- Mig. 67 (Phase 2) a ensuite absorbé `member` → `auditor`. Conséquence
-- inattendue : un user dont profile.role est encore 'client' a aujourd'hui
-- le rôle org 'auditor' — qui détient `audit.edit`, `matrix.edit`,
-- `nc.create/edit/delete`, `chat.review.*`, `project.manage`. Si jamais on
-- bascule les writes du legacy (`is_auditor()`) vers `has_org_permission()`,
-- ces clients pourraient soudainement éditer audits, NC, matrice et lire le
-- fil de relecture interne — escalade massive.
--
-- Cette migration ferme le trou en faisant la bascule INVERSE pour les
-- legacy `client` / `client_admin` :
--   1. Pour chaque audit qu'ils peuvent voir (via leur client_id), on insère
--      audit_assignees(audit_id, profile_id, role='contact').
--      → Ils gardent leur accès via la Porte 2 (mig. 70) : lecture audit,
--        matrice, NC, fil client, statut NC. Pas de fil review, pas de
--        carnet d'adresses, pas de gestion.
--   2. On supprime ensuite leurs lignes organization_members pour les orgs
--      clients (PAS pour Axessio Internal — ils n'y sont pas de toute façon).
--      → Ils cessent d'apparaître dans les requêtes basées sur
--        has_org_permission().
--
-- Effet net : aucune régression d'accès, plus de piège latent pour la
-- bascule code restante.
--
-- Idempotente. Les ON CONFLICT et clauses WHERE EXISTS rendent la re-exécution
-- sûre.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1) Snapshot : tous les users à remapper. CTE pour rester lisible et éviter
--    de re-courir la requête à chaque étape.
-- ----------------------------------------------------------------------------
with legacy_clients as (
  select p.id as profile_id,
         p.client_id
    from public.profiles p
   where p.role in ('client', 'client_admin')
     and p.client_id is not null
     and coalesce(p.is_active, true) = true
     -- Sécurité : seulement les users dont le client_id pointe vers une org
     -- existante (cas legacy 1:1 `clients.id == organizations.id`).
     and exists (
       select 1 from public.organizations o
        where o.id = p.client_id
     )
),
-- Pour chaque legacy client, on liste les audits accessibles via leur org.
-- On passe par projects + audits.organization_id (mig. 44) qui est NOT NULL
-- depuis le backfill.
accessible_audits as (
  select lc.profile_id,
         a.id as audit_id
    from legacy_clients lc
    join public.audits a on a.organization_id = lc.client_id
)
-- 1.a) Insertion audit_assignees(role='contact') pour chaque (user, audit).
--      ON CONFLICT DO NOTHING : pas de doublon si la ligne existe déjà
--      (ex. user déjà invité comme contact via la nouvelle UI).
insert into public.audit_assignees (audit_id, profile_id, role)
select audit_id, profile_id, 'contact'
  from accessible_audits
on conflict (audit_id, profile_id, role) do nothing;

-- ----------------------------------------------------------------------------
-- 2) Suppression de leurs organization_members pour les orgs clients.
--    On ne touche PAS Axessio Internal (ils n'y sont pas — vérification
--    explicite par sécurité quand même).
-- ----------------------------------------------------------------------------
delete from public.organization_members om
 using public.profiles p
 where om.user_id = p.id
   and p.role in ('client', 'client_admin')
   and om.organization_id <> '00000000-0000-0000-0000-000000000001'::uuid
   and om.organization_id = p.client_id;

-- ----------------------------------------------------------------------------
-- 3) Log applicatif pour traçabilité (best-effort — n'échoue pas si la table
--    audit_logs a une contrainte que nos lignes ne respecteraient pas).
-- ----------------------------------------------------------------------------
do $$
begin
  begin
    insert into public.audit_logs (actor_id, actor_role, action, payload)
    select p.id, p.role, 'rbac.legacy_client_remapped',
           jsonb_build_object(
             'profile_role', p.role,
             'client_id', p.client_id,
             'migration', '72_remap_legacy_clients_to_contacts'
           )
      from public.profiles p
     where p.role in ('client', 'client_admin')
       and coalesce(p.is_active, true) = true
       and p.client_id is not null;
  exception when others then
    raise notice 'audit_logs insert skipped: %', sqlerrm;
  end;
end $$;

notify pgrst, 'reload schema';

commit;
