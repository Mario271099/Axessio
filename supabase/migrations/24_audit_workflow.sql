-- ============================================================================
-- Migration 24 : workflow éditorial d'audit (Phase 3 du chantier RBAC)
-- ----------------------------------------------------------------------------
-- On ajoute un champ `workflow_status` SÉPARÉ de `audit_status` :
--
--   - `status`           : statut métier / lifecycle (PENDING, IN_PROGRESS,
--                          DELIVERED, REMEDIATION, ONLINE, ...)
--   - `workflow_status`  : étape de validation éditoriale du rapport
--                          (draft → in_review → validated → delivered)
--
-- Les deux coexistent volontairement : un audit peut être IN_PROGRESS (métier)
-- tout en étant `in_review` (workflow). Le verrouillage d'édition s'appuie
-- uniquement sur `workflow_status` (validated/delivered = verrouillé sauf admin).
--
-- Transitions autorisées :
--   draft       → in_review
--   in_review   → draft (retour pour correction) | validated
--   validated   → in_review (admin uniquement, retour exceptionnel) | delivered
--   delivered   → (terminal)
--
-- Migrations idempotentes — sûres à rejouer.
--
-- IMPORTANT : `ALTER TYPE ... ADD VALUE` ne peut pas être suivi d'une
-- utilisation immédiate dans la même transaction (cf. migration 23). On
-- crée donc l'enum dans sa propre transaction si on doit l'étendre, mais
-- ici on le CRÉE en une fois (CREATE TYPE) ce qui est compatible avec une
-- transaction unique.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. Enum + colonne workflow_status
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'audit_workflow_status') then
    create type public.audit_workflow_status
      as enum ('draft', 'in_review', 'validated', 'delivered');
  end if;
end $$;

alter table public.audits
  add column if not exists workflow_status public.audit_workflow_status
    not null default 'draft';

create index if not exists idx_audits_workflow_status
  on public.audits(workflow_status);

-- Backfill cohérent avec le statut métier existant : on évite de figer
-- d'anciens audits en "draft" alors qu'ils sont déjà livrés/en remédiation.
update public.audits
   set workflow_status = case
     when status in ('PENDING')                                       then 'draft'
     when status in ('PLANNED', 'IN_PROGRESS')                        then 'draft'
     when status in ('DELIVERED', 'REMEDIATION', 'COUNTER_AUDIT')     then 'delivered'
     when status in ('ONLINE', 'COMPLETED', 'ARCHIVED')               then 'delivered'
     else workflow_status
   end
 where true;

-- ----------------------------------------------------------------------------
-- 2. Trigger : log automatique des changements de workflow_status
-- ----------------------------------------------------------------------------
-- À chaque UPDATE de workflow_status, on dépose un audit_logs avec l'ancien
-- et le nouveau statut. Les server actions peuvent insérer en complément
-- (action='workflow.transition', payload enrichi avec `reason`) mais la
-- trace minimale est garantie par ce trigger.
create or replace function public.log_audit_workflow_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id   uuid;
  v_actor_role text;
begin
  if (tg_op = 'UPDATE' and new.workflow_status is distinct from old.workflow_status) then
    v_actor_id := auth.uid();
    if v_actor_id is not null then
      select role::text into v_actor_role
        from public.profiles
       where id = v_actor_id;
    end if;

    insert into public.audit_logs
      (audit_id, actor_id, actor_role, action, payload)
    values (
      new.id,
      v_actor_id,
      v_actor_role,
      'workflow.transition',
      jsonb_build_object(
        'from', old.workflow_status::text,
        'to',   new.workflow_status::text
      )
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_log_audit_workflow on public.audits;
create trigger trg_log_audit_workflow
  after update of workflow_status on public.audits
  for each row execute function public.log_audit_workflow_change();

-- ----------------------------------------------------------------------------
-- 3. Policies audit_logs : autoriser INSERT depuis les server actions
-- ----------------------------------------------------------------------------
-- La migration 23 a déclaré audit_logs en append-only, sans policy INSERT
-- publique : seuls les triggers SECURITY DEFINER pouvaient écrire. On ouvre
-- maintenant un INSERT contrôlé pour les server actions (impersonation,
-- transitions, etc.). Garde-fous :
--   - `actor_id` doit être l'utilisateur courant (anti-spoofing)
--   - `audit_id` doit faire partie des projets accessibles (sauf admin)
drop policy if exists audit_logs_insert on public.audit_logs;

create policy audit_logs_insert on public.audit_logs
  for insert to authenticated
  with check (
    actor_id = auth.uid()
    and (
      public.is_admin()
      or audit_id is null
      or audit_id in (
        select id from public.audits
        where project_id in (select project_id from public.accessible_project_ids())
      )
    )
  );

-- ----------------------------------------------------------------------------
-- 4. Vue de commodité (optionnel) : audits + workflow_status + projet
-- ----------------------------------------------------------------------------
-- On ne crée pas de vue dédiée : tout le code lit `audits` directement, la
-- colonne y est désormais disponible via `select *`.

notify pgrst, 'reload schema';

commit;
