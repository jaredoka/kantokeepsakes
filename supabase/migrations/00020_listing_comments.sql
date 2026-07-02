-- Listing comment threads (G4): public community vetting on listings.
-- Idempotent: safe to re-run.

create table if not exists listing_comments (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists idx_listing_comments_listing
  on listing_comments (listing_id, created_at);

alter table listing_comments enable row level security;

drop policy if exists "Comments are viewable by everyone" on listing_comments;
create policy "Comments are viewable by everyone"
  on listing_comments for select
  using (true);

drop policy if exists "Authenticated users can comment" on listing_comments;
create policy "Authenticated users can comment"
  on listing_comments for insert
  with check (auth.uid() = user_id);

-- Authors may delete their own comments. Deliberately NOT the listing owner:
-- comments are community vetting, and owners must not be able to silence
-- scam warnings. Admins moderate via the policy below + reports.
drop policy if exists "Authors can delete their own comments" on listing_comments;
create policy "Authors can delete their own comments"
  on listing_comments for delete
  using (auth.uid() = user_id);

-- Uses the SECURITY DEFINER admin check from 00011 (a policy that queries
-- profiles directly recurses when profiles policies are evaluated)
drop policy if exists "Admins can delete any comment" on listing_comments;
create policy "Admins can delete any comment"
  on listing_comments for delete
  using (public.is_admin());
