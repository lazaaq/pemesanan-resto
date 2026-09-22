import { updateRestaurantThemePaletteAction } from "@/app/admin/actions";
import { siteConfig } from "@/config/site";
import {
  getThemePalette,
  resolveThemeCssVariables,
  themePalettes,
  type ThemePaletteValues,
} from "@/config/theme-palettes";
import { ColorPaletteEditor } from "@/features/admin/components/color-palette-editor";
import { SectionHeader } from "@/features/admin/components/admin-ui";
import { ThemePreviewCard } from "@/features/admin/components/theme-preview-card";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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
    <div
      className="rounded-2xl p-5"
      style={{
        background: "#fff",
        border: `1px solid ${isActive ? "var(--admin-primary)" : "var(--admin-border)"}`,
        boxShadow: isActive ? "0 0 0 3px rgba(9,63,180,0.10)" : undefined,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold" style={{ color: "var(--admin-foreground)" }}>
            {name}
          </h3>
          <p className="text-xs leading-5" style={{ color: "var(--admin-muted)" }}>
            {description}
          </p>
        </div>
        {isActive ? (
          <span
            className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{
              background: "rgba(9,63,180,0.1)",
              color: "var(--admin-primary)",
              border: "1px solid rgba(9,63,180,0.2)",
            }}
          >
            Aktif
          </span>
        ) : null}
      </div>

      <div className="mt-4">
        <ThemePreviewCard
          cssVariables={resolveThemeCssVariables(slug, null)}
          description="Preview preset"
        />
      </div>

      <form action={updateRestaurantThemePaletteAction} className="mt-4">
        <input type="hidden" name="themePaletteSlug" value={slug} />
        <button
          type="submit"
          className="admin-btn-primary w-full py-2.5"
          style={isActive ? { opacity: 0.6, cursor: "default" } : undefined}
          disabled={isActive}
        >
          {isActive ? "Sedang digunakan" : "Gunakan palet ini"}
        </button>
      </form>
    </div>
  );
}

export default async function AdminPresetsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: restaurant, error } = await supabase
    .from("restaurants")
    .select("theme_palette_slug, custom_theme_palette")
    .eq("slug", siteConfig.restaurantSlug)
    .single();

  if (error || !restaurant) {
    throw error ?? new Error("Restaurant tidak ditemukan.");
  }

  const activePalette = getThemePalette(restaurant.theme_palette_slug);
  const customPalette = restaurant.custom_theme_palette as Partial<ThemePaletteValues> | null;
  const isCustomActive = Boolean(customPalette && Object.keys(customPalette).length > 0);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Branding"
        title="Palet Warna"
        description="Kelola palet warna restoran dalam satu halaman. Bagian atas untuk kustom palet, bagian bawah untuk preset. Memilih preset akan mereset kustomisasi warna manual."
      />

      <ColorPaletteEditor
        initialPresetValues={activePalette.values}
        currentCustomValues={customPalette}
        isCustomActive={isCustomActive}
      />

      <div className="admin-card space-y-6">
        <SectionHeader
          eyebrow="Preset"
          title="Palet Warna Preset"
          description="Pilih salah satu tema warna standar untuk restoran Anda. Setiap kartu menampilkan live preview agar hasilnya mudah dibandingkan sebelum dipakai."
        />

        <div className="grid gap-4 xl:grid-cols-2">
          {themePalettes.map((palette) => (
            <ThemePaletteCard
              key={palette.slug}
              description={palette.description}
              isActive={!isCustomActive && activePalette.slug === palette.slug}
              name={palette.name}
              slug={palette.slug}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
