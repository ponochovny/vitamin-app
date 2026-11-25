create table if not exists public.user_drink_types (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('coffee', 'tea', 'other')),
  name text not null,
  name_key text generated always as (lower(name)) stored,
  irritant_ingredient text,
  irritant_reason text,
  created_at timestamptz not null default now(),
  constraint user_drink_types_name_length_check
    check (char_length(btrim(name)) between 1 and 120),
  constraint user_drink_types_irritant_pair_check
    check ((irritant_ingredient is null) = (irritant_reason is null)),
  constraint user_drink_types_irritant_ingredient_length_check
    check (
      irritant_ingredient is null
      or char_length(btrim(irritant_ingredient)) between 1 and 120
    ),
  constraint user_drink_types_irritant_reason_length_check
    check (
      irritant_reason is null
      or char_length(btrim(irritant_reason)) between 1 and 400
    ),
  constraint user_drink_types_user_name_key
    unique (user_id, name_key),
  constraint user_drink_types_user_id_kind_key
    unique (user_id, id, kind)
);

alter table public.drinks
  add column if not exists drink_type_id uuid,
  add column if not exists drink_name text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'drinks_user_drink_type_fkey'
      and conrelid = 'public.drinks'::regclass
  ) then
    alter table public.drinks
      add constraint drinks_user_drink_type_fkey
      foreign key (user_id, drink_type_id, kind)
      references public.user_drink_types(user_id, id, kind)
      on delete set null (drink_type_id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'drinks_water_cannot_have_type_check'
      and conrelid = 'public.drinks'::regclass
  ) then
    alter table public.drinks
      add constraint drinks_water_cannot_have_type_check
      check (kind <> 'water' or drink_type_id is null);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'drinks_type_requires_name_check'
      and conrelid = 'public.drinks'::regclass
  ) then
    alter table public.drinks
      add constraint drinks_type_requires_name_check
      check (
        drink_type_id is null
        or (
          kind in ('coffee', 'tea', 'other')
          and drink_name is not null
          and char_length(btrim(drink_name)) between 1 and 120
        )
      );
  end if;
end;
$$;

create index if not exists drinks_user_drink_type_idx
  on public.drinks(user_id, drink_type_id, kind)
  where drink_type_id is not null;

alter table public.user_drink_types enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_drink_types'
      and policyname = 'user_drink_types_owner'
  ) then
    create policy user_drink_types_owner on public.user_drink_types
      for all to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end;
$$;
