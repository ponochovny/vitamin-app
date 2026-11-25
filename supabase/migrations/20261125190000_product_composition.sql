alter table public.products
  add column if not exists composition text[] not null default '{}';

