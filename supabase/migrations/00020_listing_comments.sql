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

-- profiles.is_admin was assumed by 00011 but never actually created —
-- ensure it exists before referencing it (idempotent)
alter table profiles add column if not exists is_admin boolean not null default false;

drop policy if exists "Admins can delete any comment" on listing_comments;
create policy "Admins can delete any comment"
  on listing_comments for delete
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.is_admin
    )
  );
