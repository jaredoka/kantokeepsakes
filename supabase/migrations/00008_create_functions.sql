-- Update reputation score when a trade confirmation is created
create or replace function update_reputation()
returns trigger as $$
begin
  update profiles
  set
    completed_trades = (
      select count(*) from trade_confirmations where confirmed_user_id = new.confirmed_user_id
    ),
    reputation_score = (
      select coalesce(avg(rating), 0)::integer from trade_confirmations where confirmed_user_id = new.confirmed_user_id
    )
  where id = new.confirmed_user_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_trade_confirmation_created
  after insert on trade_confirmations
  for each row execute function update_reputation();

-- Update last_message_at on conversations when a new message is sent
create or replace function update_conversation_last_message()
returns trigger as $$
begin
  update conversations
  set last_message_at = new.created_at
  where id = new.conversation_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_message_created
  after insert on messages
  for each row execute function update_conversation_last_message();
