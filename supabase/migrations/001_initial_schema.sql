create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  profile jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan jsonb not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists workout_plans_one_active_per_user
  on public.workout_plans (user_id)
  where is_active;

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  result jsonb not null,
  completed_at timestamptz not null
);

create index if not exists workout_sessions_user_completed_at_idx
  on public.workout_sessions (user_id, completed_at desc);

create table if not exists public.nutrition_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists nutrition_plans_user_created_at_idx
  on public.nutrition_plans (user_id, created_at desc);

create table if not exists public.coach_media_assets (
  id uuid primary key default gen_random_uuid(),
  asset_key text not null unique,
  exercise_id text,
  media_type text not null check (media_type in ('video', 'audio')),
  storage_path text not null,
  public_url text,
  title_he text not null,
  text_he text,
  priority integer not null default 0
);

alter table public.profiles enable row level security;
alter table public.workout_plans enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.nutrition_plans enable row level security;
alter table public.coach_media_assets enable row level security;

create policy "Users manage their own profiles"
  on public.profiles for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own workout plans"
  on public.workout_plans for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own workout sessions"
  on public.workout_sessions for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own nutrition plans"
  on public.nutrition_plans for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Authenticated users read coach media metadata"
  on public.coach_media_assets for select to authenticated
  using (true);

insert into storage.buckets (id, name, public)
values ('coach-media', 'coach-media', true)
on conflict (id) do update set public = excluded.public;

create policy "Authenticated users read coach media files"
  on storage.objects for select to authenticated
  using (bucket_id = 'coach-media');
