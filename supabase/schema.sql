-- Run this in Supabase -> SQL Editor (once).

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

-- Optional start time for an event, in UAE/Dubai time (the reference zone).
-- Without it the event is shown as "All day"; with it, the site converts the
-- event into each customer's own timezone exactly as it does for live classes.
-- Set either column and the site picks it up automatically:
--   start_time  a plain Dubai wall-clock time, e.g. 18:00 (used with event_date)
--   starts_at   a full timestamptz, if you would rather store the instant
--               directly (takes precedence over start_time)
alter table public.events add column if not exists start_time time;
alter table public.events add column if not exists starts_at timestamptz;

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

-- LIVE CLASSES. Columns: title, starts_at (date & time), join_url (Zoom/Meet link), note (optional)
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


-- =========================================================
-- INTERNATIONAL TIMEZONES  (additive — safe to re-run)
--
-- One class = one real-world moment. That moment lives in `starts_at`
-- (timestamptz), which Postgres stores as an absolute instant. Nothing here
-- stores an offset, and nothing adds or subtracts hours: the website renders
-- the instant into each customer's IANA timezone, so daylight-saving changes
-- are handled by the timezone database, not by us.
--
-- The scheduling / reference zone is Asia/Dubai.
-- =========================================================

-- 1. Where the customer wants to see their times. Lives on the EXISTING
--    profile row — no second user or account table.
alter table public.profiles add column if not exists timezone text;

comment on column public.profiles.timezone is
  'IANA timezone id chosen by the member, e.g. Asia/Dubai, America/Mexico_City. Null = detect from the browser.';

-- 2. How long a class/event runs, so "Live now" and "Ended" are exact.
--    Optional: leave it null and the site assumes 60 minutes.
alter table public.live_classes add column if not exists duration_minutes int;
alter table public.events       add column if not exists duration_minutes int;

-- 3. Optional join link for events, so an online event behaves like a class.
alter table public.events add column if not exists join_url text;

-- 4. Scheduling helper: give it Dubai wall-clock text, get back the exact
--    instant. Correct across daylight-saving boundaries anywhere, because
--    Postgres resolves the zone itself.
--
--      insert into public.live_classes (title, starts_at, join_url)
--      values ('Live Spanish Class', public.dubai('2026-09-15 18:00'), 'https://…');
--
create or replace function public.dubai(wall_clock text)
returns timestamptz
language sql
immutable
as $$
  select (wall_clock::timestamp at time zone 'Asia/Dubai');
$$;

comment on function public.dubai(text) is
  'Reads "YYYY-MM-DD HH:MM" as Dubai local time and returns the absolute instant.';

-- Read your schedule back in Dubai time to check it:
--   select title, starts_at at time zone 'Asia/Dubai' as dubai_time
--   from public.live_classes order by starts_at;


-- =========================================================
-- PAID-ACCESS HARDENING  (additive — safe to re-run)
--
-- Members-only content was readable by ANY logged-in account, including one
-- that had never paid: `for select to authenticated using (true)`. The hub
-- hid it in the UI, but the join links were reachable straight from the API.
-- These policies move the check into the database.
-- =========================================================

-- Single source of truth for "this account has paid access".
-- security definer so the check works from inside a policy on another table.
create or replace function public.is_paid_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_member from public.profiles where id = auth.uid()), false);
$$;

revoke all on function public.is_paid_member() from public, anon;
grant execute on function public.is_paid_member() to authenticated;

-- Video lessons
drop policy if exists "Members view lessons" on public.lessons;
create policy "Members view lessons"
  on public.lessons for select to authenticated using (public.is_paid_member());

-- Live classes (title, times, notes AND the private join_url)
drop policy if exists "Members view live classes" on public.live_classes;
create policy "Members view live classes"
  on public.live_classes for select to authenticated using (public.is_paid_member());

-- Events
drop policy if exists "Members can view events" on public.events;
drop policy if exists "Members view events" on public.events;
create policy "Members view events"
  on public.events for select to authenticated using (public.is_paid_member());

-- Workbooks
drop policy if exists "Members view workbooks" on public.workbooks;
create policy "Members view workbooks"
  on public.workbooks for select to authenticated using (public.is_paid_member());

-- Members may edit only their OWN profile, and only their timezone.
-- Previously the update policy allowed a signed-in account to set its own
-- is_member / subscription_status flag and grant itself paid access.
-- Membership is written exclusively by the Stripe webhook (service role),
-- which is unaffected by these grants.
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

revoke update on public.profiles from authenticated;
grant update (timezone) on public.profiles to authenticated;

-- Members should be able to read back the files they handed in.
drop policy if exists "Members read their submissions" on storage.objects;
create policy "Members read their submissions"
  on storage.objects for select to authenticated
  using (bucket_id = 'submissions' and (storage.foldername(name))[1] = auth.uid()::text);
