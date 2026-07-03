-- Saved listings / watchlist (M2-3).
-- The feature table had claimed this existed since the early sessions; the
-- table was never created in any migration. First real implementation.
-- Idempotent: safe to re-run.

create table if not exists saved_listings (
  user_id uuid not null references profiles (id) on delete cascade,
  listing_id uuid not null references listings (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create index if not exists idx_saved_listings_listing on saved_listings (listing_id);

alter table saved_listings enable row level security;

-- Bookmarks are private: only the saver sees and manages their own rows.
drop policy if exists "Users manage their own saved listings" on saved_listings;
create policy "Users manage their own saved listings"
  on saved_listings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
