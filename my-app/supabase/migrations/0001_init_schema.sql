-- Initial schema for TikTok clone: profiles, videos, likes, comments, follows, notifications.
-- See docs/CONTEXT.md for the full data-model rationale.
-- Apply via the Supabase SQL editor, or `supabase db push` once the project is linked.

create extension if not exists "pgcrypto";

-- =========================================================================
-- profiles
-- =========================================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  display_name text,
  avatar_url text,
  bio text,
  followers_count int not null default 0,
  following_count int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are publicly readable"
  on public.profiles for select
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- =========================================================================
-- videos
-- =========================================================================
create table public.videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  video_url text not null,
  thumbnail_url text,
  description text,
  hashtags text[] not null default '{}',
  duration_seconds numeric,
  status text not null default 'processing' check (status in ('processing', 'published', 'failed')),
  likes_count int not null default 0,
  comments_count int not null default 0,
  views_count bigint not null default 0,
  created_at timestamptz not null default now()
);

create index videos_user_id_idx on public.videos (user_id);
create index videos_status_created_at_idx on public.videos (status, created_at desc);
create index videos_hashtags_idx on public.videos using gin (hashtags);

alter table public.videos enable row level security;

create policy "Published videos are publicly readable"
  on public.videos for select
  using (status = 'published' or user_id = auth.uid());

create policy "Users can insert their own videos"
  on public.videos for insert
  with check (user_id = auth.uid());

create policy "Users can update their own videos"
  on public.videos for update
  using (user_id = auth.uid());

create policy "Users can delete their own videos"
  on public.videos for delete
  using (user_id = auth.uid());

-- =========================================================================
-- likes
-- =========================================================================
create table public.likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  video_id uuid not null references public.videos (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, video_id)
);

create index likes_video_id_idx on public.likes (video_id);

alter table public.likes enable row level security;

create policy "Likes are publicly readable"
  on public.likes for select
  using (true);

create policy "Users can like as themselves"
  on public.likes for insert
  with check (user_id = auth.uid());

create policy "Users can remove their own like"
  on public.likes for delete
  using (user_id = auth.uid());

-- =========================================================================
-- comments
-- =========================================================================
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  parent_comment_id uuid references public.comments (id) on delete cascade,
  body text not null check (char_length(body) <= 300),
  likes_count int not null default 0,
  created_at timestamptz not null default now()
);

create index comments_video_id_idx on public.comments (video_id);

alter table public.comments enable row level security;

create policy "Comments are publicly readable"
  on public.comments for select
  using (true);

create policy "Users can comment as themselves"
  on public.comments for insert
  with check (user_id = auth.uid());

create policy "Users can delete their own comment"
  on public.comments for delete
  using (user_id = auth.uid());

-- =========================================================================
-- follows
-- =========================================================================
create table public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (follower_id, following_id),
  check (follower_id <> following_id)
);

create index follows_follower_id_idx on public.follows (follower_id);
create index follows_following_id_idx on public.follows (following_id);

alter table public.follows enable row level security;

create policy "Follows are publicly readable"
  on public.follows for select
  using (true);

create policy "Users can follow as themselves"
  on public.follows for insert
  with check (follower_id = auth.uid());

create policy "Users can unfollow as themselves"
  on public.follows for delete
  using (follower_id = auth.uid());

-- =========================================================================
-- notifications
-- =========================================================================
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('like', 'comment', 'follow', 'reply')),
  video_id uuid references public.videos (id) on delete cascade,
  comment_id uuid references public.comments (id) on delete cascade,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_recipient_id_created_at_idx on public.notifications (recipient_id, created_at desc);

alter table public.notifications enable row level security;

create policy "Users can read their own notifications"
  on public.notifications for select
  using (recipient_id = auth.uid());

create policy "Users can mark their own notifications as read"
  on public.notifications for update
  using (recipient_id = auth.uid());

-- =========================================================================
-- counters: keep likes_count / comments_count / followers_count / following_count in sync
-- =========================================================================
create function public.handle_like_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    update public.videos set likes_count = likes_count + 1 where id = new.video_id;
  elsif (tg_op = 'DELETE') then
    update public.videos set likes_count = likes_count - 1 where id = old.video_id;
  end if;
  return null;
end;
$$;

create trigger on_like_change
  after insert or delete on public.likes
  for each row execute function public.handle_like_change();

create function public.handle_comment_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    update public.videos set comments_count = comments_count + 1 where id = new.video_id;
  elsif (tg_op = 'DELETE') then
    update public.videos set comments_count = comments_count - 1 where id = old.video_id;
  end if;
  return null;
end;
$$;

create trigger on_comment_change
  after insert or delete on public.comments
  for each row execute function public.handle_comment_change();

create function public.handle_follow_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    update public.profiles set following_count = following_count + 1 where id = new.follower_id;
    update public.profiles set followers_count = followers_count + 1 where id = new.following_id;
  elsif (tg_op = 'DELETE') then
    update public.profiles set following_count = following_count - 1 where id = old.follower_id;
    update public.profiles set followers_count = followers_count - 1 where id = old.following_id;
  end if;
  return null;
end;
$$;

create trigger on_follow_change
  after insert or delete on public.follows
  for each row execute function public.handle_follow_change();

-- =========================================================================
-- auto-create a profile row whenever a new auth.users row is created
-- =========================================================================
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'username', 'user_' || substr(new.id::text, 1, 8))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================================
-- storage: avatars bucket
-- =========================================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Avatar images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
