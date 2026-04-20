import {
  createCategoryAction,
  createMenuItemAction,
  deleteCategoryAction,
  deleteMenuItemAction,
  updateRestaurantThemePaletteAction,
  updateCategoryAction,
  updateMenuItemAction,
} from "@/app/admin/actions";
import { siteConfig } from "@/config/site";
import {
  getThemePalette,
  getThemePaletteCssVariables,
  themePalettes,
} from "@/config/theme-palettes";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SetupState = {
  title: string;
  description: string;
  steps: string[];
};

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
};

type MenuItemRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  image_url: string | null;
  preparation_time_minutes: number;
  sort_order: number;
  is_available: boolean;
  is_featured: boolean;
  categoryIds: string[];
};

function ThemePaletteCard({
  description,
  isActive,
  name,
  slug,
}: {
  description: string;
  isActive: boolean;
  name: string;
  slug: string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-border bg-[#fffaf3] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">{name}</h3>
          <p className="text-sm leading-7 text-muted">{description}</p>
        </div>
        {isActive ? (
          <span className="rounded-full bg-[#eef5f3] px-3 py-1 text-xs font-semibold text-secondary">
            Aktif
          </span>
        ) : null}
      </div>

      <div
        style={getThemePaletteCssVariables(slug)}
        className="mt-4 overflow-hidden rounded-[1.5rem] border border-border bg-background"
      >
        <div className="mobile-app-shell p-4">
          <div className="rounded-[1.25rem] border border-border bg-card/90 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
                  Preview
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">Pemesanan Mobile</p>
              </div>
              <div className="flex gap-2">
                <span className="h-4 w-4 rounded-full bg-primary" />
                <span className="h-4 w-4 rounded-full bg-secondary" />
                <span className="h-4 w-4 rounded-full bg-accent" />
              </div>
            </div>
            <div className="mt-4 grid gap-2">
              <div className="rounded-full bg-white/85 px-3 py-2 text-xs text-muted shadow-sm">
                Cari menu favorit
              </div>
              <div className="flex gap-2">
                <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-white">
                  Best Seller
                </span>
                <span className="rounded-full border border-border bg-card px-3 py-1 text-[11px] font-semibold text-foreground">
                  Minuman
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <form action={updateRestaurantThemePaletteAction} className="mt-4">
        <input type="hidden" name="themePaletteSlug" value={slug} />
        <button
          type="submit"
          className="w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white"
        >
          {isActive ? "Sedang digunakan" : "Gunakan palet ini"}
        </button>
      </form>
    </div>
  );
}

function AdminStatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-border bg-white p-5 shadow-sm">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-foreground">{value}</p>
      <p className="mt-2 text-sm leading-7 text-muted">{helper}</p>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-2">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">{eyebrow}</p>
      <h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
      <p className="max-w-3xl text-sm leading-7 text-muted">{description}</p>
    </div>
  );
}

function TextInput({
  defaultValue,
  label,
  name,
  placeholder,
  required = false,
  type = "text",
}: {
  defaultValue?: string | number | null;
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <input
        defaultValue={defaultValue ?? ""}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-border bg-[#fffaf3] px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
      />
    </label>
  );
}

function CheckboxInput({
  defaultChecked,
  label,
  name,
}: {
  defaultChecked?: boolean;
  label: string;
  name: string;
}) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-border bg-[#fffaf3] px-4 py-3 text-sm text-foreground">
      <input
        defaultChecked={defaultChecked}
        name={name}
        type="checkbox"
        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
      />
      <span>{label}</span>
    </label>
  );
}

function AdminSetupNotice({
  title,
  description,
  steps,
}: SetupState) {
  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[#f1c3b6] bg-[#fff7f4] p-6 shadow-sm">
        <div className="space-y-3">
          <p className="font-mono text-xs uppercase tracking-[0.32em] text-primary">
            setup required
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="max-w-3xl text-sm leading-7 text-muted">{description}</p>
        </div>

        <div className="mt-6 rounded-[1.5rem] border border-[#f1c3b6] bg-white p-5">
          <p className="text-sm font-semibold text-foreground">Langkah yang perlu dijalankan</p>
          <ol className="mt-4 space-y-3 text-sm leading-7 text-muted">
            {steps.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}

function getSetupState(params: {
  hasMissingTables: boolean;
  hasMissingRestaurant: boolean;
}): SetupState | null {
  if (params.hasMissingTables) {
    return {
      title: "Database Supabase belum disiapkan",
      description:
        "Akun admin Anda sudah ada, tetapi schema aplikasi restoran belum dibuat di project Supabase ini. Karena itu dashboard belum bisa membaca tabel restaurants, categories, dan menu_items.",
      steps: [
        "Buka Supabase Dashboard lalu masuk ke SQL Editor project Anda.",
        "Jalankan file supabase/migrations/20260418104500_init_restaurant_ordering.sql.",
        "Jalankan file supabase/migrations/20260418122000_add_theme_palette_slug_to_restaurants.sql.",
        "Jalankan file supabase/seed.sql agar restaurant default, kategori, dan menu demo ikut terisi.",
        "Reload halaman /admin setelah semua query selesai dijalankan.",
      ],
    };
  }

  if (params.hasMissingRestaurant) {
    return {
      title: "Data restaurant default belum ada",
      description:
        "Schema database sudah terbaca, tetapi record restaurant dengan slug default aplikasi belum ditemukan. Dashboard admin membutuhkan 1 restaurant utama untuk memuat kategori, menu, dan pengaturan branding.",
      steps: [
        "Jalankan file supabase/seed.sql di SQL Editor Supabase.",
        "Atau tambahkan 1 row baru ke tabel restaurants dengan slug restoflow-order.",
        "Reload halaman /admin setelah record restaurant tersedia.",
      ],
    };
  }

  return null;
}

export default async function AdminDashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("id, name, slug, currency_code, service_fee, theme_palette_slug")
    .eq("slug", siteConfig.restaurantSlug)
    .single();

  const setupState = getSetupState({
    hasMissingTables: restaurantError?.code === "PGRST205",
    hasMissingRestaurant:
      (!restaurant && !restaurantError) ||
      restaurantError?.code === "PGRST116" ||
      restaurantError?.message?.toLowerCase().includes("contains 0 rows") === true,
  });

  if (setupState) {
    return <AdminSetupNotice {...setupState} />;
  }

  if (restaurantError || !restaurant) {
    throw restaurantError ?? new Error("Restaurant default tidak ditemukan.");
  }

  const [{ data: categories, error: categoriesError }, { data: menuItems, error: menuItemsError }] =
    await Promise.all([
      supabase
        .from("categories")
        .select("id, name, slug, sort_order, is_active")
        .eq("restaurant_id", restaurant.id)
        .order("sort_order", { ascending: true }),
      supabase
        .from("menu_items")
        .select(
          "id, name, slug, description, price, image_url, preparation_time_minutes, sort_order, is_available, is_featured",
        )
        .eq("restaurant_id", restaurant.id)
        .order("sort_order", { ascending: true }),
    ]);

  if (categoriesError) {
    throw categoriesError;
  }

  if (menuItemsError) {
    throw menuItemsError;
  }

  const categoryRows: CategoryRow[] = (categories ?? []) as CategoryRow[];
  const menuItemRows = (menuItems ?? []) as Omit<MenuItemRow, "categoryIds">[];
  const activePalette = getThemePalette(restaurant.theme_palette_slug);

  const { data: menuItemCategoryRows, error: menuItemCategoryError } = menuItemRows.length
    ? await supabase
        .from("menu_item_categories")
        .select("menu_item_id, category_id")
      .in("menu_item_id", menuItemRows.map((item) => item.id))
    : { data: [], error: null };

  if (menuItemCategoryError) {
    throw menuItemCategoryError;
  }

  const categoryLookup = new Map(categoryRows.map((category) => [category.id, category.name]));

  const enrichedMenuItems: MenuItemRow[] = menuItemRows.map((item) => ({
    ...item,
    categoryIds: ((menuItemCategoryRows ?? []) as Array<{
      menu_item_id: string;
      category_id: string;
    }>)
      .filter((relation) => relation.menu_item_id === item.id)
      .map((relation) => relation.category_id),
  }));

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Restaurant"
          value={restaurant.name}
          helper={`Slug: ${restaurant.slug}`}
        />
        <AdminStatCard
          label="Kategori"
          value={String(categoryRows.length)}
          helper="Kelola kategori yang muncul di katalog dan filter menu."
        />
        <AdminStatCard
          label="Menu"
          value={String(enrichedMenuItems.length)}
          helper={`Mata uang default ${restaurant.currency_code} dan service fee ${restaurant.service_fee}.`}
        />
        <AdminStatCard
          label="Palet Aktif"
          value={activePalette.name}
          helper="Warna ini akan dipakai oleh halaman pemesanan pelanggan."
        />
      </section>

      <section className="space-y-6 rounded-[2rem] border border-border bg-white p-6 shadow-sm">
        <SectionHeader
          eyebrow="Branding"
          title="Palet warna aplikasi pemesanan"
          description="Pilih palet yang paling cocok untuk brand restoran. Saat disimpan, halaman pemesanan pelanggan langsung memakai kombinasi warna tersebut."
        />

        <div className="grid gap-4 xl:grid-cols-2">
          {themePalettes.map((palette) => (
            <ThemePaletteCard
              key={palette.slug}
              description={palette.description}
              isActive={activePalette.slug === palette.slug}
              name={palette.name}
              slug={palette.slug}
            />
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6 rounded-[2rem] border border-border bg-white p-6 shadow-sm">
          <SectionHeader
            eyebrow="Kategori"
            title="CRUD kategori menu"
            description="Tambahkan kategori baru, ubah urutan tampil, atau nonaktifkan kategori tertentu."
          />

          <form action={createCategoryAction} className="grid gap-4 rounded-[1.75rem] bg-[#faf6ef] p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput label="Nama kategori" name="name" placeholder="Best Seller" required />
              <TextInput label="Slug" name="slug" placeholder="best-seller" />
              <TextInput label="Urutan tampil" name="sortOrder" type="number" defaultValue={0} />
              <CheckboxInput defaultChecked label="Kategori aktif" name="isActive" />
            </div>

            <button
              type="submit"
              className="w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white"
            >
              Tambah kategori
            </button>
          </form>

          <div className="space-y-4">
            {categoryRows.map((category) => (
              <div
                key={category.id}
                className="rounded-[1.75rem] border border-border bg-[#fffaf3] p-5"
              >
                <form action={updateCategoryAction} className="space-y-4">
                  <input type="hidden" name="categoryId" value={category.id} />
                  <div className="grid gap-4 md:grid-cols-2">
                    <TextInput
                      defaultValue={category.name}
                      label="Nama kategori"
                      name="name"
                      required
                    />
                    <TextInput defaultValue={category.slug} label="Slug" name="slug" required />
                    <TextInput
                      defaultValue={category.sort_order}
                      label="Urutan tampil"
                      name="sortOrder"
                      type="number"
                    />
                    <CheckboxInput
                      defaultChecked={category.is_active}
                      label="Kategori aktif"
                      name="isActive"
                    />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      className="rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-white"
                    >
                      Simpan kategori
                    </button>
                  </div>
                </form>

                <form action={deleteCategoryAction} className="mt-3">
                  <input type="hidden" name="categoryId" value={category.id} />
                  <button
                    type="submit"
                    className="rounded-full border border-[#efc2b6] bg-[#fff1ec] px-4 py-2 text-sm font-semibold text-primary"
                  >
                    Hapus kategori
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6 rounded-[2rem] border border-border bg-white p-6 shadow-sm">
          <SectionHeader
            eyebrow="Menu"
            title="CRUD makanan dan minuman"
            description="Tambah item baru, ubah harga, urutan, ketersediaan, dan pilih satu atau beberapa kategori untuk setiap item."
          />

          <form action={createMenuItemAction} className="grid gap-4 rounded-[1.75rem] bg-[#faf6ef] p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput label="Nama menu" name="name" placeholder="Ayam Bakar Madu" required />
              <TextInput label="Slug" name="slug" placeholder="ayam-bakar-madu" />
              <TextInput label="Harga" name="price" placeholder="38000" required type="number" />
              <TextInput
                defaultValue={15}
                label="Waktu masak (menit)"
                name="preparationTimeMinutes"
                type="number"
              />
              <TextInput label="Urutan tampil" name="sortOrder" type="number" defaultValue={0} />
              <TextInput label="URL gambar" name="imageUrl" placeholder="https://..." />
            </div>

            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">Deskripsi</span>
              <textarea
                name="description"
                rows={4}
                className="w-full rounded-2xl border border-border bg-[#fffaf3] px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
                placeholder="Deskripsi singkat menu"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">Kategori</span>
              <select
                multiple
                name="categoryIds"
                className="min-h-40 w-full rounded-2xl border border-border bg-[#fffaf3] px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
              >
                {categoryRows.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted">
                Gunakan `Cmd` atau `Ctrl` saat memilih lebih dari satu kategori.
              </p>
            </label>

            <div className="grid gap-3 md:grid-cols-2">
              <CheckboxInput defaultChecked label="Menu tersedia" name="isAvailable" />
              <CheckboxInput label="Tandai sebagai featured" name="isFeatured" />
            </div>

            <button
              type="submit"
              className="w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white"
            >
              Tambah menu baru
            </button>
          </form>

          <div className="space-y-4">
            {enrichedMenuItems.map((item) => (
              <div
                key={item.id}
                className="rounded-[1.75rem] border border-border bg-[#fffaf3] p-5"
              >
                <form action={updateMenuItemAction} className="space-y-4">
                  <input type="hidden" name="menuItemId" value={item.id} />
                  <div className="grid gap-4 md:grid-cols-2">
                    <TextInput defaultValue={item.name} label="Nama menu" name="name" required />
                    <TextInput defaultValue={item.slug} label="Slug" name="slug" required />
                    <TextInput
                      defaultValue={item.price}
                      label="Harga"
                      name="price"
                      required
                      type="number"
                    />
                    <TextInput
                      defaultValue={item.preparation_time_minutes}
                      label="Waktu masak (menit)"
                      name="preparationTimeMinutes"
                      type="number"
                    />
                    <TextInput
                      defaultValue={item.sort_order}
                      label="Urutan tampil"
                      name="sortOrder"
                      type="number"
                    />
                    <TextInput
                      defaultValue={item.image_url}
                      label="URL gambar"
                      name="imageUrl"
                    />
                  </div>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-foreground">Deskripsi</span>
                    <textarea
                      name="description"
                      rows={4}
                      defaultValue={item.description ?? ""}
                      className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-foreground">Kategori</span>
                    <select
                      multiple
                      name="categoryIds"
                      defaultValue={item.categoryIds}
                      className="min-h-40 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
                    >
                      {categoryRows.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="flex flex-wrap gap-2">
                    {item.categoryIds.map((categoryId) => (
                      <span
                        key={`${item.id}-${categoryId}`}
                        className="rounded-full bg-[#eef5f3] px-3 py-1 text-xs font-semibold text-secondary"
                      >
                        {categoryLookup.get(categoryId) ?? "Kategori"}
                      </span>
                    ))}
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <CheckboxInput
                      defaultChecked={item.is_available}
                      label="Menu tersedia"
                      name="isAvailable"
                    />
                    <CheckboxInput
                      defaultChecked={item.is_featured}
                      label="Tandai sebagai featured"
                      name="isFeatured"
                    />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      className="rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-white"
                    >
                      Simpan menu
                    </button>
                  </div>
                </form>

                <form action={deleteMenuItemAction} className="mt-3">
                  <input type="hidden" name="menuItemId" value={item.id} />
                  <button
                    type="submit"
                    className="rounded-full border border-[#efc2b6] bg-[#fff1ec] px-4 py-2 text-sm font-semibold text-primary"
                  >
                    Hapus menu
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
