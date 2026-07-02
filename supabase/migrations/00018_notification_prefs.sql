-- Per-user email notification preferences (G1)
-- Idempotent: safe to re-run.
alter table profiles add column if not exists notify_offers boolean not null default true;
alter table profiles add column if not exists notify_messages boolean not null default true;
alter table profiles add column if not exists notify_trades boolean not null default true;
