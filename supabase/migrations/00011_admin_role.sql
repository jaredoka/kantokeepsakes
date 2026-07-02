-- Admin role: is_admin column + admin RLS policies.
-- Idempotent: safe to re-run.
--
-- Note: the original version of this migration assumed is_admin already
-- existed and failed on a fresh database ("column profiles.is_admin does
-- not exist"). It now creates the column itself.

alter table profiles add column if not exists is_admin boolean not null default false;

-- Allow admins to view all reports (not just their own)
drop policy if exists "Admins can view all reports" on reports;
create policy "Admins can view all reports"
  on reports for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

-- Allow admins to update report status
drop policy if exists "Admins can update reports" on reports;
create policy "Admins can update reports"
  on reports for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

-- Allow admins to update profiles (for banning)
drop policy if exists "Admins can update any profile" on profiles;
create policy "Admins can update any profile"
  on profiles for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

-- Allow admins to view all profiles
drop policy if exists "Admins can view all profiles" on profiles;
create policy "Admins can view all profiles"
  on profiles for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );
