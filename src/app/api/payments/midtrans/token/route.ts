import { NextResponse } from "next/server";
import { siteConfig } from "@/config/site";
import {
  type CartItem,
  getOrderSummary,
} from "@/features/order/lib/checkout";
import { getPaymentMethodOption } from "@/features/order/lib/payment-methods";
import {
  createMidtransBasicAuthHeader,
  getMidtransServerConfig,
  getMidtransSnapApiUrl,
} from "@/lib/payments/midtrans";

type CreateMidtransTokenBody = {
  cart: CartItem[];
  tableCode?: string;
  paymentMethodId?: string;
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
      typeof candidate.quantity === "number" &&
      candidate.quantity > 0 &&
      typeof candidate.unitPrice === "number" &&
      candidate.unitPrice >= 0
    );
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateMidtransTokenBody;
    const cart = sanitizeCart(body.cart);
    const paymentMethod = getPaymentMethodOption(body.paymentMethodId);
    const tableCode = typeof body.tableCode === "string" && body.tableCode.trim()
      ? body.tableCode.trim()
      : siteConfig.defaultTableCode;

    if (!cart.length) {
      return NextResponse.json(
        { message: "Cart masih kosong. Tambahkan pesanan terlebih dahulu." },
        { status: 400 },
      );
    }

    const { merchantId, serverKey, isProduction } = getMidtransServerConfig();
    const orderSummary = getOrderSummary(cart);
    const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const snapApiUrl = getMidtransSnapApiUrl(isProduction);

    const itemDetails = [
      ...cart.map((item) => ({
        id: item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        name: item.name,
        price: item.unitPrice,
        quantity: item.quantity,
      })),
      {
        id: "service-fee",
        name: "Biaya layanan",
        price: orderSummary.serviceFee,
        quantity: 1,
      },
      {
        id: "tax",
        name: "Pajak restoran 11%",
        price: orderSummary.tax,
        quantity: 1,
      },
    ].filter((item) => item.price > 0);

    const payload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: orderSummary.total,
      },
      ...(paymentMethod.enabledPayments
        ? {
            enabled_payments: paymentMethod.enabledPayments,
          }
        : {}),
      item_details: itemDetails,
      customer_details: {
        first_name: "Guest",
        last_name: `Table ${tableCode}`,
      },
      custom_field1: siteConfig.name,
      custom_field2: tableCode,
      custom_field3: merchantId,
    };

    const response = await fetch(snapApiUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: createMidtransBasicAuthHeader(serverKey),
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const result = (await response.json()) as {
      token?: string;
      redirect_url?: string;
      error_messages?: string[];
    };

    if (!response.ok || !result.token) {
      return NextResponse.json(
        {
          message:
            result.error_messages?.[0] ?? "Gagal membuat token pembayaran Midtrans.",
        },
        { status: response.status || 500 },
      );
    }

    return NextResponse.json({
      orderId,
      token: result.token,
      redirectUrl: result.redirect_url ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Terjadi kesalahan saat menyiapkan pembayaran.",
      },
      { status: 500 },
    );
  }
}
