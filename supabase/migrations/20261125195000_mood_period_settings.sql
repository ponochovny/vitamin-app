alter table public.profiles
  add column if not exists mood_periods jsonb not null default
  '{
    "morning":{"label":"Ранок","question":"Як прокинувся?","anchor":"wake"},
    "day":{"label":"День","question":"Як минає день?","anchor":"midday"},
    "evening":{"label":"Вечір","question":"Як пройшов день?","anchor":"sleep"}
  }'::jsonb;
