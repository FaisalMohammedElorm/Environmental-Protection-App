insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('reports', 'reports', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- avatars/{user_id}/... — public read (avatars are already shown publicly
-- in the UI), owner-only write/replace/delete.
create policy avatars_public_read on storage.objects
  for select using (bucket_id = 'avatars');

create policy avatars_owner_write on storage.objects
  for insert with check (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy avatars_owner_update on storage.objects
  for update using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy avatars_owner_delete on storage.objects
  for delete using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- reports/{report_id}/... is private and has no client-facing policy at
-- all: Express is the only writer (upload happens server-side, after
-- multer + magic-byte signature validation) and the only reader, issuing
-- short-lived signed URLs. It connects with the service-role key, which
-- bypasses storage RLS the same way the `postgres` role bypasses table RLS.
