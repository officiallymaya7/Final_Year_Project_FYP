-- ============================================================================
-- Creovator — backend setup for the newly wired features
-- Run this ONCE in your Supabase project: Dashboard → SQL Editor → New Query →
-- paste → Run. Everything uses IF NOT EXISTS / ON CONFLICT so it is safe to
-- re-run.
-- ============================================================================

-- pgcrypto gives us crypt() + gen_salt() for hashing admin passwords.
create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. ADMIN LOGIN  (used by the `admin-login` Edge Function)
-- ----------------------------------------------------------------------------
create table if not exists public.admins (
  id            uuid primary key default gen_random_uuid(),
  username      text unique not null,
  password_hash text not null,
  created_at    timestamptz not null default now()
);

alter table public.admins enable row level security;
-- No policies on purpose: only the Edge Function (service role) may read this
-- table. The service role bypasses RLS; the normal anon/auth client cannot.

-- Verifies a username/password against the hashed value and returns the admin
-- row on success. SECURITY DEFINER so it can read admins under RLS.
create or replace function public.verify_admin_login(p_username text, p_password text)
returns table (id uuid, username text)
language sql
security definer
set search_path = public
as $$
  select a.id, a.username
  from public.admins a
  where a.username = p_username
    and a.password_hash = crypt(p_password, a.password_hash);
$$;

-- Seed the default admin (same credentials as before: admin / admin123).
-- Change the password after first login by re-running the UPDATE below.
insert into public.admins (username, password_hash)
values ('admin', crypt('admin123', gen_salt('bf')))
on conflict (username) do nothing;

-- To change the admin password later:
--   update public.admins set password_hash = crypt('YOUR_NEW_PASSWORD', gen_salt('bf'))
--   where username = 'admin';

-- ----------------------------------------------------------------------------
-- 2. EMAIL LOGS  (written by the `send-email` Edge Function, counted by admin-stats)
-- ----------------------------------------------------------------------------
create table if not exists public.email_logs (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid references public.events(id) on delete set null,
  recipient_email text not null,
  recipient_name  text,
  subject         text,
  status          text not null default 'sent',   -- 'sent' | 'failed'
  error           text,
  created_at      timestamptz not null default now()
);

alter table public.email_logs enable row level security;
-- Only the Edge Functions (service role) touch this table, so no policies needed.

-- ----------------------------------------------------------------------------
-- 3. ID CARDS  (persisted best-effort from the ID Card generator in the browser)
-- ----------------------------------------------------------------------------
create table if not exists public.id_cards (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid references public.events(id) on delete cascade,
  participant_id uuid references public.participants(id) on delete cascade unique,
  list_name      text,
  day_number     int,
  file_url       text not null,
  updated_at     timestamptz not null default now(),
  created_at     timestamptz not null default now()
);

alter table public.id_cards enable row level security;

-- Organizers may manage ID-card rows for events they own.
drop policy if exists "Users manage id_cards for their events" on public.id_cards;
create policy "Users manage id_cards for their events"
  on public.id_cards for all
  using (exists (
    select 1 from public.events e
    where e.id = id_cards.event_id and e.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.events e
    where e.id = id_cards.event_id and e.user_id = auth.uid()
  ));

-- ----------------------------------------------------------------------------
-- 4. ID-CARDS STORAGE BUCKET  (public so generated cards can be linked/viewed)
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('id-cards', 'id-cards', true)
on conflict (id) do nothing;

drop policy if exists "Public read id-cards" on storage.objects;
create policy "Public read id-cards"
  on storage.objects for select
  using (bucket_id = 'id-cards');

drop policy if exists "Authenticated upload id-cards" on storage.objects;
create policy "Authenticated upload id-cards"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'id-cards');

drop policy if exists "Authenticated update id-cards" on storage.objects;
create policy "Authenticated update id-cards"
  on storage.objects for update to authenticated
  using (bucket_id = 'id-cards');
