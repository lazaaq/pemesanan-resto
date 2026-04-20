import { defaultThemePaletteSlug } from "@/config/theme-palettes";
import { siteConfig } from "@/config/site";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getActiveThemePaletteSlug() {
  if (!hasSupabasePublicEnv()) {
    return defaultThemePaletteSlug;
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from("restaurants")
      .select("theme_palette_slug")
      .eq("slug", siteConfig.restaurantSlug)
      .maybeSingle();

    return data?.theme_palette_slug ?? defaultThemePaletteSlug;
  } catch {
    return defaultThemePaletteSlug;
  }
}
