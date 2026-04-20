## Pemesanan Resto Starter

Fondasi awal aplikasi Next.js untuk sistem pemesanan restoran yang disiapkan agar mudah berkembang. Setup ini memakai App Router, TypeScript strict mode, Tailwind CSS v4, typed routes, dan struktur folder yang dipisah antara `app`, `features`, `components`, `config`, dan `lib`.

## Menjalankan Proyek

Install dependency sudah selesai. Untuk mulai development:

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Script Penting

```bash
npm run dev
npm run lint
npm run typecheck
npm run check
npm run build
```

## Struktur Folder

```text
src
├─ app/                # routing, layout, metadata
├─ components/         # reusable UI dan layout primitives
├─ config/             # site config, konstanta global
├─ features/           # domain per fitur, siap berkembang
└─ lib/                # helper, utilitas, adapter bersama
```

## Kenapa Struktur Ini Enak untuk Scale

- `features/` memudahkan menambah domain seperti `auth`, `catalog`, `cart`, `order`, atau `kitchen` tanpa semua logic menumpuk di `app/`.
- `components/` dipakai untuk primitive reusable lintas fitur.
- `config/` menyimpan pengaturan aplikasi yang mudah diganti per environment atau brand.
- `lib/` cocok untuk helper umum, formatter, API client, dan server utilities.
- `typedRoutes` dan TypeScript strict mode membantu menjaga refactor tetap aman.

## Environment

Salin `.env.example` lalu sesuaikan nilainya saat mulai menghubungkan aplikasi ke backend atau environment deployment.

## Supabase Setup

Project ini sekarang sudah punya fondasi Supabase untuk sistem pemesanan restoran.

### File yang disiapkan

- `supabase/migrations/20260418104500_init_restaurant_ordering.sql`
- `supabase/seed.sql`
- `src/lib/supabase/*`
- `src/features/menu/lib/get-public-menu.ts`

### Schema database

Schema awal mencakup:

- `restaurants`
- `dining_tables`
- `categories`
- `menu_items`
- `menu_item_categories`
- `orders`
- `order_items`

Relasi kategori dibuat many-to-many, jadi satu makanan bisa masuk ke lebih dari satu kategori seperti `best seller`, `makanan berat`, `makanan ringan`, atau `minuman`.

Sudah termasuk enum status order, trigger `updated_at`, index penting, dan RLS policy dasar untuk akses publik dan staf terautentikasi.

### Cara membuat project Supabase

1. Buat project baru di dashboard Supabase.
2. Ambil `Project URL`, `anon key`, dan `service role key`.
3. Isi file `.env.local` berdasarkan `.env.example`.
4. Jalankan isi file migration di SQL Editor Supabase.
5. Jalankan `supabase/seed.sql` bila ingin data awal demo.

## Admin Dashboard

Admin dashboard tersedia di `/admin` dengan login Supabase Auth di `/admin/login`.

### Fitur yang tersedia

- login/logout admin dengan session Supabase
- proteksi route admin melalui middleware
- CRUD kategori
- CRUD menu makanan dan minuman
- assign banyak kategori ke satu menu

### Catatan auth

Versi saat ini mengasumsikan user yang bisa login ke Supabase Auth adalah user admin untuk dashboard ini.

### Alur setup admin

1. Pastikan `.env.local` sudah berisi `NEXT_PUBLIC_SUPABASE_URL` dan salah satu dari `NEXT_PUBLIC_SUPABASE_ANON_KEY` atau `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
2. Buat user admin di menu Auth pada dashboard Supabase.
3. Login melalui `/admin/login`.
4. Kelola kategori dan menu dari `/admin`.

Kalau nanti Anda ingin, saya juga bisa bantu lanjut ke tahap berikutnya:

- menghubungkan halaman menu ke data Supabase secara langsung
- membuat proses checkout menyimpan order ke tabel `orders` dan `order_items`
- menambahkan auth admin/kasir untuk mengelola menu dan status pesanan

## Langkah Lanjut yang Disarankan

1. Tambahkan domain `auth`, `menu`, `cart`, dan `order` di `src/features`.
2. Tentukan state strategy sejak awal, misalnya React Query untuk data fetching dan Zustand bila butuh client state ringan.
3. Siapkan layer API client dan validasi schema agar integrasi backend tetap rapi.
4. Tambahkan design tokens atau komponen UI dasar sebelum fitur bertambah banyak.

## Referensi

- [Next.js Docs](https://nextjs.org/docs)
- [App Router Guide](https://nextjs.org/docs/app)
- [Tailwind CSS](https://tailwindcss.com/docs/installation/framework-guides/nextjs)
