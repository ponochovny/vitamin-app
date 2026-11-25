create table if not exists public.reaction_observations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  food_log_id uuid references public.logs(id) on delete cascade,
  drink_id uuid references public.drinks(id) on delete cascade,
  observed_at timestamptz not null,
  note text,
  created_at timestamptz not null default now(),
  constraint reaction_observations_one_entry_check
    check (
      (food_log_id is not null)::int
      + (drink_id is not null)::int
      = 1
    ),
  constraint reaction_observations_note_length_check
    check (note is null or char_length(btrim(note)) <= 400)
);

create unique index if not exists reaction_observations_food_log_unique
  on public.reaction_observations(food_log_id)
  where food_log_id is not null;

create unique index if not exists reaction_observations_drink_unique
  on public.reaction_observations(drink_id)
  where drink_id is not null;

alter table public.reaction_observations enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'reaction_observations'
      and policyname = 'reaction_observations_owner'
  ) then
    create policy reaction_observations_owner
      on public.reaction_observations
      for all to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end;
$$;
