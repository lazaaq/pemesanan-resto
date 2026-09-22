import { createCategoryAction } from "@/app/admin/actions";
import { siteConfig } from "@/config/site";
import { SectionHeader, TextInput } from "@/features/admin/components/admin-ui";
import { CategoryList, type CategoryRow } from "@/features/admin/components/category-list";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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
    <div className="w-full space-y-6">
      <SectionHeader
        eyebrow="Kategori"
        title="Kelola Kategori Menu"
        description="Seret ikon burger di sisi kiri untuk mengubah urutan kategori. Ubah nama atau toggle status aktif secara langsung."
      />

      {/* Form Tambah Kategori */}
      <form
        action={createCategoryAction}
        className="space-y-3"
      >
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--admin-muted)" }}>
          Tambah kategori baru
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <TextInput label="Nama kategori" name="name" placeholder="Best Seller" required />
          </div>
          <button type="submit" className="admin-btn-primary px-5 py-2.5 sm:shrink-0">
            Tambah kategori
          </button>
        </div>
      </form>

      {/* List Kategori (Full-width 1 column, 2-column data row with Drag-and-Drop) */}
      <div className="w-full">
        <CategoryList initialCategories={categoryRows} />
      </div>
    </div>
  );
}
