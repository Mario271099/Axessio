-- ============================================================================
-- Axessio · Phase 6 — Bucket Supabase Storage `nc-attachments`
-- ----------------------------------------------------------------------------
-- - Bucket privé (jamais public)
-- - Limite : 5 Mo par fichier
-- - Types autorisés : image/png, image/jpeg, image/webp, application/pdf
-- - Convention de chemin : `<audit_id>/<nc_id>/<uuid>.<extension>`
--
-- Policies RLS sur storage.objects :
--   SELECT : auditeur OU client_admin du client de l'audit
--   INSERT : idem (et l'objet est créé par auth.uid())
--   DELETE : owner = auth.uid() (uniquement son propre upload)
--
-- Idempotent.
-- ============================================================================

-- 1) Création / mise à jour du bucket ---------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'nc-attachments',
  'nc-attachments',
  false,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 2) Helper : accès à un audit pour l'utilisateur courant -------------------
-- Vrai si auditeur OU client_admin du client de l'audit.
-- Le client_member n'est volontairement PAS inclus (cohérent avec nc_can_access).
create or replace function public.audit_accessible_for_attachments(p_audit_id uuid)
returns boolean
language sql stable
security definer set search_path = public
as $$
  select exists(
    select 1
    from public.audits   a
    join public.projects p on p.id = a.project_id
    where a.id = p_audit_id
      and (
        public.is_auditor()
        or (public.current_role() = 'client_admin' and p.client_id = public.current_client_id())
      )
  )
$$;

-- 3) Policies storage.objects · scope = bucket nc-attachments --------------
-- Drop existing (idempotence)
drop policy if exists nc_attach_storage_select on storage.objects;
drop policy if exists nc_attach_storage_insert on storage.objects;
drop policy if exists nc_attach_storage_delete on storage.objects;

-- SELECT : voir un fichier si on a accès à l'audit (1er segment du path)
create policy nc_attach_storage_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'nc-attachments'
    and public.audit_accessible_for_attachments(
      ((storage.foldername(name))[1])::uuid
    )
  );

-- INSERT : uploader si on a accès à l'audit, et l'objet est créé en notre nom
create policy nc_attach_storage_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'nc-attachments'
    and owner = auth.uid()
    and public.audit_accessible_for_attachments(
      ((storage.foldername(name))[1])::uuid
    )
  );

-- DELETE : uniquement son propre upload (owner = uploader)
create policy nc_attach_storage_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'nc-attachments'
    and owner = auth.uid()
  );
