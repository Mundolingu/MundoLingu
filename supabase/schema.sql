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
