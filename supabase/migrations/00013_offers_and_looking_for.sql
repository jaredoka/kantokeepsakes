-- Add "looking for" fields to listings for WTB/WTS two-section layout
alter table listings add column if not exists looking_for_description text;
alter table listings add column if not exists looking_for_images text[] default '{}';

-- Create offer status enum
do $$ begin
  create type offer_status as enum ('pending', 'accepted', 'declined');
exception when duplicate_object then null;
end $$;

-- Create offers table (idempotent: safe to re-run)
create table if not exists offers (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings (id) on delete cascade,
  offerer_id uuid not null references profiles (id) on delete cascade,
  message text,
  front_image text,
  back_image text,
  status offer_status not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists idx_offers_listing on offers (listing_id);
create index if not exists idx_offers_offerer on offers (offerer_id);
create index if not exists idx_offers_status on offers (status);

alter table offers enable row level security;

-- Offerers can view their own offers
drop policy if exists "Users can view their own offers" on offers;
create policy "Users can view their own offers"
  on offers for select
  using (auth.uid() = offerer_id);

-- Listing owners can view all offers on their listings
drop policy if exists "Listing owners can view offers on their listings" on offers;
create policy "Listing owners can view offers on their listings"
  on offers for select
  using (
    exists (
      select 1 from listings
      where listings.id = offers.listing_id
        and listings.user_id = auth.uid()
    )
  );

-- Authenticated users can create offers
drop policy if exists "Authenticated users can create offers" on offers;
create policy "Authenticated users can create offers"
  on offers for insert
  with check (auth.uid() = offerer_id);

-- Listing owners can update offer status (accept/decline)
drop policy if exists "Listing owners can update offer status" on offers;
create policy "Listing owners can update offer status"
  on offers for update
  using (
    exists (
      select 1 from listings
      where listings.id = offers.listing_id
        and listings.user_id = auth.uid()
    )
  );
