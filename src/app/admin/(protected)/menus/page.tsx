import {
  createMenuItemAction,
  deleteMenuItemAction,
  updateMenuItemAction,
} from "@/app/admin/actions";
import { siteConfig } from "@/config/site";
import { CheckboxInput, SectionHeader, TextInput } from "@/features/admin/components/admin-ui";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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

export default async function AdminMenusPage() {
  const supabase = await createServerSupabaseClient();
  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("id")
    .eq("slug", siteConfig.restaurantSlug)
    .single();

  if (restaurantError || !restaurant) {
    throw restaurantError ?? new Error("Restaurant tidak ditemukan.");
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

  if (categoriesError) throw categoriesError;
  if (menuItemsError) throw menuItemsError;

  const categoryRows: CategoryRow[] = (categories ?? []) as CategoryRow[];
  const menuItemRows = (menuItems ?? []) as Omit<MenuItemRow, "categoryIds">[];

  const { data: menuItemCategoryRows, error: menuItemCategoryError } = menuItemRows.length
    ? await supabase
        .from("menu_item_categories")
        .select("menu_item_id, category_id")
        .in("menu_item_id", menuItemRows.map((item) => item.id))
    : { data: [], error: null };

  if (menuItemCategoryError) throw menuItemCategoryError;

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
    <section className="admin-card space-y-6 max-w-5xl">
      <SectionHeader
        eyebrow="Menu"
        title="CRUD Makanan dan Minuman"
        description="Tambah item baru, ubah harga, urutan, ketersediaan, dan pilih satu atau beberapa kategori untuk setiap item."
      />

      {/* Form Tambah Menu Baru */}
      <form
        action={createMenuItemAction}
        className="grid gap-4 rounded-xl p-5"
        style={{ background: "var(--admin-surface)", border: "1px solid var(--admin-border)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--admin-muted)" }}>
          Tambah menu baru
        </p>
        <div className="grid gap-3 md:grid-cols-2">
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

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium" style={{ color: "var(--admin-foreground)" }}>
            Deskripsi
          </span>
          <textarea
            name="description"
            rows={3}
            className="admin-input"
            placeholder="Deskripsi singkat menu"
            style={{ resize: "vertical" }}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium" style={{ color: "var(--admin-foreground)" }}>
            Kategori
          </span>
          <select
            multiple
            name="categoryIds"
            className="admin-input"
            style={{ minHeight: "9rem" }}
          >
            {categoryRows.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <p className="text-xs" style={{ color: "var(--admin-muted)" }}>
            Gunakan Cmd / Ctrl saat memilih lebih dari satu kategori.
          </p>
        </label>

        <div className="grid gap-3 md:grid-cols-2">
          <CheckboxInput defaultChecked label="Menu tersedia" name="isAvailable" />
          <CheckboxInput label="Tandai sebagai featured" name="isFeatured" />
        </div>

        <button type="submit" className="admin-btn-primary w-full py-2.5">
          Tambah menu baru
        </button>
      </form>

      {/* List Menu Items */}
      <div className="space-y-4">
        {enrichedMenuItems.map((item) => (
          <div
            key={item.id}
            className="rounded-xl p-4 space-y-4"
            style={{ border: "1px solid var(--admin-border)", background: "#fff" }}
          >
            <form action={updateMenuItemAction} className="space-y-3">
              <input type="hidden" name="menuItemId" value={item.id} />
              <div className="grid gap-3 md:grid-cols-2">
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

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium" style={{ color: "var(--admin-foreground)" }}>
                  Deskripsi
                </span>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={item.description ?? ""}
                  className="admin-input"
                  style={{ resize: "vertical" }}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium" style={{ color: "var(--admin-foreground)" }}>
                  Kategori
                </span>
                <select
                  multiple
                  name="categoryIds"
                  defaultValue={item.categoryIds}
                  className="admin-input"
                  style={{ minHeight: "9rem" }}
                >
                  {categoryRows.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              {/* Category Badges */}
              {item.categoryIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {item.categoryIds.map((categoryId) => (
                    <span
                      key={`${item.id}-${categoryId}`}
                      className="rounded-full px-2.5 py-1 text-xs font-semibold"
                      style={{
                        background: "rgba(9,63,180,0.08)",
                        color: "var(--admin-primary)",
                        border: "1px solid rgba(9,63,180,0.18)",
                      }}
                    >
                      {categoryLookup.get(categoryId) ?? "Kategori"}
                    </span>
                  ))}
                </div>
              )}

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

              <button type="submit" className="admin-btn-primary rounded-full px-4 py-2 text-sm">
                Simpan menu
              </button>
            </form>

            <form action={deleteMenuItemAction}>
              <input type="hidden" name="menuItemId" value={item.id} />
              <button type="submit" className="admin-btn-danger rounded-full px-4 py-2 text-sm">
                Hapus menu
              </button>
            </form>
          </div>
        ))}
      </div>
    </section>
  );
}
