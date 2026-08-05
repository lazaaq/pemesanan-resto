import Link from "next/link";
import { siteConfig } from "@/config/site";
import { getThemePalette, type ThemePaletteValues } from "@/config/theme-palettes";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SetupState = {
  title: string;
  description: string;
  steps: string[];
};

function AdminStatCard({
  label,
  value,
  helper,
  accent,
  href,
}: {
  label: string;
  value: string;
  helper: string;
  accent?: "blue" | "red" | "yellow" | "default";
  href?: string;
}) {
  const accentStyles: Record<string, { border: string; dot: string }> = {
    blue:    { border: "rgba(9,63,180,0.25)",  dot: "var(--admin-primary)" },
    red:     { border: "rgba(237,53,0,0.25)",  dot: "var(--admin-secondary)" },
    yellow:  { border: "rgba(255,200,30,0.5)", dot: "var(--admin-accent)" },
    default: { border: "var(--admin-border)",  dot: "#94a3b8" },
  };
  const style = accentStyles[accent ?? "default"];

  const content = (
    <div
      className="admin-stat-card flex flex-col gap-3 transition-transform hover:-translate-y-0.5"
      style={{ borderColor: style.border }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: style.dot }} />
          <p className="text-xs font-medium" style={{ color: "var(--admin-muted)" }}>
            {label}
          </p>
        </div>
        {href && (
          <span className="text-[11px] font-semibold" style={{ color: "var(--admin-primary)" }}>
            Kelola →
          </span>
        )}
      </div>
      <p className="text-2xl font-bold tracking-tight" style={{ color: "var(--admin-foreground)" }}>
        {value}
      </p>
      <p className="text-xs leading-5" style={{ color: "var(--admin-muted)" }}>
        {helper}
      </p>
    </div>
  );

  return href ? <Link href={href as never}>{content}</Link> : content;
}

function AdminSetupNotice({ title, description, steps }: SetupState) {
  return (
    <div className="space-y-6">
      <section
        className="rounded-2xl p-6"
        style={{
          border: "1px solid rgba(237,53,0,0.25)",
          background: "rgba(237,53,0,0.04)",
        }}
      >
        <div className="space-y-3">
          <p
            className="text-[11px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--admin-secondary)" }}
          >
            setup required
          </p>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--admin-foreground)" }}>
            {title}
          </h1>
          <p className="max-w-3xl text-sm leading-6" style={{ color: "var(--admin-muted)" }}>
            {description}
          </p>
        </div>

        <div
          className="mt-6 rounded-xl p-5"
          style={{
            border: "1px solid rgba(237,53,0,0.18)",
            background: "#fff",
          }}
        >
          <p className="text-sm font-semibold" style={{ color: "var(--admin-foreground)" }}>
            Langkah yang perlu dijalankan
          </p>
          <ol className="mt-4 space-y-3 text-sm leading-6" style={{ color: "var(--admin-muted)" }}>
            {steps.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: "var(--admin-secondary)" }}
                >
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

export default async function AdminOverviewPage() {
  const supabase = await createServerSupabaseClient();
  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("id, name, slug, currency_code, service_fee, theme_palette_slug, custom_theme_palette")
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

  // Fast parallel light queries (count only)
  const [{ count: categoryCount }, { count: menuItemCount }] = await Promise.all([
    supabase
      .from("categories")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", restaurant.id),
    supabase
      .from("menu_items")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", restaurant.id),
  ]);

  const activePalette = getThemePalette(restaurant.theme_palette_slug);
  const customPalette = restaurant.custom_theme_palette as Partial<ThemePaletteValues> | null;
  const isCustomActive = Boolean(customPalette && Object.keys(customPalette).length > 0);

  return (
    <div className="space-y-8">
      {/* Stat Cards Overview */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Restaurant"
          value={restaurant.name}
          helper={`Slug: ${restaurant.slug}`}
          accent="blue"
        />
        <AdminStatCard
          label="Kategori"
          value={String(categoryCount ?? 0)}
          helper="Klik untuk kelola kategori katalog restoran."
          accent="default"
          href="/admin/categories"
        />
        <AdminStatCard
          label="Menu"
          value={String(menuItemCount ?? 0)}
          helper={`Currency: ${restaurant.currency_code} | Service Fee: ${restaurant.service_fee}`}
          accent="red"
          href="/admin/menus"
        />
        <AdminStatCard
          label="Palet Aktif"
          value={isCustomActive ? "Custom Palette" : activePalette.name}
          helper={isCustomActive ? "Menggunakan palet kustom." : "Klik untuk ganti preset warna."}
          accent="yellow"
          href="/admin/presets"
        />
      </section>

      {/* Quick Navigation Cards */}
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Link
          href={"/admin/presets" as never}
          className="admin-card flex flex-col justify-between p-6 transition-all hover:border-[var(--admin-primary)] hover:shadow-md"
        >
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--admin-primary)" }}>
              Branding
            </p>
            <h3 className="text-lg font-bold" style={{ color: "var(--admin-foreground)" }}>
              Palet Preset
            </h3>
            <p className="text-xs leading-5" style={{ color: "var(--admin-muted)" }}>
              Pilih dari tema warna standar (Midnight Sage, Terracotta Spice, Ocean Breeze, dll).
            </p>
          </div>
          <span className="mt-4 text-xs font-semibold" style={{ color: "var(--admin-primary)" }}>
            Buka Palet Preset →
          </span>
        </Link>

        <Link
          href={"/admin/custom-palette" as never}
          className="admin-card flex flex-col justify-between p-6 transition-all hover:border-[var(--admin-primary)] hover:shadow-md"
        >
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--admin-primary)" }}>
              Kustomisasi
            </p>
            <h3 className="text-lg font-bold" style={{ color: "var(--admin-foreground)" }}>
              Kustom Palet
            </h3>
            <p className="text-xs leading-5" style={{ color: "var(--admin-muted)" }}>
              Atur setiap variabel warna (Primary, Secondary, Accent, Background, Card) secara manual.
            </p>
          </div>
          <span className="mt-4 text-xs font-semibold" style={{ color: "var(--admin-primary)" }}>
            Buka Kustom Palet →
          </span>
        </Link>

        <Link
          href={"/admin/categories" as never}
          className="admin-card flex flex-col justify-between p-6 transition-all hover:border-[var(--admin-primary)] hover:shadow-md"
        >
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--admin-primary)" }}>
              Kategori
            </p>
            <h3 className="text-lg font-bold" style={{ color: "var(--admin-foreground)" }}>
              Kelola Kategori
            </h3>
            <p className="text-xs leading-5" style={{ color: "var(--admin-muted)" }}>
              Tambah, ubah nama/slug, atur urutan tampil, atau nonaktifkan kategori.
            </p>
          </div>
          <span className="mt-4 text-xs font-semibold" style={{ color: "var(--admin-primary)" }}>
            Kelola Kategori →
          </span>
        </Link>

        <Link
          href={"/admin/menus" as never}
          className="admin-card flex flex-col justify-between p-6 transition-all hover:border-[var(--admin-primary)] hover:shadow-md"
        >
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--admin-primary)" }}>
              Menu
            </p>
            <h3 className="text-lg font-bold" style={{ color: "var(--admin-foreground)" }}>
              Kelola Menu
            </h3>
            <p className="text-xs leading-5" style={{ color: "var(--admin-muted)" }}>
              Tambah makanan & minuman baru, ubah harga, foto, deskripsi, ketersediaan & kaitan kategori.
            </p>
          </div>
          <span className="mt-4 text-xs font-semibold" style={{ color: "var(--admin-primary)" }}>
            Kelola Menu →
          </span>
        </Link>
      </section>
    </div>
  );
}
