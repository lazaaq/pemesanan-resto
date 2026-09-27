import { cookies } from "next/headers";
import { HomeShell } from "@/features/home/components/home-shell";
import { parseStoredCart, CHECKOUT_CART_COOKIE_KEY } from "@/features/order/lib/checkout";
import { getActiveThemeCssVariables } from "@/lib/theme/get-active-theme-palette";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { siteConfig } from "@/config/site";

export const dynamic = "force-dynamic";

type MenuItemRow = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    image_url: string | null;
    sort_order: number;
    is_available: boolean;
    is_featured: boolean;
};

type CategoryRow = {
    id: string;
    name: string;
    slug: string;
    sort_order: number;
    is_active: boolean;
};

type MenuItemWithCategories = MenuItemRow & { categories: string[] };

export default async function HomePage() {
    const themeCssVariables = await getActiveThemeCssVariables();
    const cookieStore = await cookies();
    const initialCart = parseStoredCart(cookieStore.get(CHECKOUT_CART_COOKIE_KEY)?.value);

    const supabase = await createServerSupabaseClient();
    const { data: restaurant } = await supabase
        .from("restaurants")
        .select("id")
        .eq("slug", siteConfig.restaurantSlug)
        .single();

    if (!restaurant) {
        return (
            <div style={themeCssVariables}>
                <HomeShell initialCart={initialCart} restaurantId={null} menuItems={[]} categorySections={[]} />
            </div>
        );
    }

    // Fetch active categories
    const { data: categories } = await supabase
        .from("categories")
        .select("id, name, slug, sort_order, is_active")
        .eq("restaurant_id", restaurant.id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

    // Fetch menu items
    const { data: menuItems } = await supabase
        .from("menu_items")
        .select("id, name, slug, description, price, image_url, sort_order, is_available, is_featured")
        .eq("restaurant_id", restaurant.id)
        .eq("is_available", true)
        .order("sort_order", { ascending: true });

    // Fetch menu-item-category relations
    const { data: menuItemCategories } = await supabase
        .from("menu_item_categories")
        .select("menu_item_id, category_id");

    // Build category slug → name mapping
    const categoryMap = new Map((categories ?? []).map((c: CategoryRow) => [c.id, c.slug]));

    // Build menu items with their category slugs
    const menuItemMap = new Map<string, MenuItemWithCategories>();
    for (const item of menuItems ?? []) {
        menuItemMap.set(item.id, { ...item, categories: [] });
    }
    for (const mic of menuItemCategories ?? []) {
        const slug = categoryMap.get(mic.category_id);
        const item = menuItemMap.get(mic.menu_item_id);
        if (slug && item) {
            item.categories.push(slug);
        }
    }

    const menuItemsWithCategories = Array.from(menuItemMap.values());

    const categorySections = (categories ?? []).map((c: CategoryRow) => ({
        label: c.name,
        slug: c.slug,
        description: "",
    }));

    return (
        <div style={themeCssVariables}>
            <HomeShell
                initialCart={initialCart}
                restaurantId={restaurant.id}
                menuItems={menuItemsWithCategories}
                categorySections={categorySections}
            />
        </div>
    );
}
