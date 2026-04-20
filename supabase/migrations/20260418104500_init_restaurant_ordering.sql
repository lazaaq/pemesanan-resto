create extension if not exists pgcrypto;
create extension if not exists citext;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'order_type') then
    create type public.order_type as enum ('dine_in', 'takeaway', 'delivery');
  end if;

  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type public.order_status as enum (
      'pending',
      'confirmed',
      'preparing',
      'ready',
      'completed',
      'cancelled'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type public.payment_status as enum ('unpaid', 'paid', 'refunded');
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  slug citext not null unique,
  name text not null,
  description text,
  currency_code text not null default 'IDR' check (char_length(currency_code) = 3),
  service_fee numeric(12, 2) not null default 0,
  tax_rate numeric(5, 2) not null default 0 check (tax_rate >= 0),
  theme_palette_slug text not null default 'terracotta-spice',
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.dining_tables (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  code text not null,
  capacity integer not null default 2 check (capacity > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (restaurant_id, code)
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  slug citext not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (restaurant_id, slug)
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  slug citext not null,
  description text,
  price numeric(12, 2) not null check (price >= 0),
  image_url text,
  preparation_time_minutes integer not null default 15 check (preparation_time_minutes >= 0),
  sort_order integer not null default 0,
  is_available boolean not null default true,
  is_featured boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (restaurant_id, slug)
);

create table if not exists public.menu_item_categories (
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (menu_item_id, category_id)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete restrict,
  table_id uuid references public.dining_tables(id) on delete set null,
  order_number bigint generated always as identity,
  customer_name text,
  customer_phone text,
  notes text,
  order_type public.order_type not null default 'dine_in',
  status public.order_status not null default 'pending',
  payment_status public.payment_status not null default 'unpaid',
  subtotal numeric(12, 2) not null default 0 check (subtotal >= 0),
  service_fee numeric(12, 2) not null default 0 check (service_fee >= 0),
  tax numeric(12, 2) not null default 0 check (tax >= 0),
  total numeric(12, 2) not null default 0 check (total >= 0),
  placed_at timestamptz not null default timezone('utc', now()),
  paid_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (restaurant_id, order_number)
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  item_name_snapshot text not null,
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  notes text,
  total_price numeric(12, 2) generated always as (unit_price * quantity) stored,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists dining_tables_restaurant_id_idx on public.dining_tables(restaurant_id);
create index if not exists categories_restaurant_id_sort_order_idx on public.categories(restaurant_id, sort_order);
create index if not exists menu_items_restaurant_id_is_available_idx on public.menu_items(restaurant_id, is_available);
create index if not exists menu_item_categories_category_id_idx on public.menu_item_categories(category_id);
create index if not exists menu_item_categories_menu_item_id_idx on public.menu_item_categories(menu_item_id);
create index if not exists orders_restaurant_id_status_idx on public.orders(restaurant_id, status);
create index if not exists orders_restaurant_id_created_at_idx on public.orders(restaurant_id, created_at desc);
create index if not exists order_items_order_id_idx on public.order_items(order_id);

drop trigger if exists set_restaurants_updated_at on public.restaurants;
create trigger set_restaurants_updated_at
before update on public.restaurants
for each row
execute function public.set_updated_at();

drop trigger if exists set_dining_tables_updated_at on public.dining_tables;
create trigger set_dining_tables_updated_at
before update on public.dining_tables
for each row
execute function public.set_updated_at();

drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at
before update on public.categories
for each row
execute function public.set_updated_at();

drop trigger if exists set_menu_items_updated_at on public.menu_items;
create trigger set_menu_items_updated_at
before update on public.menu_items
for each row
execute function public.set_updated_at();

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
before update on public.orders
for each row
execute function public.set_updated_at();

alter table public.restaurants enable row level security;
alter table public.dining_tables enable row level security;
alter table public.categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.menu_item_categories enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "Public can read active restaurants" on public.restaurants;
create policy "Public can read active restaurants"
on public.restaurants
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Public can read active tables" on public.dining_tables;
create policy "Public can read active tables"
on public.dining_tables
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Public can read active categories" on public.categories;
create policy "Public can read active categories"
on public.categories
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Public can read available menu items" on public.menu_items;
create policy "Public can read available menu items"
on public.menu_items
for select
to anon, authenticated
using (is_available = true);

drop policy if exists "Public can read menu item categories" on public.menu_item_categories;
create policy "Public can read menu item categories"
on public.menu_item_categories
for select
to anon, authenticated
using (true);

drop policy if exists "Public can create orders" on public.orders;
create policy "Public can create orders"
on public.orders
for insert
to anon, authenticated
with check (true);

drop policy if exists "Public can create order items" on public.order_items;
create policy "Public can create order items"
on public.order_items
for insert
to anon, authenticated
with check (true);

drop policy if exists "Authenticated can manage restaurants" on public.restaurants;
create policy "Authenticated can manage restaurants"
on public.restaurants
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated can manage dining tables" on public.dining_tables;
create policy "Authenticated can manage dining tables"
on public.dining_tables
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated can manage categories" on public.categories;
create policy "Authenticated can manage categories"
on public.categories
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated can manage menu items" on public.menu_items;
create policy "Authenticated can manage menu items"
on public.menu_items
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated can manage menu item categories" on public.menu_item_categories;
create policy "Authenticated can manage menu item categories"
on public.menu_item_categories
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated can manage orders" on public.orders;
create policy "Authenticated can manage orders"
on public.orders
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated can manage order items" on public.order_items;
create policy "Authenticated can manage order_items"
on public.order_items
for all
to authenticated
using (true)
with check (true);
