-- Run this in Supabase -> SQL Editor (once).

-- =========================================================
-- TIME ZONE — read this before adding classes or events.
-- =========================================================
-- Every time you type into Supabase is treated as UAE (Dubai) time. That is the
-- ONLY time that is ever stored. The website converts it on the fly and shows it
-- for UAE, Mexico, the USA, Europe and Asia — daylight saving included — so you
-- never add a second column, or a second row, for another country.
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
-- typed in UAE time) and the members area shows every region's clock.
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
-- join_url (Zoom/Meet link), note (optional). Members see every region's clock.
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
-- OPPORTUNITIES — the paid job board for companies
-- (Re-run this whole file safely; it only adds what's missing.)
-- =========================================================

-- Who is allowed to run the board. Flip this to true for yourself once, in
-- Table Editor -> profiles, and you get the admin screen at /admin/opportunities.
alter table public.profiles add column if not exists is_admin boolean not null default false;

-- Used by the policies below. `security definer` so a policy can check the flag
-- without every table needing its own read access to profiles.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
$$;

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),

  -- What the job is
  title text not null,
  company_name text not null,
  -- The account that owns the listing (a company logging in, or you posting on
  -- their behalf). Kept on auth.users so there is no second accounts system.
  company_id uuid references auth.users(id) on delete set null,
  description text,
  requirements text,
  category text,

  -- Where it is
  location text,
  country text,
  work_type text check (work_type in ('remote', 'on-site', 'hybrid')),

  -- Who it is for
  language_requirements text,
  english_level text,
  salary text,

  -- How to apply
  application_url text,
  application_email text,
  deadline date,

  -- Publishing + payment. A listing only goes public once status = 'published',
  -- which is how an unpaid draft stays invisible until the invoice clears.
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  is_paid boolean not null default false,
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'pending', 'paid', 'refunded')),
  payment_id text,
  published_at timestamptz,
  expires_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The board is read as "live listings, newest first", then narrowed by the
-- filters on the page, so those are the columns worth indexing.
create index if not exists opportunities_live_idx on public.opportunities (status, published_at desc);
create index if not exists opportunities_expires_idx on public.opportunities (expires_at);
create index if not exists opportunities_company_idx on public.opportunities (company_id);
create index if not exists opportunities_country_idx on public.opportunities (country);
create index if not exists opportunities_category_idx on public.opportunities (category);
create index if not exists opportunities_work_type_idx on public.opportunities (work_type);

-- Keep the moderation and payment columns honest. A company can write its own
-- listing, but it cannot publish itself, mark itself paid, or hand the listing to
-- somebody else — only an admin (or a trusted server-side job, where there is no
-- auth.uid(): the Stripe webhook, the SQL Editor, the Table Editor) can do that.
create or replace function public.opportunities_before_insert()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.company_id := auth.uid();
    new.status := 'draft';
    new.is_paid := false;
    new.payment_status := 'unpaid';
    new.payment_id := null;
    new.published_at := null;
  end if;
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;

create or replace function public.opportunities_before_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.updated_at := now();
  if auth.uid() is not null and not public.is_admin() then
    new.company_id := old.company_id;
    new.status := old.status;
    new.is_paid := old.is_paid;
    new.payment_status := old.payment_status;
    new.payment_id := old.payment_id;
    new.published_at := old.published_at;
    new.expires_at := old.expires_at;
  end if;
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists opportunities_insert_guard on public.opportunities;
create trigger opportunities_insert_guard
  before insert on public.opportunities
  for each row execute function public.opportunities_before_insert();

drop trigger if exists opportunities_update_guard on public.opportunities;
create trigger opportunities_update_guard
  before update on public.opportunities
  for each row execute function public.opportunities_before_update();

alter table public.opportunities enable row level security;

-- Everyone, logged in or not, sees published listings that have not expired.
drop policy if exists "Anyone can view live opportunities" on public.opportunities;
create policy "Anyone can view live opportunities"
  on public.opportunities for select to anon, authenticated
  using (status = 'published' and (expires_at is null or expires_at > now()));

-- A company also sees its own drafts; an admin sees everything.
drop policy if exists "Owners and admins view their opportunities" on public.opportunities;
create policy "Owners and admins view their opportunities"
  on public.opportunities for select to authenticated
  using (company_id = auth.uid() or public.is_admin());

drop policy if exists "Owners and admins add opportunities" on public.opportunities;
create policy "Owners and admins add opportunities"
  on public.opportunities for insert to authenticated
  with check (company_id = auth.uid() or public.is_admin());

drop policy if exists "Owners and admins edit their opportunities" on public.opportunities;
create policy "Owners and admins edit their opportunities"
  on public.opportunities for update to authenticated
  using (company_id = auth.uid() or public.is_admin())
  with check (company_id = auth.uid() or public.is_admin());

drop policy if exists "Owners and admins remove their opportunities" on public.opportunities;
create policy "Owners and admins remove their opportunities"
  on public.opportunities for delete to authenticated
  using (company_id = auth.uid() or public.is_admin());
