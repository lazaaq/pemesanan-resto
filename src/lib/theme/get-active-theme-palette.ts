import {
  defaultThemePaletteSlug,
  resolveThemeCssVariables,
  type ThemePaletteValues,
} from "@/config/theme-palettes";
import { siteConfig } from "@/config/site";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getActiveThemeCssVariables() {
  if (!hasSupabasePublicEnv()) {
    return resolveThemeCssVariables(defaultThemePaletteSlug, null);
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from("restaurants")
      .select("theme_palette_slug, custom_theme_palette")
      .eq("slug", siteConfig.restaurantSlug)
      .maybeSingle();

    return resolveThemeCssVariables(
      data?.theme_palette_slug ?? defaultThemePaletteSlug,
      data?.custom_theme_palette as Partial<ThemePaletteValues> | null,
    );
  } catch {
    return resolveThemeCssVariables(defaultThemePaletteSlug, null);
  }
}

/** @deprecated Use getActiveThemeCssVariables instead */
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
