-- ============================================================================
-- Axessio · Avatars utilisateur
-- ----------------------------------------------------------------------------
-- 1) Ajoute `profiles.avatar_url` (URL publique vers l'objet uploadé).
-- 2) Crée le bucket `avatars` PUBLIC en lecture (les URLs sont devinables
--    seulement si on a l'UUID du profil → exposition acceptable, pas de
--    données sensibles dans une image de profil).
-- 3) Policies storage.objects :
--    - SELECT public (le bucket est public).
--    - INSERT/UPDATE/DELETE uniquement par le propriétaire de l'objet, qui
--      doit coïncider avec le 1er segment du path (`<profile_id>/<file>`).
--
-- Convention de chemin : `<profile_id>/<uuid>.<ext>`. L'app génère l'UUID à
-- chaque upload pour casser les caches CDN sur changement d'avatar.
--
-- Idempotent.
-- ============================================================================

alter table public.profiles
  add column if not exists avatar_url text;

-- 1) Bucket avatars (public en lecture) -------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152, -- 2 Mo : un avatar n'a aucune raison d'être plus gros.
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 2) Policies storage.objects ------------------------------------------------
drop policy if exists avatars_storage_select on storage.objects;
drop policy if exists avatars_storage_insert on storage.objects;
drop policy if exists avatars_storage_update on storage.objects;
drop policy if exists avatars_storage_delete on storage.objects;

-- SELECT public : le bucket est marqué public, mais on garde la policy
-- explicite pour qu'un re-publish accidentel ne coupe pas l'accès.
create policy avatars_storage_select on storage.objects
  for select to public
  using (bucket_id = 'avatars');

-- INSERT : l'objet doit appartenir à auth.uid() ET être placé dans le
-- préfixe `<auth.uid()>/`. Empêche un user d'uploader sous l'UUID d'un autre.
create policy avatars_storage_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and owner = auth.uid()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- UPDATE : remplacer son propre avatar (overwrite). Même contrainte de
-- propriété — un user ne peut pas réécrire l'avatar d'un autre.
create policy avatars_storage_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and owner = auth.uid()
  )
  with check (
    bucket_id = 'avatars'
    and owner = auth.uid()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- DELETE : uniquement son propre upload.
create policy avatars_storage_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and owner = auth.uid()
  );
