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

-- Optional start time for an event, in UAE time (the master zone).
-- Without it an event is shown as "All day"; with it, the site converts the
-- event into all five zones exactly as it does for live classes. Add either
-- column and the site picks it up automatically:
--   start_time  a plain UAE wall-clock time, e.g. 18:00
--   starts_at   a full timestamp, if you would rather store the instant
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
-- Refer-a-friend (Conversation Club)
-- Every member gets a personal code (e.g. ML-7K2QD). When a friend signs up
-- with it, the member who invited them earns 50% off their next month once
-- the friend has paid. The friend pays the normal sign-up price.
-- (Re-run this whole file safely; it only adds what's missing.)
-- =========================================================

-- SECURITY FIX: members could previously edit their own profile row from the
-- browser, which included is_member. Nothing on the site needs that (all
-- profile changes happen on the server), so the policy is removed.
drop policy if exists "Users can update their own profile" on public.profiles;

alter table public.profiles add column if not exists referral_code text;
alter table public.profiles add column if not exists referred_by text;
-- Tick this (on the FRIEND's row) once you've given the inviter their 50% off.
alter table public.profiles add column if not exists referral_reward_given boolean not null default false;
create unique index if not exists profiles_referral_code_key on public.profiles (referral_code);

-- Makes a short, easy-to-read code like ML-7K2QD (no 0/O or 1/I mix-ups).
create or replace function public.make_referral_code()
returns text
language plpgsql
set search_path = public
as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  c text;
  i int;
begin
  loop
    c := 'ML-';
    for i in 1..5 loop
      c := c || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.profiles where referral_code = c);
  end loop;
  return c;
end;
$$;

-- New sign-ups: give them their own code, and remember whose code they used.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  ref text := upper(trim(coalesce(new.raw_user_meta_data->>'ref', '')));
begin
  if ref = '' or not exists (select 1 from public.profiles where referral_code = ref) then
    ref := null;
  end if;
  insert into public.profiles (id, email, referral_code, referred_by)
  values (new.id, new.email, public.make_referral_code(), ref)
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Existing members get a code too.
do $$
declare r record;
begin
  for r in select id from public.profiles where referral_code is null loop
    update public.profiles set referral_code = public.make_referral_code() where id = r.id;
  end loop;
end;
$$;

-- Lets a member see how many friends used their code (numbers only, no emails).
create or replace function public.my_referral_stats()
returns table (invited int, joined int)
language sql
stable
security definer set search_path = public
as $$
  select count(f.id)::int, (count(f.id) filter (where f.is_member))::int
  from public.profiles me
  join public.profiles f on f.referred_by = me.referral_code
  where me.id = auth.uid();
$$;
revoke all on function public.my_referral_stats() from public, anon;
grant execute on function public.my_referral_stats() to authenticated;

-- YOUR LIST: open "referral_rewards" in Table Editor to see who invited whom.
-- friend_paid = true and reward_given = false  ->  that member is owed 50% off.
create or replace view public.referral_rewards
with (security_invoker = true) as
  select
    me.email                 as member_email,
    me.referral_code         as member_code,
    f.email                  as friend_email,
    f.created_at             as friend_signed_up,
    f.is_member              as friend_paid,
    f.referral_reward_given  as reward_given
  from public.profiles f
  join public.profiles me on f.referred_by = me.referral_code
  order by f.created_at desc;
revoke all on public.referral_rewards from anon, authenticated;
