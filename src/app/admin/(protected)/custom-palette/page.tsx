import { siteConfig } from "@/config/site";
import { getThemePalette, type ThemePaletteValues } from "@/config/theme-palettes";
import { ColorPaletteEditor } from "@/features/admin/components/color-palette-editor";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminCustomPalettePage() {
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
    <ColorPaletteEditor
      initialPresetValues={activePalette.values}
      currentCustomValues={customPalette}
      isCustomActive={isCustomActive}
    />
  );
}
