insert into public.restaurants (slug, name, description, service_fee, tax_rate, theme_palette_slug)
values (
  'restoflow-order',
  'RestoFlow Order',
  'Demo restoran untuk aplikasi pemesanan online.',
  6000,
  0,
  'terracotta-spice'
)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  service_fee = excluded.service_fee,
  tax_rate = excluded.tax_rate,
  theme_palette_slug = excluded.theme_palette_slug;

with target_restaurant as (
  select id
  from public.restaurants
  where slug = 'restoflow-order'
),
table_data(code, capacity) as (
  values
    ('A12', 4),
    ('A13', 4),
    ('B01', 2)
)
insert into public.dining_tables (restaurant_id, code, capacity)
select target_restaurant.id, table_data.code, table_data.capacity
from target_restaurant
cross join table_data
on conflict (restaurant_id, code) do update
set capacity = excluded.capacity;

with target_restaurant as (
  select id
  from public.restaurants
  where slug = 'restoflow-order'
),
category_data(name, slug, sort_order) as (
  values
    ('Best Seller', 'best-seller', 1),
    ('Makanan Berat', 'makanan-berat', 2),
    ('Makanan Ringan', 'makanan-ringan', 3),
    ('Minuman', 'minuman', 4),
    ('Paket Hemat', 'paket-hemat', 5)
)
insert into public.categories (restaurant_id, name, slug, sort_order)
select
  target_restaurant.id,
  category_data.name,
  category_data.slug,
  category_data.sort_order
from target_restaurant
cross join category_data
on conflict (restaurant_id, slug) do update
set
  name = excluded.name,
  sort_order = excluded.sort_order;

with target_restaurant as (
  select id
  from public.restaurants
  where slug = 'restoflow-order'
),
menu_data(name, slug, description, price, prep_minutes, sort_order, is_featured) as (
  values
    (
      'Ayam Bakar Madu',
      'ayam-bakar-madu',
      'Ayam bakar juicy dengan nasi hangat, sambal matah, dan lalapan segar.',
      38000,
      18,
      1,
      true
    ),
    (
      'Sapi Lada Hitam',
      'sapi-lada-hitam',
      'Irisan sapi tumis lada hitam dengan paprika dan saus gurih pedas.',
      52000,
      20,
      2,
      false
    ),
    (
      'Nasi Goreng Kampung',
      'nasi-goreng-kampung',
      'Nasi goreng gurih dengan telur mata sapi, ayam suwir, dan acar.',
      34000,
      15,
      3,
      false
    ),
    (
      'Chicken Katsu Curry',
      'chicken-katsu-curry',
      'Chicken katsu renyah dengan saus kari Jepang dan nasi pulen.',
      44000,
      18,
      4,
      false
    ),
    (
      'Mie Goreng Seafood',
      'mie-goreng-seafood',
      'Mie goreng wok hei dengan cumi, udang, dan sayuran segar.',
      42000,
      16,
      5,
      false
    ),
    (
      'Truffle Fries',
      'truffle-fries',
      'Kentang goreng renyah dengan parmesan dan mayonnaise truffle.',
      26000,
      10,
      6,
      false
    ),
    (
      'Chicken Pop Bites',
      'chicken-pop-bites',
      'Potongan ayam crispy dengan saus smoky mayo pedas manis.',
      28000,
      10,
      7,
      false
    ),
    (
      'Tahu Cabe Garam',
      'tahu-cabe-garam',
      'Tahu crispy dengan taburan cabe, bawang putih, dan daun jeruk.',
      22000,
      8,
      8,
      false
    ),
    (
      'Pisang Karamel Keju',
      'pisang-karamel-keju',
      'Pisang goreng hangat dengan saus karamel dan topping keju lembut.',
      24000,
      8,
      9,
      false
    ),
    (
      'Garlic Bread Melt',
      'garlic-bread-melt',
      'Roti panggang gurih dengan garlic butter dan keju mozzarella.',
      21000,
      8,
      10,
      false
    ),
    (
      'Lychee Yakult Spark',
      'lychee-yakult-spark',
      'Minuman sparkling manis segar untuk teman makan siang atau malam.',
      18000,
      5,
      11,
      false
    ),
    (
      'Es Kopi Aren',
      'es-kopi-aren',
      'Espresso dingin dengan susu segar dan gula aren yang creamy.',
      20000,
      5,
      12,
      false
    ),
    (
      'Matcha Cloud Latte',
      'matcha-cloud-latte',
      'Latte matcha lembut dengan foam susu yang ringan dan creamy.',
      24000,
      6,
      13,
      false
    ),
    (
      'Lemon Tea Dingin',
      'lemon-tea-dingin',
      'Teh lemon dingin yang segar dan ringan untuk semua menu.',
      16000,
      4,
      14,
      false
    ),
    (
      'Chocolate Hazelnut Shake',
      'chocolate-hazelnut-shake',
      'Milkshake cokelat hazelnut dingin dengan rasa rich dan lembut.',
      27000,
      6,
      15,
      false
    ),
    (
      'Paket Ayam Hemat',
      'paket-ayam-hemat',
      'Ayam bakar, nasi, sambal, dan lemon tea dalam satu paket hemat.',
      49000,
      15,
      16,
      false
    ),
    (
      'Paket Katsu Duo',
      'paket-katsu-duo',
      'Chicken katsu curry dengan garlic bread dan minuman pilihan.',
      57000,
      16,
      17,
      false
    ),
    (
      'Paket Sharing Snack',
      'paket-sharing-snack',
      'Truffle fries, chicken pop bites, dan dua pilihan saus favorit.',
      45000,
      10,
      18,
      false
    ),
    (
      'Paket Lunch Beef',
      'paket-lunch-beef',
      'Sapi lada hitam, nasi hangat, dan lemon tea untuk makan siang.',
      61000,
      16,
      19,
      false
    ),
    (
      'Paket Tea Time',
      'paket-tea-time',
      'Pisang karamel keju, garlic bread melt, dan matcha cloud latte.',
      46000,
      10,
      20,
      false
    )
)
insert into public.menu_items (
  restaurant_id,
  name,
  slug,
  description,
  price,
  preparation_time_minutes,
  sort_order,
  is_featured
)
select
  target_restaurant.id,
  menu_data.name,
  menu_data.slug,
  menu_data.description,
  menu_data.price,
  menu_data.prep_minutes,
  menu_data.sort_order,
  menu_data.is_featured
from target_restaurant
join menu_data on true
on conflict (restaurant_id, slug) do update
set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  preparation_time_minutes = excluded.preparation_time_minutes,
  sort_order = excluded.sort_order,
  is_featured = excluded.is_featured;

with target_restaurant as (
  select id
  from public.restaurants
  where slug = 'restoflow-order'
)
delete from public.menu_item_categories mic
using public.menu_items mi
where mic.menu_item_id = mi.id
  and mi.restaurant_id = (select id from target_restaurant);

with target_restaurant as (
  select id
  from public.restaurants
  where slug = 'restoflow-order'
),
menu_map as (
  select restaurant_id, slug, id
  from public.menu_items
),
category_map as (
  select restaurant_id, slug, id
  from public.categories
),
menu_category_data(menu_slug, category_slug) as (
  values
    ('ayam-bakar-madu', 'best-seller'),
    ('ayam-bakar-madu', 'makanan-berat'),
    ('sapi-lada-hitam', 'makanan-berat'),
    ('sapi-lada-hitam', 'best-seller'),
    ('nasi-goreng-kampung', 'makanan-berat'),
    ('chicken-katsu-curry', 'makanan-berat'),
    ('mie-goreng-seafood', 'makanan-berat'),
    ('truffle-fries', 'makanan-ringan'),
    ('chicken-pop-bites', 'makanan-ringan'),
    ('tahu-cabe-garam', 'makanan-ringan'),
    ('pisang-karamel-keju', 'makanan-ringan'),
    ('garlic-bread-melt', 'makanan-ringan'),
    ('lychee-yakult-spark', 'minuman'),
    ('lychee-yakult-spark', 'best-seller'),
    ('es-kopi-aren', 'minuman'),
    ('matcha-cloud-latte', 'minuman'),
    ('lemon-tea-dingin', 'minuman'),
    ('chocolate-hazelnut-shake', 'minuman'),
    ('paket-ayam-hemat', 'paket-hemat'),
    ('paket-katsu-duo', 'paket-hemat'),
    ('paket-sharing-snack', 'paket-hemat'),
    ('paket-lunch-beef', 'paket-hemat'),
    ('paket-tea-time', 'paket-hemat')
)
insert into public.menu_item_categories (menu_item_id, category_id)
select
  menu_map.id,
  category_map.id
from target_restaurant
join menu_category_data on true
join menu_map
  on menu_map.restaurant_id = target_restaurant.id
 and menu_map.slug = menu_category_data.menu_slug
join category_map
  on category_map.restaurant_id = target_restaurant.id
 and category_map.slug = menu_category_data.category_slug
on conflict (menu_item_id, category_id) do nothing;
