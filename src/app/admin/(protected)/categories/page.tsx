import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
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

export default async function AdminCategoriesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("id")
    .eq("slug", siteConfig.restaurantSlug)
    .single();

  if (restaurantError || !restaurant) {
    throw restaurantError ?? new Error("Restaurant tidak ditemukan.");
  }

  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("id, name, slug, sort_order, is_active")
    .eq("restaurant_id", restaurant.id)
    .order("sort_order", { ascending: true });

  if (categoriesError) {
    throw categoriesError;
  }

  const categoryRows: CategoryRow[] = (categories ?? []) as CategoryRow[];

  return (
    <section className="admin-card space-y-6 max-w-4xl">
      <SectionHeader
        eyebrow="Kategori"
        title="CRUD Kategori Menu"
        description="Tambahkan kategori baru, ubah nama atau urutan tampil, atau nonaktifkan kategori tertentu."
      />

      {/* Form Tambah Kategori */}
      <form
        action={createCategoryAction}
        className="grid gap-4 rounded-xl p-5"
        style={{ background: "var(--admin-surface)", border: "1px solid var(--admin-border)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--admin-muted)" }}>
          Tambah kategori baru
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <TextInput label="Nama kategori" name="name" placeholder="Best Seller" required />
          <TextInput label="Slug" name="slug" placeholder="best-seller" />
          <TextInput label="Urutan tampil" name="sortOrder" type="number" defaultValue={0} />
          <CheckboxInput defaultChecked label="Kategori aktif" name="isActive" />
        </div>
        <button type="submit" className="admin-btn-primary w-full py-2.5">
          Tambah kategori
        </button>
      </form>

      {/* List Kategori */}
      <div className="space-y-3">
        {categoryRows.map((category) => (
          <div
            key={category.id}
            className="rounded-xl p-4 space-y-4"
            style={{ border: "1px solid var(--admin-border)", background: "#fff" }}
          >
            <form action={updateCategoryAction} className="space-y-3">
              <input type="hidden" name="categoryId" value={category.id} />
              <div className="grid gap-3 md:grid-cols-2">
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
              <button type="submit" className="admin-btn-primary rounded-full px-4 py-2 text-sm">
                Simpan kategori
              </button>
            </form>

            <form action={deleteCategoryAction}>
              <input type="hidden" name="categoryId" value={category.id} />
              <button type="submit" className="admin-btn-danger rounded-full px-4 py-2 text-sm">
                Hapus kategori
              </button>
            </form>
          </div>
        ))}
      </div>
    </section>
  );
}
