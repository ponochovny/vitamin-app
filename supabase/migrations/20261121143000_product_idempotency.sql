alter table public.products
  add column if not exists idempotency_key text;

create unique index if not exists products_idempotency_key_unique
  on public.products(idempotency_key)
  where idempotency_key is not null;
