-- Push notification tokens for the mobile app (M0/B4).
-- Idempotent: safe to re-run.

create table if not exists push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  token text not null unique,
  platform text not null check (platform in ('ios', 'android')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_push_tokens_user on push_tokens (user_id);

alter table push_tokens enable row level security;

drop policy if exists "Users manage their own push tokens" on push_tokens;
create policy "Users manage their own push tokens"
  on push_tokens for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
