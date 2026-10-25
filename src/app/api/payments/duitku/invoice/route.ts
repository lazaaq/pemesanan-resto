import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { siteConfig } from "@/config/site";
import { type CartItem, getOrderSummary } from "@/features/order/lib/checkout";
import { getTableCode } from "@/features/order/lib/tables";
import { sendInvoiceEmail } from "@/lib/email/resend";
import {
  createDuitkuInvoiceSignature,
  getDuitkuCreateInvoiceUrl,
  getDuitkuServerConfig,
  isDuitkuPaymentUrl,
} from "@/lib/payments/duitku";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type CreateDuitkuInvoiceBody = {
  cart: CartItem[];
  tableCode?: string;
  email?: string;
};

type DuitkuInvoiceResponse = {
  merchantCode?: string;
  reference?: string;
  paymentUrl?: string;
  statusCode?: string;
  statusMessage?: string;
};

function sanitizeCart(cart: unknown) {
  if (!Array.isArray(cart)) {
    return [] as Array<Pick<CartItem, "name" | "quantity">>;
  }

  const quantitiesByName = new Map<string, number>();

  for (const item of cart) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const candidate = item as Record<string, unknown>;
    const name = typeof candidate.name === "string" ? candidate.name.trim() : "";
    const quantity = candidate.quantity;

    if (
      !name ||
      name.length > 100 ||
      typeof quantity !== "number" ||
      !Number.isSafeInteger(quantity) ||
      quantity < 1 ||
      quantity > 99
    ) {
      continue;
    }

    quantitiesByName.set(name, (quantitiesByName.get(name) ?? 0) + quantity);
  }

  return [...quantitiesByName.entries()]
    .filter(([, quantity]) => quantity <= 99)
    .map(([name, quantity]) => ({ name, quantity }));
}

function getPublicUrl(path: string) {
  return new URL(path, siteConfig.url).toString();
}

function getSafeEmail(value: unknown) {
  return typeof value === "string" && value.trim().length <= 255
    ? value.trim().toLowerCase()
    : "";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateDuitkuInvoiceBody;
    const cart = sanitizeCart(body.cart);
    const email = getSafeEmail(body.email);
    const tableCode = getTableCode(body.tableCode, siteConfig.defaultTableCode);

    if (!cart.length) {
      return NextResponse.json(
        { message: "Cart masih kosong. Tambahkan pesanan terlebih dahulu." },
        { status: 400 },
      );
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json(
        { message: "Email pelanggan wajib diisi dengan format yang valid." },
        { status: 400 },
      );
    }

    const { merchantCode, apiKey, isProduction, expiryPeriod } =
      getDuitkuServerConfig();
    const supabase = createServiceRoleSupabaseClient();
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

    const itemNames = cart.map((item) => item.name);
    const { data: menuItems, error: menuItemsError } = await supabase
      .from("menu_items")
      .select("id, name, price, is_available")
      .eq("restaurant_id", restaurant.id)
      .in("name", itemNames);

    if (menuItemsError) {
      throw menuItemsError;
    }

    const menuItemByName = new Map(
      (menuItems ?? []).map((item) => [item.name, item]),
    );
    const unavailableItem = cart.find((item) => {
      const menuItem = menuItemByName.get(item.name);

      return !menuItem || !menuItem.is_available;
    });

    if (unavailableItem) {
      return NextResponse.json(
        { message: `Menu “${unavailableItem.name}” sudah tidak tersedia.` },
        { status: 400 },
      );
    }

    const pricedCart = cart.map((item) => ({
      ...item,
      unitPrice: Number(menuItemByName.get(item.name)?.price ?? 0),
    }));
    const orderSummary = getOrderSummary(pricedCart);

    if (!Number.isSafeInteger(orderSummary.total) || orderSummary.total <= 0) {
      return NextResponse.json(
        { message: "Total pesanan tidak valid." },
        { status: 400 },
      );
    }

    const createdOrderId = crypto.randomUUID();
    const paymentMetadata = {
      provider: "duitku",
      merchant_order_id: createdOrderId,
      status: "invoice_requested",
      customer_email: email,
    };

    const { error: orderError } = await supabase.from("orders").insert({
      id: createdOrderId,
      restaurant_id: restaurant.id,
      table_id: table?.id ?? null,
      customer_name: "Guest",
      notes: `Pesanan dari checkout Duitku. Meja: ${tableCode}`,
      order_type: "dine_in",
      status: "pending",
      payment_status: "unpaid",
      subtotal: orderSummary.subtotal,
      service_fee: orderSummary.serviceFee,
      tax: orderSummary.tax,
      total: orderSummary.total,
      metadata: {
        source: "duitku_checkout",
        table_code: tableCode,
        payment: paymentMetadata,
      },
    });

    if (orderError) {
      throw orderError;
    }

    const { error: orderItemsError } = await supabase.from("order_items").insert(
      pricedCart.map((item) => ({
        order_id: createdOrderId,
        menu_item_id: menuItemByName.get(item.name)?.id ?? null,
        item_name_snapshot: item.name,
        unit_price: item.unitPrice,
        quantity: item.quantity,
      })),
    );

    if (orderItemsError) {
      await supabase.from("orders").delete().eq("id", createdOrderId);
      throw orderItemsError;
    }

    const timestamp = Date.now().toString();
    const payload = {
      paymentAmount: orderSummary.total,
      merchantOrderId: createdOrderId,
      productDetails: `${siteConfig.name} - Meja ${tableCode}`.slice(0, 255),
      merchantUserInfo: email,
      customerVaName: `Table ${tableCode}`.slice(0, 20),
      email,
      itemDetails: pricedCart
        .map((item) => ({
          name: item.name.slice(0, 50),
          price: item.unitPrice,
          quantity: item.quantity,
        }))
        .concat([
          { name: "Biaya layanan", price: orderSummary.serviceFee, quantity: 1 },
          { name: "Pajak restoran 11%", price: orderSummary.tax, quantity: 1 },
        ])
        .filter((item) => item.price > 0),
      customerDetail: {
        firstName: "Guest",
        lastName: `Table ${tableCode}`.slice(0, 50),
        email,
      },
      callbackUrl: getPublicUrl("/api/payments/duitku/callback"),
      returnUrl: getPublicUrl("/checkout/success"),
      expiryPeriod,
    };
    const response = await fetch(getDuitkuCreateInvoiceUrl(isProduction), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-duitku-merchantcode": merchantCode,
        "x-duitku-timestamp": timestamp,
        "x-duitku-signature": createDuitkuInvoiceSignature(
          merchantCode,
          timestamp,
          apiKey,
        ),
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const result = (await response.json()) as DuitkuInvoiceResponse;

    if (
      !response.ok ||
      result.statusCode !== "00" ||
      !result.reference ||
      !result.paymentUrl ||
      !isDuitkuPaymentUrl(result.paymentUrl, isProduction)
    ) {
      await supabase
        .from("orders")
        .update({
          metadata: {
            source: "duitku_checkout",
            table_code: tableCode,
            payment: {
              ...paymentMetadata,
              status: "invoice_failed",
              gateway_status_code: result.statusCode ?? null,
              gateway_message: result.statusMessage ?? null,
            },
          },
        })
        .eq("id", createdOrderId);

      return NextResponse.json(
        {
          message:
            result.statusMessage ?? "Gagal membuat invoice pembayaran Duitku.",
        },
        { status: response.status >= 400 ? response.status : 502 },
      );
    }

    let invoiceEmailNotification: {
      status: string;
      attempted_at: string;
      message_id?: string;
    } = {
      status: "failed",
      attempted_at: new Date().toISOString(),
    };

    try {
      const messageId = await sendInvoiceEmail({
        to: email,
        orderId: createdOrderId,
        restaurantName: siteConfig.name,
        tableCode,
        items: pricedCart.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.unitPrice,
        })),
        subtotal: orderSummary.subtotal,
        serviceFee: orderSummary.serviceFee,
        tax: orderSummary.tax,
        total: orderSummary.total,
        paymentUrl: result.paymentUrl,
      });

      invoiceEmailNotification = {
        status: "sent",
        attempted_at: new Date().toISOString(),
        message_id: messageId,
      };
    } catch (error) {
      console.error("Duitku invoice email error", error);
    }

    await supabase
      .from("orders")
      .update({
        metadata: {
          source: "duitku_checkout",
          table_code: tableCode,
          payment: {
            ...paymentMetadata,
            status: "invoice_created",
            reference: result.reference,
            gateway_status_code: result.statusCode,
          },
          notifications: {
            invoice: invoiceEmailNotification,
          },
        },
      })
      .eq("id", createdOrderId);

    revalidatePath("/admin");
    revalidatePath("/admin/orders");

    return NextResponse.json({
      orderId: createdOrderId,
      reference: result.reference,
      paymentUrl: result.paymentUrl,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat menyiapkan pembayaran Duitku.",
      },
      { status: 500 },
    );
  }
}
