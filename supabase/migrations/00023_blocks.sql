-- User blocking (M0/B6) — required for UGC app-store compliance.
-- Idempotent: safe to re-run.

create table if not exists blocks (
  blocker_id uuid not null references profiles (id) on delete cascade,
  blocked_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint no_self_block check (blocker_id <> blocked_id)
);

create index if not exists idx_blocks_blocked on blocks (blocked_id);

alter table blocks enable row level security;

-- Only the blocker sees and manages their own blocks; the blocked party
-- never learns who blocked them. Enforcement in API routes uses the
-- service-role client so it can see both directions.
drop policy if exists "Users manage their own blocks" on blocks;
create policy "Users manage their own blocks"
  on blocks for all
  using (auth.uid() = blocker_id)
  with check (auth.uid() = blocker_id);
