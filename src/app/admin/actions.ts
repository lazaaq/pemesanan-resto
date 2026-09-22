"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getThemePalette, type EditableTokenKey } from "@/config/theme-palettes";
import { siteConfig } from "@/config/site";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils/slugify";

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getNumber(formData: FormData, key: string, fallback = 0) {
  const value = Number(getString(formData, key));

  return Number.isFinite(value) ? value : fallback;
}

function getCheckbox(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function ensureSlug(name: string, customSlug: string) {
  const slug = slugify(customSlug || name);

  if (!slug) {
    throw new Error("Slug tidak valid.");
  }

  return slug;
}

async function requireAuthenticatedSupabase() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login" as never);
  }

  return supabase;
}

async function getRestaurantId() {
  const supabase = await requireAuthenticatedSupabase();
  const { data, error } = await supabase
    .from("restaurants")
    .select("id")
    .eq("slug", siteConfig.restaurantSlug)
    .single();

  if (error || !data) {
    throw new Error("Restaurant default belum tersedia di database.");
  }

  return {
    restaurantId: data.id,
    supabase,
  };
}

async function replaceMenuItemCategories(
  menuItemId: string,
  categoryIds: string[],
  supabase: Awaited<ReturnType<typeof requireAuthenticatedSupabase>>,
) {
  const { error: deleteError } = await supabase
    .from("menu_item_categories")
    .delete()
    .eq("menu_item_id", menuItemId);

  if (deleteError) {
    throw deleteError;
  }

  if (!categoryIds.length) {
    return;
  }

  const { error: insertError } = await supabase.from("menu_item_categories").insert(
    categoryIds.map((categoryId) => ({
      menu_item_id: menuItemId,
      category_id: categoryId,
    })),
  );

  if (insertError) {
    throw insertError;
  }
}

function refreshAdminViews() {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/presets");
  revalidatePath("/admin/custom-palette");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/menus");
  revalidatePath("/admin/login");
}

export async function signInAdminAction(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const email = getString(formData, "email");
  const password = getString(formData, "password");

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(
      `/admin/login?error=${encodeURIComponent("Email atau password tidak valid.")}` as never,
    );
  }

  redirect("/admin" as never);
}

export async function signOutAdminAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/admin/login" as never);
}

export async function createCategoryAction(formData: FormData) {
  const { restaurantId, supabase } = await getRestaurantId();
  const name = getString(formData, "name");
  const slug = ensureSlug(name, getString(formData, "slug"));

  const { error } = await supabase.from("categories").insert({
    restaurant_id: restaurantId,
    name,
    slug,
    sort_order: getNumber(formData, "sortOrder"),
    is_active: getCheckbox(formData, "isActive"),
  });

  if (error) {
    throw error;
  }

  refreshAdminViews();
}

export async function updateRestaurantThemePaletteAction(formData: FormData) {
  const { restaurantId, supabase } = await getRestaurantId();
  const palette = getThemePalette(getString(formData, "themePaletteSlug"));

  const { error } = await supabase
    .from("restaurants")
    .update({
      theme_palette_slug: palette.slug,
      // Clear any custom palette when switching to a preset
      custom_theme_palette: null,
    })
    .eq("id", restaurantId);

  if (error) {
    throw error;
  }

  refreshAdminViews();
}

const EDITABLE_KEYS: EditableTokenKey[] = [
  "background",
  "foreground",
  "muted",
  "card",
  "border",
  "primary",
  "secondary",
  "accent",
];

export async function saveCustomPaletteAction(formData: FormData) {
  const { restaurantId, supabase } = await getRestaurantId();

  const customValues: Record<string, string> = {};
  for (const key of EDITABLE_KEYS) {
    const val = getString(formData, key);
    if (val) customValues[key] = val;
  }

  const { error } = await supabase
    .from("restaurants")
    .update({ custom_theme_palette: customValues })
    .eq("id", restaurantId);

  if (error) {
    throw error;
  }

  refreshAdminViews();
}

export async function resetCustomPaletteAction() {
  const { restaurantId, supabase } = await getRestaurantId();

  const { error } = await supabase
    .from("restaurants")
    .update({ custom_theme_palette: null })
    .eq("id", restaurantId);

  if (error) {
    throw error;
  }

  refreshAdminViews();
}

export async function updateCategoryAction(formData: FormData) {
  const { restaurantId, supabase } = await getRestaurantId();
  const categoryId = getString(formData, "categoryId");
  const name = getString(formData, "name");
  const slug = ensureSlug(name, getString(formData, "slug"));

  const { error } = await supabase
    .from("categories")
    .update({
      name,
      slug,
      sort_order: getNumber(formData, "sortOrder"),
      is_active: getCheckbox(formData, "isActive"),
    })
    .eq("restaurant_id", restaurantId)
    .eq("id", categoryId);

  if (error) {
    throw error;
  }

  refreshAdminViews();
}

export async function deleteCategoryAction(formData: FormData) {
  const { restaurantId, supabase } = await getRestaurantId();
  const categoryId = getString(formData, "categoryId");

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("restaurant_id", restaurantId)
    .eq("id", categoryId);

  if (error) {
    throw error;
  }

  refreshAdminViews();
}

export async function createMenuItemAction(formData: FormData) {
  const { restaurantId, supabase } = await getRestaurantId();
  const name = getString(formData, "name");
  const slug = ensureSlug(name, getString(formData, "slug"));
  const categoryIds = formData.getAll("categoryIds").map(String).filter(Boolean);

  const { data, error } = await supabase
    .from("menu_items")
    .insert({
      restaurant_id: restaurantId,
      name,
      slug,
      description: getString(formData, "description") || null,
      price: getNumber(formData, "price"),
      image_url: getString(formData, "imageUrl") || null,
      preparation_time_minutes: getNumber(formData, "preparationTimeMinutes", 15),
      sort_order: getNumber(formData, "sortOrder"),
      is_available: getCheckbox(formData, "isAvailable"),
      is_featured: getCheckbox(formData, "isFeatured"),
    })
    .select("id")
    .single();

  if (error || !data) {
    throw error ?? new Error("Gagal membuat menu.");
  }

  await replaceMenuItemCategories(data.id, categoryIds, supabase);
  refreshAdminViews();
}

export async function updateMenuItemAction(formData: FormData) {
  const { restaurantId, supabase } = await getRestaurantId();
  const menuItemId = getString(formData, "menuItemId");
  const name = getString(formData, "name");
  const slug = ensureSlug(name, getString(formData, "slug"));
  const categoryIds = formData.getAll("categoryIds").map(String).filter(Boolean);

  const { error } = await supabase
    .from("menu_items")
    .update({
      name,
      slug,
      description: getString(formData, "description") || null,
      price: getNumber(formData, "price"),
      image_url: getString(formData, "imageUrl") || null,
      preparation_time_minutes: getNumber(formData, "preparationTimeMinutes", 15),
      sort_order: getNumber(formData, "sortOrder"),
      is_available: getCheckbox(formData, "isAvailable"),
      is_featured: getCheckbox(formData, "isFeatured"),
    })
    .eq("restaurant_id", restaurantId)
    .eq("id", menuItemId);

  if (error) {
    throw error;
  }

  await replaceMenuItemCategories(menuItemId, categoryIds, supabase);
  refreshAdminViews();
}

export async function deleteMenuItemAction(formData: FormData) {
  const { restaurantId, supabase } = await getRestaurantId();
  const menuItemId = getString(formData, "menuItemId");

  const { error } = await supabase
    .from("menu_items")
    .delete()
    .eq("restaurant_id", restaurantId)
    .eq("id", menuItemId);

  if (error) {
    throw error;
  }

  refreshAdminViews();
}

/**
 * Persist the new sort_order after drag-and-drop reordering.
 * Receives an ordered array of category IDs; each ID gets sort_order = index.
 */
export async function reorderCategoriesAction(formData: FormData) {
  const { restaurantId, supabase } = await getRestaurantId();
  const raw = getString(formData, "orderedIds");
  const orderedIds: string[] = JSON.parse(raw);

  const updates = orderedIds.map((id, index) =>
    supabase
      .from("categories")
      .update({ sort_order: index })
      .eq("id", id)
      .eq("restaurant_id", restaurantId),
  );

  const results = await Promise.all(updates);
  const firstError = results.find((r) => r.error)?.error;
  if (firstError) throw firstError;

  refreshAdminViews();
}

/**
 * Toggle the is_active flag of a single category.
 * Called client-side via startTransition so the toggle feels instant.
 */
export async function toggleCategoryActiveAction(formData: FormData) {
  const { restaurantId, supabase } = await getRestaurantId();
  const categoryId = getString(formData, "categoryId");
  const isActive = formData.get("isActive") === "true";

  const { error } = await supabase
    .from("categories")
    .update({ is_active: isActive })
    .eq("id", categoryId)
    .eq("restaurant_id", restaurantId);

  if (error) throw error;

  refreshAdminViews();
}
