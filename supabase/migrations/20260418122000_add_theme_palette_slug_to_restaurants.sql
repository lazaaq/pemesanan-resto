alter table public.restaurants
add column if not exists theme_palette_slug text not null default 'terracotta-spice';

update public.restaurants
set theme_palette_slug = 'terracotta-spice'
where theme_palette_slug is null or btrim(theme_palette_slug) = '';
