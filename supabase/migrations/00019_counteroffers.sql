-- Counteroffers (G3): negotiation threads on offers.
-- Idempotent: safe to re-run.
--
-- Model: each turn in a negotiation is an offers row. `parent_offer_id`
-- chains turns; `author_id` is who wrote the turn (null = the offerer, for
-- backwards compatibility). `offerer_id` stays the non-owner party on every
-- row so existing queries, RLS and trade logic keep working.

alter table offers add column if not exists parent_offer_id uuid references offers (id) on delete cascade;
alter table offers add column if not exists author_id uuid references profiles (id) on delete cascade;

create index if not exists idx_offers_parent on offers (parent_offer_id);

alter type offer_status add value if not exists 'countered';

-- Listing owners may insert counter rows on their own listings
drop policy if exists "Listing owners can counter offers" on offers;
create policy "Listing owners can counter offers"
  on offers for insert
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from listings
      where listings.id = offers.listing_id
        and listings.user_id = auth.uid()
    )
  );

-- Offerers may respond to owner-authored turns (accept/decline a counter),
-- but never update their own turns
drop policy if exists "Offerers can respond to counteroffers" on offers;
create policy "Offerers can respond to counteroffers"
  on offers for update
  using (
    auth.uid() = offerer_id
    and author_id is not null
    and author_id <> auth.uid()
  );
