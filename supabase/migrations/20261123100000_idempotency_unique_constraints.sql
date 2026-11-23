drop index if exists public.products_idempotency_key_unique;
alter table public.products
  add constraint products_idempotency_key_unique unique (idempotency_key);

drop index if exists public.logs_idempotency_key_unique;
alter table public.logs
  add constraint logs_idempotency_key_unique unique (idempotency_key);
