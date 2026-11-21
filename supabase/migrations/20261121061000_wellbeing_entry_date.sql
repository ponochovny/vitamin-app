alter table public.wellbeing_entries
  add column if not exists entry_date date;

update public.wellbeing_entries
set entry_date = (recorded_at at time zone 'Europe/Kyiv')::date
where entry_date is null;

alter table public.wellbeing_entries
  alter column entry_date set default current_date,
  alter column entry_date set not null;

create unique index if not exists wellbeing_entries_period_unique
  on public.wellbeing_entries(user_id, entry_date, (value->>'period'))
  where kind = 'mood';
