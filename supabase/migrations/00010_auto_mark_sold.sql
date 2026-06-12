-- Auto-mark listing as sold when both parties have confirmed the trade
create or replace function auto_mark_listing_sold()
returns trigger as $$
declare
  confirmation_count integer;
begin
  select count(*) into confirmation_count
  from trade_confirmations
  where listing_id = new.listing_id;

  if confirmation_count >= 2 then
    update listings
    set status = 'sold'
    where id = new.listing_id
      and status = 'active';
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger on_trade_confirmation_mark_sold
  after insert on trade_confirmations
  for each row execute function auto_mark_listing_sold();

-- Fix reputation_score to store avg * 10 (matching application logic)
create or replace function update_reputation()
returns trigger as $$
begin
  update profiles
  set
    completed_trades = (
      select count(*) from trade_confirmations where confirmed_user_id = new.confirmed_user_id
    ),
    reputation_score = (
      select round(coalesce(avg(rating), 0) * 10)::integer
      from trade_confirmations
      where confirmed_user_id = new.confirmed_user_id
    )
  where id = new.confirmed_user_id;
  return new;
end;
$$ language plpgsql security definer;
