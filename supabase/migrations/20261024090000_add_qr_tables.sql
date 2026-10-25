with target_restaurant as (
  select id
  from public.restaurants
  where slug = 'restoflow-order'
), table_data(code, capacity) as (
  values
    ('1', 4),
    ('2', 4),
    ('3', 4),
    ('4', 4),
    ('5', 4)
)
insert into public.dining_tables (restaurant_id, code, capacity)
select target_restaurant.id, table_data.code, table_data.capacity
from target_restaurant
cross join table_data
on conflict (restaurant_id, code) do update
set capacity = excluded.capacity,
    is_active = true;
