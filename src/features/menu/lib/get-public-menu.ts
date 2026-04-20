import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getPublicMenu(restaurantSlug: string) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("menu_items")
    .select(
      `
        id,
        name,
        slug,
        description,
        price,
        image_url,
        preparation_time_minutes,
        is_featured,
        sort_order,
        menu_item_categories (
          categories (
            id,
            name,
            slug
          )
        ),
        restaurants!inner (
          slug
        )
      `,
    )
    .eq("restaurants.slug", restaurantSlug)
    .eq("is_available", true)
    .order("sort_order", { ascending: true });

  if (error) {
    throw error;
  }

  return data;
}
