-- Auto-expire listings past their expires_at date
-- This function is called by pg_cron (if available) or the Vercel cron fallback

create or replace function expire_stale_listings()
returns void as $$
begin
  update listings
  set status = 'expired'
  where status = 'active'
    and expires_at < now();
end;
$$ language plpgsql security definer;

-- Schedule with pg_cron if the extension is available.
-- Supabase Pro plans include pg_cron; on free plans, use the API cron fallback.
-- Uncomment the lines below after enabling pg_cron in your Supabase dashboard:
--
-- select cron.schedule(
--   'expire-stale-listings',
--   '0 * * * *',  -- every hour
--   $$ select expire_stale_listings() $$
-- );
