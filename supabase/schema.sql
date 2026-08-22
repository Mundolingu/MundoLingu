-- Run this in Supabase -> SQL Editor (once).

-- =========================================================
-- TIME ZONE — read this before adding classes or events.
-- =========================================================
-- Every time you type into Supabase is treated as UAE (Dubai) time, and the
-- members area shows it in BOTH UAE and Mexico City time automatically.
--
-- This line makes Postgres read a plain "2026-09-01 18:00" as 6pm in Dubai
-- instead of 6pm UTC, so you never have to think about offsets:
alter database postgres set timezone to 'Asia/Dubai';
-- (Reload the Supabase dashboard afterwards so the change takes effect. If your
--  project refuses this command, just type the offset yourself instead —
--  "2026-09-01 18:00+04" — and everything still lines up.)


create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  stripe_customer_id text,
  is_member boolean not null default false,
  subscription_status text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Automatically create a profile row whenever someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- =========================================================
-- Learning hub: events calendar + workbook hand-in
-- (Re-run this whole file safely; it only adds what's missing.)
-- =========================================================

-- Upcoming events. Add rows here (Table Editor) to manage the members calendar.
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  event_date date not null,
  title text not null,
  description text,
  created_at timestamptz not null default now()
);

-- Events can now have a time, not just a day. Fill in `starts_at` (date & time,
-- typed in UAE time) and the members area shows both UAE and Mexico City times.
-- Leave `starts_at` empty for an all-day event and only `event_date` is shown.
alter table public.events add column if not exists starts_at timestamptz;
alter table public.events alter column event_date drop not null;

-- REPEATING EVENTS. Set `repeat` to 'weekly' and the event shows up on the same
-- weekday, at the same UAE time, every week — the members area lists its next
-- few dates automatically, so you only ever add the row once. Leave `repeat`
-- empty for a normal one-off event. `repeat_until` is optional: set it to the
-- last date you want it to run, or leave it empty to keep going indefinitely.
alter table public.events add column if not exists repeat text;
alter table public.events add column if not exists repeat_until timestamptz;

-- The weekly Conversation Club: every Saturday, 23:00 UAE time
-- (= 1:00 PM Saturday in Mexico City). The date below is just the first
-- Saturday it runs; the members area rolls it forward week by week.
insert into public.events (title, description, starts_at, repeat)
select
  'Conversation Club',
  'Our weekly drop-in speaking session. No slides, no homework — just come and talk.',
  timestamptz '2026-08-22 23:00+04',
  'weekly'
where not exists (
  select 1 from public.events where lower(title) = 'conversation club'
);
alter table public.events enable row level security;
drop policy if exists "Members can view events" on public.events;
create policy "Members can view events"
  on public.events for select to authenticated using (true);

-- Workbook submissions (members hand in their completed work).
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  email text,
  workbook text,
  file_path text,
  created_at timestamptz not null default now()
);
alter table public.submissions enable row level security;
drop policy if exists "Members add their own submissions" on public.submissions;
create policy "Members add their own submissions"
  on public.submissions for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Members view their own submissions" on public.submissions;
create policy "Members view their own submissions"
  on public.submissions for select to authenticated using (auth.uid() = user_id);

-- Private storage bucket for the handed-in files.
insert into storage.buckets (id, name, public)
values ('submissions', 'submissions', false)
on conflict (id) do nothing;

drop policy if exists "Members upload their submissions" on storage.objects;
create policy "Members upload their submissions"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'submissions' and (storage.foldername(name))[1] = auth.uid()::text);


-- =========================================================
-- Manage-your-hub tables: add rows in Supabase Table Editor
-- (Re-run this whole file safely; it only adds what's missing.)
-- =========================================================

-- VIDEO LESSONS. Columns: title, level (e.g. "12 min · A2"), video_url (YouTube link), sort
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  level text,
  video_url text,
  sort int default 0,
  created_at timestamptz not null default now()
);
alter table public.lessons enable row level security;
drop policy if exists "Members view lessons" on public.lessons;
create policy "Members view lessons" on public.lessons for select to authenticated using (true);

-- LIVE CLASSES. Columns: title, starts_at (date & time, typed in UAE time),
-- join_url (Zoom/Meet link), note (optional). Members see it in UAE + Mexico time.
create table if not exists public.live_classes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  starts_at timestamptz not null,
  join_url text,
  note text,
  created_at timestamptz not null default now()
);
alter table public.live_classes enable row level security;
drop policy if exists "Members view live classes" on public.live_classes;
create policy "Members view live classes" on public.live_classes for select to authenticated using (true);

-- WORKBOOKS. Columns: title, label (e.g. "March"), pdf_url (link to the PDF), sort
create table if not exists public.workbooks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  label text,
  pdf_url text,
  sort int default 0,
  created_at timestamptz not null default now()
);
alter table public.workbooks enable row level security;
drop policy if exists "Members view workbooks" on public.workbooks;
create policy "Members view workbooks" on public.workbooks for select to authenticated using (true);

-- Optional cover image for workbooks
alter table public.workbooks add column if not exists cover_url text;
