create table trade_confirmations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings (id) on delete cascade,
  confirmer_id uuid not null references profiles (id) on delete cascade,
  confirmed_user_id uuid not null references profiles (id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz not null default now(),
  constraint unique_confirmation unique (listing_id, confirmer_id)
);

create index idx_trade_confirmations_listing on trade_confirmations (listing_id);
create index idx_trade_confirmations_confirmed_user on trade_confirmations (confirmed_user_id);

alter table trade_confirmations enable row level security;

create policy "Trade confirmations are viewable by everyone"
  on trade_confirmations for select
  using (true);

create policy "Authenticated users can create trade confirmations"
  on trade_confirmations for insert
  with check (auth.uid() = confirmer_id);
