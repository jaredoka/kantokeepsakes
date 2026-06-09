create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null,
  avatar_url text,
  bio text,
  reputation_score integer not null default 0,
  completed_trades integer not null default 0,
  created_at timestamptz not null default now(),
  is_banned boolean not null default false,
  last_active_at timestamptz not null default now()
);

create index idx_profiles_username on profiles (username);

alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on profiles for select
  using (true);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);
