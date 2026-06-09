create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles (id) on delete cascade,
  reported_user_id uuid not null references profiles (id) on delete cascade,
  listing_id uuid references listings (id) on delete set null,
  reason report_reason not null,
  description text,
  status report_status not null default 'pending',
  created_at timestamptz not null default now()
);

create index idx_reports_status on reports (status);
create index idx_reports_reported_user on reports (reported_user_id);

alter table reports enable row level security;

create policy "Users can view their own reports"
  on reports for select
  using (auth.uid() = reporter_id);

create policy "Authenticated users can create reports"
  on reports for insert
  with check (auth.uid() = reporter_id);
