import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { siteConfig } from "@/config/site";
import {
  type CartItem,
  getOrderSummary,
} from "@/features/order/lib/checkout";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type CreateOrderBody = {
  cart: CartItem[];
  tableCode?: string;
};

function sanitizeCart(cart: unknown) {
  if (!Array.isArray(cart)) {
    return [] as CartItem[];
  }

  return cart.filter((item): item is CartItem => {
    if (!item || typeof item !== "object") {
      return false;
    }

    const candidate = item as Record<string, unknown>;

    return (
      typeof candidate.name === "string" &&
      candidate.name.trim().length > 0 &&
      typeof candidate.quantity === "number" &&
      Number.isInteger(candidate.quantity) &&
      candidate.quantity > 0 &&
      typeof candidate.unitPrice === "number" &&
      candidate.unitPrice >= 0
    );
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateOrderBody;
    const cart = sanitizeCart(body.cart);
    const tableCode = typeof body.tableCode === "string" && body.tableCode.trim()
      ? body.tableCode.trim()
      : siteConfig.defaultTableCode;

    if (!cart.length) {
      return NextResponse.json(
        { message: "Cart masih kosong. Tambahkan pesanan terlebih dahulu." },
        { status: 400 },
      );
    }

    const supabase = await createServerSupabaseClient();
    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select("id")
      .eq("slug", siteConfig.restaurantSlug)
      .single();

    if (restaurantError || !restaurant) {
      return NextResponse.json(
        { message: "Restaurant default tidak ditemukan." },
        { status: 404 },
      );
    }

    const { data: table } = await supabase
      .from("dining_tables")
      .select("id")
      .eq("restaurant_id", restaurant.id)
      .eq("code", tableCode)
      .eq("is_active", true)
      .maybeSingle();

    const itemNames = [...new Set(cart.map((item) => item.name))];
    const { data: menuItems } = await supabase
      .from("menu_items")
      .select("id, name")
      .eq("restaurant_id", restaurant.id)
      .in("name", itemNames);

    const menuItemIdByName = new Map((menuItems ?? []).map((item) => [item.name, item.id]));
    const orderSummary = getOrderSummary(cart);
    const orderId = crypto.randomUUID();

    const { error: orderError } = await supabase.from("orders").insert({
      id: orderId,
      restaurant_id: restaurant.id,
      table_id: table?.id ?? null,
      notes: `Testing order dari halaman user. Meja: ${tableCode}`,
      order_type: "dine_in",
      status: "pending",
      payment_status: "unpaid",
      subtotal: orderSummary.subtotal,
      service_fee: orderSummary.serviceFee,
      tax: orderSummary.tax,
      total: orderSummary.total,
      metadata: {
        source: "user_checkout_testing",
        table_code: tableCode,
        payment_disabled: true,
      },
    });

    if (orderError) {
      return NextResponse.json(
        { message: orderError.message },
        { status: 500 },
      );
    }

    const { error: orderItemsError } = await supabase.from("order_items").insert(
      cart.map((item) => ({
        order_id: orderId,
        menu_item_id: menuItemIdByName.get(item.name) ?? null,
        item_name_snapshot: item.name,
        unit_price: item.unitPrice,
        quantity: item.quantity,
      })),
    );

    if (orderItemsError) {
      return NextResponse.json(
        { message: orderItemsError.message },
        { status: 500 },
      );
    }

    revalidatePath("/admin");
    revalidatePath("/admin/orders");

    return NextResponse.json({
      orderId,
      message: "Pesanan berhasil masuk ke dashboard admin.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan pesanan.",
      },
      { status: 500 },
    );
  }
}
