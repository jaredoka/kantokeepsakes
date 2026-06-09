-- Automatically create a profile row when a new user signs up.
-- The username is passed via auth.signUp({ options: { data: { username } } })
-- and stored in auth.users.raw_user_meta_data.
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    new.raw_user_meta_data ->> 'username'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
