-- ============================================================================
-- Migration 28 : visibilité workflow (filtre, stagnation, KPIs)
-- ----------------------------------------------------------------------------
-- Trois ajouts pour rendre l'avancement du workflow lisible côté UI :
--
--   1. `audits.workflow_changed_at` : timestamp dénormalisé du dernier
--      changement de workflow_status. Permet d'afficher "stagnant depuis X
--      jours" en O(1) sans rejoindre `audit_logs` à chaque rendu de liste.
--      Maintenu par le trigger existant `log_audit_workflow_change`.
--
--   2. RPC `audits_workflow_breakdown()` : compte les audits par
--      workflow_status (sur le périmètre RLS de l'utilisateur courant).
--
--   3. RPC `audits_avg_review_time_seconds()` : temps moyen passé en
--      `in_review` (calculé depuis audit_logs) — KPI de fluidité du process.
--
-- Idempotente.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. Colonne dénormalisée + backfill
-- ----------------------------------------------------------------------------
alter table public.audits
  add column if not exists workflow_changed_at timestamptz;

-- Backfill : pour chaque audit, on récupère la date de la dernière transition
-- workflow connue dans `audit_logs`. Si aucun log (audit créé avant migration
-- 24), on retombe sur `updated_at` qui est une approximation raisonnable.
update public.audits a
   set workflow_changed_at = coalesce(
     (select max(created_at) from public.audit_logs l
       where l.audit_id = a.id and l.action = 'workflow.transition'),
     a.updated_at
   )
 where workflow_changed_at is null;

-- Désormais la colonne ne peut plus être null — un audit existe toujours
-- avec une date de "dernier changement" (au pire = created_at via updated_at).
alter table public.audits
  alter column workflow_changed_at set not null,
  alter column workflow_changed_at set default now();

create index if not exists idx_audits_workflow_changed_at
  on public.audits(workflow_changed_at desc);

-- ----------------------------------------------------------------------------
-- 2. Trigger : maintenir workflow_changed_at à chaque transition
-- ----------------------------------------------------------------------------
-- On enrichit le trigger existant (migration 24) qui ne faisait qu'écrire
-- dans audit_logs. Il met désormais aussi à jour la colonne dénormalisée
-- AVANT que l'UPDATE ne soit committé.
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
    -- 1) Trace dans audit_logs
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

    -- 2) Mise à jour de la colonne dénormalisée — on évite un second UPDATE
    -- en mutant NEW directement (trigger BEFORE…). Le trigger actuel est
    -- AFTER UPDATE, on bascule donc en BEFORE pour pouvoir muter NEW.
    new.workflow_changed_at := now();
  end if;
  return new;
end;
$$;

-- Bascule du trigger AFTER → BEFORE pour pouvoir muter NEW.
drop trigger if exists trg_log_audit_workflow on public.audits;
create trigger trg_log_audit_workflow
  before update of workflow_status on public.audits
  for each row execute function public.log_audit_workflow_change();

-- ----------------------------------------------------------------------------
-- 3. RPC : breakdown par workflow_status (RLS-aware)
-- ----------------------------------------------------------------------------
-- Sécurisé via SECURITY INVOKER (par défaut) : les filtres RLS s'appliquent
-- depuis le `auth.uid()` de l'appelant. Un client ne verra donc que ses
-- propres audits.
drop function if exists public.audits_workflow_breakdown();
create or replace function public.audits_workflow_breakdown()
returns table(
  draft_count       integer,
  in_review_count   integer,
  validated_count   integer,
  delivered_count   integer
)
language sql
stable
as $$
  select
    count(*) filter (where workflow_status = 'draft')::int      as draft_count,
    count(*) filter (where workflow_status = 'in_review')::int  as in_review_count,
    count(*) filter (where workflow_status = 'validated')::int  as validated_count,
    count(*) filter (where workflow_status = 'delivered')::int  as delivered_count
  from public.audits;
$$;

-- ----------------------------------------------------------------------------
-- 4. RPC : temps moyen passé en in_review (KPI de fluidité)
-- ----------------------------------------------------------------------------
-- On calcule la durée moyenne entre une transition `→ in_review` et la
-- transition suivante (vers draft ou validated). Si un audit est encore en
-- in_review, il n'est pas pris en compte (pas de "fin" de période connue).
--
-- Si moins de N transitions terminées, on renvoie null (signal "pas assez
-- de données").
drop function if exists public.audits_avg_review_time_seconds();
create or replace function public.audits_avg_review_time_seconds()
returns numeric
language sql
stable
as $$
  with review_periods as (
    select
      l.audit_id,
      l.created_at as started_at,
      lead(l.created_at) over (
        partition by l.audit_id order by l.created_at
      ) as ended_at
    from public.audit_logs l
    where l.action = 'workflow.transition'
      and (l.payload->>'to') = 'in_review'
  )
  select avg(extract(epoch from (ended_at - started_at)))::numeric
    from review_periods
   where ended_at is not null;
$$;

notify pgrst, 'reload schema';

commit;
