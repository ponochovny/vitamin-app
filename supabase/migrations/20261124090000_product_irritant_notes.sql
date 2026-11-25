alter table public.products
  add column if not exists irritant_ingredient text,
  add column if not exists irritant_reason text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'products_irritant_note_pair_check'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_irritant_note_pair_check
      check ((irritant_ingredient is null) = (irritant_reason is null));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'products_irritant_ingredient_length_check'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_irritant_ingredient_length_check
      check (
        irritant_ingredient is null
        or char_length(btrim(irritant_ingredient)) between 1 and 120
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'products_irritant_reason_length_check'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_irritant_reason_length_check
      check (
        irritant_reason is null
        or char_length(btrim(irritant_reason)) between 1 and 400
      );
  end if;
end;
$$;
