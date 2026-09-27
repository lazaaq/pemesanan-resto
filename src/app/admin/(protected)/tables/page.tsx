import { siteConfig } from "@/config/site";
import { SectionHeader } from "@/features/admin/components/admin-ui";
import { TablesGrid } from "@/features/admin/components/tables-grid";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type DiningTableRow = {
  id: string;
  code: string;
  capacity: number;
  is_active: boolean;
};

export default async function AdminTablesPage() {
  const supabase = await createServerSupabaseClient();

  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("id, name")
    .eq("slug", siteConfig.restaurantSlug)
    .single();

  if (restaurantError || !restaurant) {
    throw restaurantError ?? new Error("Restaurant tidak ditemukan.");
  }

  const { data: tables, error: tablesError } = await supabase
    .from("dining_tables")
    .select("id, code, capacity, is_active")
    .eq("restaurant_id", restaurant.id)
    .order("code", { ascending: true });

  if (tablesError) throw tablesError;

  const tableRows: DiningTableRow[] = (tables ?? []) as DiningTableRow[];

  return (
    <section className="w-full space-y-6">
      <SectionHeader
        eyebrow="Meja"
        title="Kelola Meja & QR Code"
        description="Tambah meja baru, atur kapasitas, dan generate QR code untuk ditempel di setiap meja."
      />

      <TablesGrid
        restaurantId={restaurant.id}
        restaurantName={restaurant.name}
        tableRows={tableRows}
      />
    </section>
  );
}
