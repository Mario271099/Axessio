-- ============================================================================
-- Migration 25 : restriction de l'auditeur à ses audits assignés
-- ----------------------------------------------------------------------------
-- Phase 5 du chantier RBAC. Aujourd'hui, un auditeur voit et édite TOUS les
-- audits (RLS `is_auditor()` = true). On veut désormais qu'il n'accède qu'aux
-- projets dont il est assigné à au moins un audit (`audit_assignees`).
--
-- L'admin reste tout-puissant : `is_admin()` court-circuite toutes les
-- restrictions ci-dessous. Le client_admin et le client gardent leurs droits
-- d'origine (tout leur client / leurs projets attribués).
--
-- IMPORTANT :
--   - Backfill : on insère automatiquement `created_by` de chaque audit comme
--     assignee 'auditor' si le créateur est un auditeur. Sans ça, l'auditeur
--     créateur perdrait l'accès à ses propres audits dès l'application.
--   - Les policies WRITE (audits, pages, NC, conformités, pièces jointes)
--     basculent de `is_auditor()` vers `is_admin() OR auditor assigné`. Les
--     écritures "globales" (création d'audit, projets, clients) restent sur
--     `is_auditor()` car elles n'ont pas encore de project_id à filtrer —
--     un auditeur peut créer un audit, mais s'auto-assignera via la même
--     transaction côté server action.
--
-- Idempotente.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. Backfill : créateurs d'audits → assignees automatiques
-- ----------------------------------------------------------------------------
-- On évite le doublon via primary key (audit_id, profile_id, role).
insert into public.audit_assignees (audit_id, profile_id, role)
select a.id, a.created_by, 'auditor'
  from public.audits a
  join public.profiles p on p.id = a.created_by
 where a.created_by is not null
   and p.role = 'auditor'
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- 2. accessible_project_ids() : auditeur restreint aux audits assignés
-- ----------------------------------------------------------------------------
-- Logique :
--   - admin             : tous les projets (court-circuit)
--   - auditor           : projets contenant ≥ 1 audit où il est assignee
--   - client_admin      : tous les projets de son client
--   - client            : projets explicitement listés dans project_members
create or replace function public.accessible_project_ids()
returns table(project_id uuid)
language sql stable
as $$
  select p.id
  from public.projects p
  where
    public.is_admin()
    or (public.current_role() = 'auditor' and exists (
        select 1 from public.audits a
          join public.audit_assignees aa on aa.audit_id = a.id
         where a.project_id = p.id
           and aa.profile_id = auth.uid()
    ))
    or (public.current_role() = 'client_admin' and p.client_id = public.current_client_id())
    or (public.current_role() = 'client' and exists (
        select 1 from public.project_members pm
        where pm.project_id = p.id and pm.profile_id = auth.uid()
    ))
$$;

-- ----------------------------------------------------------------------------
-- 3. Helper : is_assigned_to_audit(audit_id) — pour les checks granulaires
-- ----------------------------------------------------------------------------
-- L'admin retourne toujours true (super-pouvoir). Les autres rôles renvoient
-- true selon leur scope : auditor = assigné, client_admin = son client,
-- client = via project_members.
create or replace function public.is_assigned_to_audit(p_audit_id uuid)
returns boolean
language sql stable
as $$
  select
    public.is_admin()
    or exists (
      select 1 from public.audits a
        left join public.audit_assignees aa
               on aa.audit_id = a.id and aa.profile_id = auth.uid()
       where a.id = p_audit_id
         and (
              -- auditor : assignation explicite
              (public.current_role() = 'auditor' and aa.profile_id is not null)
              -- client_admin : projet appartient à son client
              or (public.current_role() = 'client_admin'
                  and a.project_id in (
                    select id from public.projects
                    where client_id = public.current_client_id()
                  ))
              -- client : projet listé dans project_members
              or (public.current_role() = 'client' and a.project_id in (
                    select pm.project_id from public.project_members pm
                    where pm.profile_id = auth.uid()
                  ))
         )
    );
$$;

-- ----------------------------------------------------------------------------
-- 4. Policies WRITE : audits, pages, page_conformities, NC, attachments
-- ----------------------------------------------------------------------------
-- On bascule de `is_auditor()` (large) vers `is_admin() OR audit accessible`.
-- Les écritures qui n'ont pas encore d'audit (ex: INSERT audits) restent sur
-- `is_auditor()` car le project_id n'est pas encore filtré ; l'auto-assignation
-- côté server action garantit que l'auteur conservera l'accès.

-- audits : update + delete restreints à l'admin ou à l'auditeur assigné
drop policy if exists audits_update_auditor on public.audits;
create policy audits_update_auditor on public.audits
  for update to authenticated
  using (
    public.is_admin()
    or project_id in (select project_id from public.accessible_project_ids())
  )
  with check (
    public.is_admin()
    or project_id in (select project_id from public.accessible_project_ids())
  );

drop policy if exists audits_delete_auditor on public.audits;
create policy audits_delete_auditor on public.audits
  for delete to authenticated
  using (
    public.is_admin()
    or project_id in (select project_id from public.accessible_project_ids())
  );

-- pages_admin
drop policy if exists pages_admin on public.pages;
create policy pages_admin on public.pages
  for all to authenticated
  using (
    public.is_admin()
    or audit_id in (
      select id from public.audits
       where project_id in (select project_id from public.accessible_project_ids())
    )
  )
  with check (
    public.is_admin()
    or audit_id in (
      select id from public.audits
       where project_id in (select project_id from public.accessible_project_ids())
    )
  );

-- page_conformities_admin
drop policy if exists pc_admin on public.page_conformities;
create policy pc_admin on public.page_conformities
  for all to authenticated
  using (
    public.is_admin()
    or audit_id in (
      select id from public.audits
       where project_id in (select project_id from public.accessible_project_ids())
    )
  )
  with check (
    public.is_admin()
    or audit_id in (
      select id from public.audits
       where project_id in (select project_id from public.accessible_project_ids())
    )
  );

-- non_conformities : on garde nc_update_status_client (clients) inchangée,
-- on remplace seulement la policy "admin" auditeur.
drop policy if exists nc_admin on public.non_conformities;
create policy nc_admin on public.non_conformities
  for all to authenticated
  using (
    public.is_admin()
    or audit_id in (
      select id from public.audits
       where project_id in (select project_id from public.accessible_project_ids())
    )
  )
  with check (
    public.is_admin()
    or audit_id in (
      select id from public.audits
       where project_id in (select project_id from public.accessible_project_ids())
    )
  );

-- attachments : même logique, via la NC parente.
drop policy if exists attach_admin on public.nc_attachments;
create policy attach_admin on public.nc_attachments
  for all to authenticated
  using (
    public.is_admin()
    or non_conformity_id in (
      select nc.id from public.non_conformities nc
       where nc.audit_id in (
         select id from public.audits
          where project_id in (select project_id from public.accessible_project_ids())
       )
    )
  )
  with check (
    public.is_admin()
    or non_conformity_id in (
      select nc.id from public.non_conformities nc
       where nc.audit_id in (
         select id from public.audits
          where project_id in (select project_id from public.accessible_project_ids())
       )
    )
  );

-- ----------------------------------------------------------------------------
-- 5. assignees policy : ajout/retrait réservé aux admins
-- ----------------------------------------------------------------------------
-- L'ancienne policy `assignees_admin` autorisait tout `is_auditor()`. On
-- restreint à `is_admin()` pour éviter l'auto-assignation incontrôlée d'un
-- auditeur. Les server actions côté UI passent par admin uniquement.
--
-- Cas particulier : INSERT lors de la CRÉATION d'un audit par un auditeur
-- (auto-assignation). On l'autorise explicitement via une seconde policy
-- de type `for insert` qui ne demande que `actor = inserted profile_id`.
drop policy if exists assignees_admin on public.audit_assignees;

create policy assignees_admin on public.audit_assignees
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists assignees_self_insert on public.audit_assignees;
create policy assignees_self_insert on public.audit_assignees
  for insert to authenticated
  with check (
    -- Permettre à un auditeur de s'auto-assigner à l'audit qu'il vient de
    -- créer. Le `created_by` de l'audit doit être l'utilisateur courant.
    profile_id = auth.uid()
    and exists (
      select 1 from public.audits a
       where a.id = audit_id
         and a.created_by = auth.uid()
    )
    and public.current_role() = 'auditor'
  );

notify pgrst, 'reload schema';

commit;
