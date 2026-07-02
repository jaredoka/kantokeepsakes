-- Admin role: is_admin column + admin RLS policies.
-- Idempotent: safe to re-run.
--
-- History: the original version assumed is_admin already existed (it never
-- did) and wrote policies on profiles that queried profiles inside their
-- USING clause — which errors with "infinite recursion detected in policy
-- for relation profiles" (42P17) the moment they apply, breaking every
-- profiles join in the app. The admin check now lives in a SECURITY DEFINER
-- function, which evaluates without re-triggering RLS.

alter table profiles add column if not exists is_admin boolean not null default false;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_admin from profiles p where p.id = auth.uid()),
    false
  )
$$;

-- Allow admins to view all reports (not just their own)
drop policy if exists "Admins can view all reports" on reports;
create policy "Admins can view all reports"
  on reports for select
  using (public.is_admin());

-- Allow admins to update report status
drop policy if exists "Admins can update reports" on reports;
create policy "Admins can update reports"
  on reports for update
  using (public.is_admin());

-- Allow admins to update profiles (for banning)
drop policy if exists "Admins can update any profile" on profiles;
create policy "Admins can update any profile"
  on profiles for update
  using (public.is_admin());

-- Note: no admin SELECT policy on profiles — 00002 already makes profiles
-- viewable by everyone, and a self-referential select policy is what caused
-- the recursion.
drop policy if exists "Admins can view all profiles" on profiles;

-- Allow admins to update any listing (the ban flow removes the banned
-- user's listings; without this policy that update silently matched 0 rows)
drop policy if exists "Admins can update any listing" on listings;
create policy "Admins can update any listing"
  on listings for update
  using (public.is_admin());
