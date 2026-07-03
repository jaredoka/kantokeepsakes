-- Sold listings must be publicly viewable (M2/S27 fix).
--
-- The original SELECT policy exposed only active listings (plus your own),
-- which broke the trade flow's rating step: once both parties complete and
-- the listing flips to 'sold', the offerer could no longer see the listing
-- page — or rate — at all (POST /api/trade-confirmations reads the listing
-- with the user's client and 404'd). This never surfaced because the sold
-- flip itself was silently failing under RLS whenever the second completer
-- was the offerer (fixed in the same session by using the admin client in
-- /api/trade-completions). Sold listings are also linked from public
-- profile archives, so there is no privacy concern.
-- Idempotent: safe to re-run.

drop policy if exists "Active listings are viewable by everyone" on listings;
drop policy if exists "Active and sold listings are viewable by everyone" on listings;
create policy "Active and sold listings are viewable by everyone"
  on listings for select
  using (status in ('active', 'sold') or auth.uid() = user_id);
