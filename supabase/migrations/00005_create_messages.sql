create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations (id) on delete cascade,
  sender_id uuid not null references profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  is_read boolean not null default false
);

create index idx_messages_conversation_id on messages (conversation_id, created_at);
create index idx_messages_sender_id on messages (sender_id);

alter table messages enable row level security;

create policy "Conversation participants can view messages"
  on messages for select
  using (
    exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
      and (auth.uid() = c.participant_1 or auth.uid() = c.participant_2)
    )
  );

create policy "Conversation participants can send messages"
  on messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from conversations c
      where c.id = conversation_id
      and (auth.uid() = c.participant_1 or auth.uid() = c.participant_2)
    )
  );

create policy "Recipients can mark messages as read"
  on messages for update
  using (
    sender_id != auth.uid()
    and exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
      and (auth.uid() = c.participant_1 or auth.uid() = c.participant_2)
    )
  )
  with check (is_read = true);
