-- Migration: Create meal_entries table
-- Replaces localStorage with a Supabase PostgreSQL table.
-- Each row is a single meal log tied to the authenticated user.

-- 1. Create the table
create table public.meal_entries (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users (id) on delete cascade,
  date       text        not null,   -- YYYY-MM-DD format for easy client-side handling
  type       text        not null check (type in ('breakfast', 'lunch', 'dinner')),
  name       text        not null,
  created_at timestamptz not null default now(),

  -- Only one entry per user + date + meal type
  unique (user_id, date, type)
);

-- 2. Index for common query patterns
create index meal_entries_user_date_idx on public.meal_entries (user_id, date);

-- 3. Enable Row Level Security
alter table public.meal_entries enable row level security;

-- 4. RLS policies: users can only access their own rows
create policy "Users can view their own meals"
  on public.meal_entries
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own meals"
  on public.meal_entries
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own meals"
  on public.meal_entries
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own meals"
  on public.meal_entries
  for delete
  using (auth.uid() = user_id);
