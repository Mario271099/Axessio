-- ============================================================================
-- Migration 27 : collaboration & relecture (Phase workflow étendue)
-- ----------------------------------------------------------------------------
-- Trois ajouts pour rendre le workflow réellement collaboratif :
--
--   1. Désignation explicite d'un relecteur via `audit_assignees.role =
--      'proofreader'` — la colonne existe depuis l'init mais n'était pas
--      manageable par l'auditeur. On ajoute une policy permissive.
--
--   2. Commentaires de relecture posés sur l'audit (pas sur une NC) — ils
--      sont stockés dans `audit_logs` avec `action = 'workflow.comment'`.
--      La policy `audit_logs_insert` (migration 24) couvre déjà ce cas.
--
--   3. Notifications in-app dirigées vers le relecteur / les auditeurs lors
--      des transitions. On ouvre une policy INSERT contrôlée sur
--      `notifications` (jusqu'ici seul un trigger SECURITY DEFINER écrivait).
--
-- Idempotente.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. audit_assignees : autoriser admin + auditeur assigné à gérer le relecteur
-- ----------------------------------------------------------------------------
-- La migration 25 avait restreint `assignees_admin` à `is_admin()`. Pour le
-- rôle 'proofreader' on est plus permissif : tout auditeur assigné à l'audit
-- peut désigner ou retirer un relecteur. Admin reste toujours OK.
--
-- Les policies RLS étant OR'd entre elles, cette policy s'ajoute sans
-- affaiblir les contrôles existants.
drop policy if exists assignees_proofreader_manage on public.audit_assignees;

create policy assignees_proofreader_manage on public.audit_assignees
  for all to authenticated
  using (
    role = 'proofreader'
    and (
      public.is_admin()
      or (
        public.current_role() = 'auditor'
        and audit_id in (
          select audit_id from public.audit_assignees
           where profile_id = auth.uid() and role = 'auditor'
        )
      )
    )
  )
  with check (
    role = 'proofreader'
    and (
      public.is_admin()
      or (
        public.current_role() = 'auditor'
        and audit_id in (
          select audit_id from public.audit_assignees
           where profile_id = auth.uid() and role = 'auditor'
        )
      )
    )
  );

-- ----------------------------------------------------------------------------
-- 2. notifications : permettre aux server actions staff d'insérer des notifs
-- ----------------------------------------------------------------------------
-- Jusqu'ici, seul le trigger SECURITY DEFINER `notify_on_nc_message` insérait
-- dans cette table. On ouvre maintenant un INSERT contrôlé : un auditeur ou
-- admin peut envoyer une notification, dans le cadre d'un audit auquel il a
-- accès. Le `sender_id` doit être l'utilisateur courant (anti-spoofing).
drop policy if exists notifications_staff_insert on public.notifications;

create policy notifications_staff_insert on public.notifications
  for insert to authenticated
  with check (
    (sender_id = auth.uid() or sender_id is null)
    and public.current_role() in ('auditor', 'admin')
    and (
      audit_id is null
      or audit_id in (
        select id from public.audits
         where project_id in (select project_id from public.accessible_project_ids())
      )
    )
  );

-- ----------------------------------------------------------------------------
-- 3. Vue de commodité : auditeurs assignés vs relecteurs
-- ----------------------------------------------------------------------------
-- Pas de vue créée ici — le code lit `audit_assignees` directement filtré sur
-- `role`. Mais on s'assure qu'il y a un index utile :
create index if not exists idx_audit_assignees_audit_role
  on public.audit_assignees(audit_id, role);

notify pgrst, 'reload schema';

commit;
