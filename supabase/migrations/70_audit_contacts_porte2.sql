-- ============================================================================
-- Axessio · Phase 5 — Porte 2 : contacts client via audit_assignees
-- ----------------------------------------------------------------------------
-- Source de vérité : ROLES_ROADMAP.md à la racine du repo.
--
-- Un « contact client » est un utilisateur invité à un audit précis SANS
-- être membre de l'organisation auditrice. Sa seule manifestation est une
-- ligne `audit_assignees(audit_id, profile_id, role='contact')`.
--
-- Visibilité accordée (toujours scopée à l'audit assigné) :
--   ✓ Lire l'audit, ses pages, sa matrice, ses NC
--   ✓ Lire et écrire le FIL CLIENT des NC (nc_messages.thread='client')
--   ✓ Mettre à jour le statut client d'une NC (nc.update_status_client)
--   ✗ Lire le FIL REVIEW des NC — strictement réservé à l'équipe interne
--   ✗ Voir d'autres audits, d'autres clients, l'org, la facturation
--
-- Le fil review reste verrouillé par `current_user_can_access_nc_review`
-- (mig. 37) qui ne matche que role IN ('auditor','proofreader') — donc
-- les contacts y sont AUTOMATIQUEMENT exclus, c'est la garantie demandée.
--
-- Idempotente.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1) CHECK sur audit_assignees.role pour formaliser les 3 valeurs
-- ----------------------------------------------------------------------------
alter table public.audit_assignees
  drop constraint if exists audit_assignees_role_check;
alter table public.audit_assignees
  add constraint audit_assignees_role_check
  check (role in ('auditor', 'proofreader', 'contact'));

-- ----------------------------------------------------------------------------
-- 2) Helper SECURITY DEFINER : `is_contact_of_audit(audit_id)`
-- ----------------------------------------------------------------------------
-- Vrai si l'utilisateur courant a une ligne audit_assignees pour cet audit
-- avec le rôle 'contact'.
create or replace function public.is_contact_of_audit(p_audit_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.audit_assignees
     where audit_id = p_audit_id
       and profile_id = auth.uid()
       and role = 'contact'
  );
$$;

comment on function public.is_contact_of_audit(uuid) is
  'Vrai si l''utilisateur courant est contact client d''un audit donné. '
  'Porte 2 du modèle d''autorisation — voir ROLES_ROADMAP.md.';

-- ----------------------------------------------------------------------------
-- 3) Étendre `nc_can_access(nc_id)` pour inclure les contacts
-- ----------------------------------------------------------------------------
-- Sans casser la sémantique existante : si l'utilisateur est contact de
-- l'audit parent, il a accès à la NC (et donc au fil client via les
-- policies nc_messages_select / nc_messages_insert).
create or replace function public.nc_can_access(p_nc_id uuid)
returns boolean
language sql stable
security definer set search_path = public
as $$
  select exists(
    select 1
    from public.non_conformities nc
    join public.audits   a on a.id = nc.audit_id
    join public.projects p on p.id = a.project_id
    where nc.id = p_nc_id
      and (
        public.is_auditor()
        or (
          public.current_role() = 'client_admin'
          and p.client_id = public.current_client_id()
        )
        or public.is_contact_of_audit(nc.audit_id)
      )
  )
$$;

-- ----------------------------------------------------------------------------
-- 4) Policies sur les ressources d'un audit — accès lecture pour les contacts
-- ----------------------------------------------------------------------------
-- audits : un contact voit son audit assigné, rien d'autre
drop policy if exists audits_select_contact on public.audits;
create policy audits_select_contact on public.audits
  for select to authenticated
  using (public.is_contact_of_audit(id));

-- pages (échantillon) : nécessaire pour afficher la matrice côté contact
drop policy if exists pages_select_contact on public.pages;
create policy pages_select_contact on public.pages
  for select to authenticated
  using (public.is_contact_of_audit(audit_id));

-- page_conformities (matrice) : le contact peut consulter les cellules
drop policy if exists page_conformities_select_contact on public.page_conformities;
create policy page_conformities_select_contact on public.page_conformities
  for select to authenticated
  using (
    exists (
      select 1 from public.pages p
       where p.id = page_conformities.page_id
         and public.is_contact_of_audit(p.audit_id)
    )
  );

-- non_conformities : le contact voit les NC de son audit
drop policy if exists nc_select_contact on public.non_conformities;
create policy nc_select_contact on public.non_conformities
  for select to authenticated
  using (public.is_contact_of_audit(audit_id));

-- Le contact peut UPDATE le statut côté client (corrigée / en cours).
-- Cette policy est additive — la policy nc_update_status_client legacy
-- reste en place et continue à servir les rôles client_admin/client.
drop policy if exists nc_update_status_contact on public.non_conformities;
create policy nc_update_status_contact on public.non_conformities
  for update to authenticated
  using (public.is_contact_of_audit(audit_id))
  with check (public.is_contact_of_audit(audit_id));

-- nc_attachments : voir les captures rattachées aux NC visibles
drop policy if exists nc_attachments_select_contact on public.nc_attachments;
create policy nc_attachments_select_contact on public.nc_attachments
  for select to authenticated
  using (
    exists (
      select 1 from public.non_conformities nc
       where nc.id = nc_attachments.non_conformity_id
         and public.is_contact_of_audit(nc.audit_id)
    )
  );

-- audit_assignees : un contact voit sa propre ligne (pour vérifier son
-- accès) ET les autres assignations du même audit (savoir qui est
-- l'auditeur lead, etc.).
drop policy if exists assignees_select_contact on public.audit_assignees;
create policy assignees_select_contact on public.audit_assignees
  for select to authenticated
  using (
    profile_id = auth.uid()
    or public.is_contact_of_audit(audit_id)
  );

-- ----------------------------------------------------------------------------
-- 5) nc_messages — déjà géré par nc_can_access (étendu au point 3)
-- ----------------------------------------------------------------------------
-- Le fil 'client' utilise nc_can_access → le contact y a maintenant accès.
-- Le fil 'review' utilise current_user_can_access_nc_review qui ne matche
-- QUE les roles 'auditor' et 'proofreader' — donc le contact est exclu.
-- Aucune policy nc_messages à modifier ici : la mise à jour de
-- nc_can_access propage automatiquement la nouvelle visibilité.

notify pgrst, 'reload schema';

commit;
