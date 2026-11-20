alter table public.profiles
  add column if not exists plan_preset text not null default 'balanced',
  add column if not exists daily_targets jsonb not null default
    '{"calories":2000,"proteins":100,"fats":70,"carbs":250,"beveragesMl":2000}'::jsonb;

alter table public.drinks
  add column if not exists entry_date date not null default current_date;
