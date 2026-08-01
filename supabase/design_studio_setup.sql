-- Run this once in your Supabase project's SQL editor
-- (Dashboard -> SQL Editor -> New Query -> paste this -> Run)

create table if not exists public.designs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  template_id text not null,
  name text not null,
  category text not null,
  canvas_json jsonb not null,
  thumbnail_url text,
  created_at timestamptz not null default now()
);

alter table public.designs enable row level security;

-- Each user can only see / manage their own saved designs
create policy "Users can view their own designs"
  on public.designs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own designs"
  on public.designs for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own designs"
  on public.designs for update
  using (auth.uid() = user_id);

create policy "Users can delete their own designs"
  on public.designs for delete
  using (auth.uid() = user_id);
