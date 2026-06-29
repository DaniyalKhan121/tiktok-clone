-- Adds the `title` column needed by the upload flow, plus storage buckets
-- for raw video files and generated thumbnails.

alter table public.videos add column title text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('videos', 'videos', true, 104857600, array['video/mp4'])
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('thumbnails', 'thumbnails', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Video files are publicly readable"
  on storage.objects for select
  using (bucket_id = 'videos');

create policy "Users can upload their own video files"
  on storage.objects for insert
  with check (bucket_id = 'videos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete their own video files"
  on storage.objects for delete
  using (bucket_id = 'videos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Thumbnails are publicly readable"
  on storage.objects for select
  using (bucket_id = 'thumbnails');

create policy "Users can upload their own thumbnails"
  on storage.objects for insert
  with check (bucket_id = 'thumbnails' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can update their own thumbnails"
  on storage.objects for update
  using (bucket_id = 'thumbnails' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete their own thumbnails"
  on storage.objects for delete
  using (bucket_id = 'thumbnails' and (storage.foldername(name))[1] = auth.uid()::text);
