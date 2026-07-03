-- 00024: add the messages table to the supabase_realtime publication.
--
-- postgres_changes subscriptions only receive events for tables in this
-- publication. It was never set up, so every realtime subscriber — the
-- website chat page, the website header unread badge, and the mobile chat
-- screen — has been silently receiving no events (verified S25: even a
-- service-role subscription gets nothing on INSERT). The UIs masked it:
-- sent messages append from the POST response and screens fetch on open.
--
-- RLS still applies to subscribers: only conversation participants can
-- SELECT a message row, so only they receive its events.
--
-- Idempotent — safe to re-run.

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;
