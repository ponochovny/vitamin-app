create index if not exists logs_product_id_idx
  on public.logs (product_id)
  where product_id is not null;

create or replace function public.recalculate_logs_for_product()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.quantity <= 0
    or new.chars ->> 'nutritionKnown' = 'false'
  then
    return new;
  end if;

  update public.logs as log
  set
    calories = coalesce((new.chars ->> 'calories')::numeric, 0)
      * log.quantity / new.quantity,
    proteins = coalesce((new.chars ->> 'proteins')::numeric, 0)
      * log.quantity / new.quantity,
    fats = coalesce((new.chars ->> 'fats')::numeric, 0)
      * log.quantity / new.quantity,
    carbs = coalesce((new.chars ->> 'carbs')::numeric, 0)
      * log.quantity / new.quantity
  where log.product_id = new.id
    and log.user_id = new.user_id;

  return new;
end;
$$;

update public.logs as log
set
  calories = coalesce((product.chars ->> 'calories')::numeric, 0)
    * log.quantity / product.quantity,
  proteins = coalesce((product.chars ->> 'proteins')::numeric, 0)
    * log.quantity / product.quantity,
  fats = coalesce((product.chars ->> 'fats')::numeric, 0)
    * log.quantity / product.quantity,
  carbs = coalesce((product.chars ->> 'carbs')::numeric, 0)
    * log.quantity / product.quantity
from public.products as product
where log.product_id = product.id
  and log.user_id = product.user_id
  and product.chars ->> 'nutritionKnown' is distinct from 'false';

create trigger recalculate_logs_for_product
after update of quantity, chars on public.products
for each row
when (
  old.quantity is distinct from new.quantity
  or old.chars -> 'calories' is distinct from new.chars -> 'calories'
  or old.chars -> 'proteins' is distinct from new.chars -> 'proteins'
  or old.chars -> 'fats' is distinct from new.chars -> 'fats'
  or old.chars -> 'carbs' is distinct from new.chars -> 'carbs'
  or old.chars -> 'nutritionKnown' is distinct from new.chars -> 'nutritionKnown'
)
execute function public.recalculate_logs_for_product();
