-- ============================================================================
-- Axessio · Auto-remplissage de `projects.organization_id` + `workspace_id`
-- ----------------------------------------------------------------------------
-- Convention legacy (cf. migration 43) : `clients.id == organizations.id`.
-- Le code applicatif fait déjà la propagation côté server action, mais on
-- ajoute un trigger SECURITY DEFINER comme garde-fou — si une future
-- insertion oublie de positionner organization_id ou workspace_id, on
-- comble les vides avant que les NOT NULL ne tapent.
--
-- - organization_id : déduit du client_id (convention id partagé)
-- - workspace_id    : déduit du workspace `default` de l'organisation
--                     (auto-créé par mig. 54 `handle_new_organization_workspace`)
--
-- Le trigger est `before insert or update of (client_id, organization_id)`.
-- Il ne touche pas une valeur déjà fournie — il ne fait que combler le vide.
--
-- Idempotent.
-- ============================================================================

begin;

create or replace function public.sync_project_organization_id()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Cas 1 : organization_id non fourni mais client_id présent → on déduit.
  if new.organization_id is null and new.client_id is not null then
    new.organization_id := new.client_id;
  end if;

  -- Cas 2 : client_id change après-coup → on resynchronise pour éviter
  -- les incohérences (très rare, mais à 0 coût pour le trigger).
  if tg_op = 'UPDATE'
     and new.client_id is distinct from old.client_id
     and new.client_id is not null
  then
    new.organization_id := new.client_id;
  end if;

  -- Cas 3 : workspace_id non fourni → on prend le workspace `default` de
  --         l'organisation. Si l'org n'a pas de default workspace (cas
  --         dégénéré), on laisse null et le NOT NULL fera son office.
  if new.workspace_id is null and new.organization_id is not null then
    select id into new.workspace_id
      from public.workspaces
     where organization_id = new.organization_id
       and is_default = true
     limit 1;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_project_org on public.projects;
create trigger trg_sync_project_org
  before insert or update of client_id, organization_id, workspace_id on public.projects
  for each row execute function public.sync_project_organization_id();

notify pgrst, 'reload schema';

commit;
