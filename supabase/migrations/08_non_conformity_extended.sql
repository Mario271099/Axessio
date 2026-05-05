-- ============================================================================
-- Axessio · Phase 6 — Backend pour l'édition complète des Non-Conformités
-- ----------------------------------------------------------------------------
-- - criteria : ajout de methodology + expected_result (rempli plus tard)
-- - nc_status : extension avec TO_FIX, FIXED, FALSE_POSITIVE
-- - non_conformities : ajout de actual_result
-- - nc_messages : nouveau fil de discussion auditor <-> client_admin
-- - nc_attachments : extension (uploaded_by, file_name, file_size)
-- - Helper nc_can_access(uuid)
-- - RLS recâblé pour nc_messages et nc_attachments
--
-- Idempotent. À exécuter en transaction unique.
-- ============================================================================

begin;

-- 1) Enrichissement de la table criteria ------------------------------------
alter table public.criteria
  add column if not exists methodology      text,
  add column if not exists expected_result  text;

-- 2) Extension de l'enum nc_status ------------------------------------------
-- PG 12+ permet ADD VALUE dans une transaction tant qu'on n'utilise pas la
-- nouvelle valeur dans la même transaction.
alter type public.nc_status add value if not exists 'TO_FIX';
alter type public.nc_status add value if not exists 'FIXED';
alter type public.nc_status add value if not exists 'FALSE_POSITIVE';

-- 3) Enrichissement de la table non_conformities ---------------------------
-- recommendation et updated_at + trigger existent déjà (cf. 00_init_schema.sql).
alter table public.non_conformities
  add column if not exists actual_result text;

-- 4) Table nc_messages : fil de discussion ---------------------------------
create table if not exists public.nc_messages (
  id                uuid primary key default gen_random_uuid(),
  non_conformity_id uuid not null references public.non_conformities(id) on delete cascade,
  author_id         uuid not null references public.profiles(id),
  body              text not null,
  created_at        timestamptz not null default now()
);

create index if not exists idx_nc_messages_nc_created
  on public.nc_messages(non_conformity_id, created_at);

alter table public.nc_messages enable row level security;

-- 5) Extension de la table nc_attachments existante -------------------------
-- (cf. 00_init_schema.sql : la table existe déjà avec storage_path, mime_type,
--  size_bytes, kind, created_at). On ajoute les colonnes manquantes sans
--  casser l'existant. Elles restent nullables pour préserver l'idempotence
--  vis-à-vis d'éventuelles lignes pré-existantes.
alter table public.nc_attachments
  add column if not exists uploaded_by uuid references public.profiles(id),
  add column if not exists file_name   text,
  add column if not exists file_size   int;

create index if not exists idx_nc_attachments_nc
  on public.nc_attachments(non_conformity_id);

-- 6) Helper SECURITY DEFINER : un user voit-il / peut-il agir sur cette NC ?
-- ----------------------------------------------------------------------------
-- Vrai si :
--   - l'utilisateur est auditeur (accès total)
--   - OU est client_admin du client de l'audit auquel la NC est rattachée
-- Le client_member n'est volontairement PAS inclus (fil réservé auditor + admin).
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
      )
  )
$$;

-- 7) RLS · nc_messages ------------------------------------------------------
drop policy if exists nc_messages_select   on public.nc_messages;
drop policy if exists nc_messages_insert   on public.nc_messages;
drop policy if exists nc_messages_update   on public.nc_messages;
drop policy if exists nc_messages_delete   on public.nc_messages;

create policy nc_messages_select on public.nc_messages
  for select to authenticated
  using (public.nc_can_access(non_conformity_id));

create policy nc_messages_insert on public.nc_messages
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and public.nc_can_access(non_conformity_id)
  );

create policy nc_messages_update on public.nc_messages
  for update to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

create policy nc_messages_delete on public.nc_messages
  for delete to authenticated
  using (author_id = auth.uid());

-- 8) RLS · nc_attachments — réécriture --------------------------------------
-- On supprime les anciennes policies (héritées de 01_rls_policies.sql) qui
-- réservaient l'écriture à l'auditeur, pour autoriser aussi les client_admin
-- à uploader dans le fil.
drop policy if exists attach_select        on public.nc_attachments;
drop policy if exists attach_admin         on public.nc_attachments;
drop policy if exists nc_attach_select     on public.nc_attachments;
drop policy if exists nc_attach_insert     on public.nc_attachments;
drop policy if exists nc_attach_update     on public.nc_attachments;
drop policy if exists nc_attach_delete     on public.nc_attachments;

create policy nc_attach_select on public.nc_attachments
  for select to authenticated
  using (public.nc_can_access(non_conformity_id));

create policy nc_attach_insert on public.nc_attachments
  for insert to authenticated
  with check (
    uploaded_by = auth.uid()
    and public.nc_can_access(non_conformity_id)
  );

create policy nc_attach_update on public.nc_attachments
  for update to authenticated
  using (uploaded_by = auth.uid())
  with check (uploaded_by = auth.uid());

create policy nc_attach_delete on public.nc_attachments
  for delete to authenticated
  using (uploaded_by = auth.uid());

commit;
