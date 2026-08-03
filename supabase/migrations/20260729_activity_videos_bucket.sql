-- activity-videos bucket: public read for workflow walkthrough videos (iPhone/Safari playback).
-- Mirrors kb-extracted-images / content bucket conventions.

insert into storage.buckets (id, name, public, allowed_mime_types)
values (
  'activity-videos',
  'activity-videos',
  true,
  array['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/mpeg']
)
on conflict (id) do update set
  public = true,
  allowed_mime_types = array['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/mpeg'];

drop policy if exists "activity_videos_bucket_public_read" on storage.objects;
create policy "activity_videos_bucket_public_read" on storage.objects
  for select using (bucket_id = 'activity-videos');

drop policy if exists "activity_videos_bucket_superadmin_insert" on storage.objects;
create policy "activity_videos_bucket_superadmin_insert" on storage.objects
  for insert with check (
    bucket_id = 'activity-videos'
    and exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'superadmin')
  );

drop policy if exists "activity_videos_bucket_superadmin_update" on storage.objects;
create policy "activity_videos_bucket_superadmin_update" on storage.objects
  for update using (
    bucket_id = 'activity-videos'
    and exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'superadmin')
  );

drop policy if exists "activity_videos_bucket_superadmin_delete" on storage.objects;
create policy "activity_videos_bucket_superadmin_delete" on storage.objects
  for delete using (
    bucket_id = 'activity-videos'
    and exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'superadmin')
  );
