import { cookies } from "next/headers";
import { HomeShell, type MenuItemData } from "@/features/home/components/home-shell";
import { parseStoredCart, CHECKOUT_CART_COOKIE_KEY, TABLE_CODE_COOKIE_KEY } from "@/features/order/lib/checkout";
import { getTableCode } from "@/features/order/lib/tables";
import { getActiveThemeCssVariables } from "@/lib/theme/get-active-theme-palette";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { siteConfig } from "@/config/site";
import { categorySections as fallbackCategories, menuItems as fallbackMenuItems } from "@/features/home/data";

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

type HomeSearchParams = Promise<{
  table?: string | string[];
  t?: string | string[];
}>;

export default async function HomePage({
  searchParams,
}: {
  searchParams: HomeSearchParams;
}) {
  const themeCssVariables = await getActiveThemeCssVariables();
  const cookieStore = await cookies();
  const initialCart = parseStoredCart(cookieStore.get(CHECKOUT_CART_COOKIE_KEY)?.value);
  const params = await searchParams;

  let requestedTable = Array.isArray(params.table) ? params.table[0] : params.table;
  const rawToken = Array.isArray(params.t) ? params.t[0] : params.t;

  let categories: { label: string; slug: string; description?: string }[] = [];
  let menuItemsWithCategories: MenuItemData[] = [];

  try {
    const supabase = await createServerSupabaseClient();
    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("id")
      .eq("slug", siteConfig.restaurantSlug)
      .maybeSingle();

    if (restaurant) {
      // If token `t` was provided via QR scan, decode base64 "restaurantId:tableCode"
      if (rawToken) {
        try {
          const decoded = Buffer.from(rawToken, "base64").toString("utf-8");
          const colonIdx = decoded.indexOf(":");
          if (colonIdx !== -1) {
            const tokenRid = decoded.slice(0, colonIdx);
            const tokenCode = decoded.slice(colonIdx + 1).trim();
            if (tokenRid === restaurant.id && tokenCode) {
              requestedTable = tokenCode;
            }
          }
        } catch {
          // ignore invalid base64
        }
      }

      const { data: catRows } = await supabase
        .from("categories")
        .select("id, name, slug, sort_order, is_active")
        .eq("restaurant_id", restaurant.id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      const { data: itemRows } = await supabase
        .from("menu_items")
        .select("id, name, slug, description, price, image_url, sort_order, is_available, is_featured")
        .eq("restaurant_id", restaurant.id)
        .order("is_available", { ascending: false })
        .order("sort_order", { ascending: true });

      const { data: menuItemCategories } = await supabase
        .from("menu_item_categories")
        .select("menu_item_id, category_id");

      if (catRows && catRows.length > 0) {
        const categoryMap = new Map((catRows as CategoryRow[]).map((c) => [c.id, c.slug]));
        const menuItemMap = new Map<string, MenuItemData>();

        for (const item of (itemRows ?? []) as MenuItemRow[]) {
          menuItemMap.set(item.id, { ...item, categories: [] });
        }

        for (const mic of menuItemCategories ?? []) {
          const slug = categoryMap.get(mic.category_id);
          const item = menuItemMap.get(mic.menu_item_id);
          if (slug && item) {
            item.categories.push(slug);
          }
        }

        menuItemsWithCategories = Array.from(menuItemMap.values());
        categories = (catRows as CategoryRow[]).map((c) => ({
          label: c.name,
          slug: c.slug,
          description: "",
        }));
      }
    }
  } catch (error) {
    console.error("Failed to load restaurant data from Supabase:", error);
  }

  // Fallback to static menu data if database has no active categories or items
  if (!categories.length) {
    categories = fallbackCategories.map((c) => ({ ...c }));
    menuItemsWithCategories = fallbackMenuItems.map((item) => ({
      name: item.name,
      description: item.description,
      price: item.priceValue,
      accent: item.accent,
      categories: [...item.categories],
      is_available: true,
    }));
  }

  const cookieTable = cookieStore.get(TABLE_CODE_COOKIE_KEY)?.value;
  const tableCode = getTableCode(requestedTable || cookieTable);

  return (
    <div style={themeCssVariables}>
      <HomeShell
        initialCart={initialCart}
        menuItems={menuItemsWithCategories}
        categorySections={categories}
        tableCode={tableCode}
      />
    </div>
  );
}
