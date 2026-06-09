create table conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings (id) on delete cascade,
  participant_1 uuid not null references profiles (id) on delete cascade,
  participant_2 uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  constraint unique_conversation unique (listing_id, participant_1, participant_2)
);

create index idx_conversations_participant_1 on conversations (participant_1);
create index idx_conversations_participant_2 on conversations (participant_2);
create index idx_conversations_listing_id on conversations (listing_id);
create index idx_conversations_last_message on conversations (last_message_at desc);

alter table conversations enable row level security;

create policy "Participants can view their conversations"
  on conversations for select
  using (auth.uid() = participant_1 or auth.uid() = participant_2);

create policy "Authenticated users can create conversations"
  on conversations for insert
  with check (auth.uid() = participant_1 or auth.uid() = participant_2);

create policy "Participants can update their conversations"
  on conversations for update
  using (auth.uid() = participant_1 or auth.uid() = participant_2);
