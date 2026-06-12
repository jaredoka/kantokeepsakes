-- Add is_admin column to profiles (default false, already exists as boolean per schema)
-- The column was defined in the original schema but let's ensure it exists
-- and add admin-specific RLS policies

-- Allow admins to view all reports (not just their own)
create policy "Admins can view all reports"
  on reports for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

-- Allow admins to update report status
create policy "Admins can update reports"
  on reports for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

-- Allow admins to update profiles (for banning)
create policy "Admins can update any profile"
  on profiles for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

-- Allow admins to view all profiles
create policy "Admins can view all profiles"
  on profiles for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );
