-- 0008_storage.sql
-- Storage buckets for avatars and event photos (incl. live gallery).
-- Public read; authenticated upload; owners manage their own objects.
-- Non-destructive: insert-on-conflict-do-nothing and (re)create policies only.

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('event-photos', 'event-photos', true)
on conflict (id) do nothing;

-- Public read (buckets are public; this also covers signed clients).
drop policy if exists avatars_public_read on storage.objects;
create policy avatars_public_read
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists event_photos_public_read on storage.objects;
create policy event_photos_public_read
  on storage.objects for select
  using (bucket_id = 'event-photos');

-- Authenticated upload.
drop policy if exists avatars_auth_insert on storage.objects;
create policy avatars_auth_insert
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars');

drop policy if exists event_photos_auth_insert on storage.objects;
create policy event_photos_auth_insert
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'event-photos');

-- Owners may update/delete their own objects.
drop policy if exists avatars_owner_update on storage.objects;
create policy avatars_owner_update
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and owner = auth.uid());

drop policy if exists avatars_owner_delete on storage.objects;
create policy avatars_owner_delete
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and owner = auth.uid());

drop policy if exists event_photos_owner_update on storage.objects;
create policy event_photos_owner_update
  on storage.objects for update
  to authenticated
  using (bucket_id = 'event-photos' and owner = auth.uid());

drop policy if exists event_photos_owner_delete on storage.objects;
create policy event_photos_owner_delete
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'event-photos' and owner = auth.uid());
