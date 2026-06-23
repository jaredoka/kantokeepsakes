-- Trade completions: two-step trade flow (complete/dispute before rating)
create table trade_completions (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  status text not null check (status in ('completed', 'disputed', 'auto_completed')),
  created_at timestamptz not null default now(),
  constraint unique_trade_completion unique (listing_id, user_id)
);

create index idx_trade_completions_listing on trade_completions (listing_id);
create index idx_trade_completions_user on trade_completions (user_id);
create index idx_trade_completions_status on trade_completions (status);

alter table trade_completions enable row level security;

create policy "Trade completions are viewable by everyone"
  on trade_completions for select
  using (true);

create policy "Authenticated users can create trade completions"
  on trade_completions for insert
  with check (auth.uid() = user_id);

-- Admin can delete trade completions (for dispute resolution)
create policy "Admins can delete trade completions"
  on trade_completions for delete
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.id in (select unnest(string_to_array(current_setting('app.admin_ids', true), ','))::uuid)
    )
  );

-- Add trade_dispute to the report_reason enum
alter type report_reason add value if not exists 'trade_dispute';
