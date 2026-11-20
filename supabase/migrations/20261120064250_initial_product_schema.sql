create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  locale text not null default 'uk-UA',
  timezone text not null default 'Europe/Kyiv',
  day_start time not null default '06:00',
  day_end time not null default '06:00',
  consent_health boolean not null default false,
  consent_photos boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  quantity numeric not null check (quantity > 0),
  chars jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.diary_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  entry_date date not null,
  quantity numeric not null check (quantity > 0),
  nutrition jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  target numeric not null,
  unit text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.wellbeing_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  value jsonb not null,
  recorded_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.drinks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  volume_ml numeric not null check (volume_ml > 0),
  recorded_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  level integer check (level between 1 and 5),
  details jsonb not null default '{}'::jsonb,
  recorded_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  date date not null,
  calories numeric not null default 0,
  proteins numeric not null default 0,
  fats numeric not null default 0,
  carbs numeric not null default 0,
  quantity numeric not null default 0,
  vitamins jsonb not null default '{}'::jsonb,
  idempotency_key text,
  created_at timestamptz not null default now()
);

alter table public.logs
  add column if not exists idempotency_key text;
alter table public.logs
  add column if not exists product_id uuid references public.products(id) on delete set null;
alter table public.logs
  add column if not exists quantity numeric not null default 0;

create unique index if not exists logs_idempotency_key_unique
  on public.logs(idempotency_key)
  where idempotency_key is not null;

alter table public.logs
  drop constraint if exists logs_idempotency_key_check;

alter table public.products enable row level security;
alter table public.diary_entries enable row level security;
alter table public.goals enable row level security;
alter table public.wellbeing_entries enable row level security;
alter table public.drinks enable row level security;
alter table public.activities enable row level security;
alter table public.profiles enable row level security;
alter table public.logs enable row level security;

create policy "profiles_owner" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "products_owner" on public.products
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "diary_entries_owner" on public.diary_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "goals_owner" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "wellbeing_entries_owner" on public.wellbeing_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "drinks_owner" on public.drinks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "activities_owner" on public.activities
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "logs_owner" on public.logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
