-- ============================================================================
-- Axessio · L'auditeur peut inviter des contacts client sur ses audits
-- ----------------------------------------------------------------------------
-- Bug rapporté : un auditeur (legacy `profile.role = 'auditor'`) qui tente
-- d'inviter un contact client (Porte 2 — Phase 5) reçoit :
--   « new row violates row-level security policy for table audit_assignees »
--
-- Cause : les policies actuelles n'autorisent l'INSERT que pour
--   1. is_admin() — super-admin plateforme
--   2. self-insert d'un auditeur sur l'audit qu'il vient de créer
--   3. client_admin sur son client
--
-- Or l'auditeur d'une org doit pouvoir :
--   - inviter un contact (role='contact') sur ses audits
--   - assigner un autre auditeur ou proofreader (collaboration, relecture)
--
-- Cette migration ajoute une policy ADDITIVE : si l'utilisateur a le rôle
-- legacy `auditor` ou `admin` ET qu'il a accès à l'audit via
-- accessible_project_ids() (RLS standard sur audits), il peut gérer les
-- assignees de cet audit.
--
-- Côté code applicatif, les server actions (inviteContact, assignAuditor)
-- font déjà leur check `requirePermission("audit.assign_auditor")` — la
-- RLS est la 2ᵉ ligne de défense.
--
-- Idempotente.
-- ============================================================================

begin;

drop policy if exists assignees_auditor_manage on public.audit_assignees;

create policy assignees_auditor_manage on public.audit_assignees
  for all to authenticated
  using (
    public.is_auditor()
    and audit_id in (
      select id from public.audits
       where project_id in (select project_id from public.accessible_project_ids())
    )
  )
  with check (
    public.is_auditor()
    and audit_id in (
      select id from public.audits
       where project_id in (select project_id from public.accessible_project_ids())
    )
  );

notify pgrst, 'reload schema';

commit;
