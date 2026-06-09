create table listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  type listing_type not null,
  title text not null,
  description text,
  category listing_category not null,
  language listing_language not null default 'any',
  price decimal,
  currency text not null default 'BND' check (currency in ('BND', 'USD', 'MYR', 'SGD')),
  images text[] default '{}',
  status listing_status not null default 'active',
  created_at timestamptz not null default now(),
  bumped_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);

create index idx_listings_user_id on listings (user_id);
create index idx_listings_status on listings (status);
create index idx_listings_bumped_at on listings (bumped_at desc);
create index idx_listings_category on listings (category);
create index idx_listings_type on listings (type);

-- Full-text search index
alter table listings add column fts tsvector
  generated always as (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))) stored;
create index idx_listings_fts on listings using gin (fts);

alter table listings enable row level security;

create policy "Active listings are viewable by everyone"
  on listings for select
  using (status = 'active' or auth.uid() = user_id);

create policy "Authenticated users can create listings"
  on listings for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own listings"
  on listings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own listings"
  on listings for delete
  using (auth.uid() = user_id);
