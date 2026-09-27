export type CartItem = {
  name: string;
  quantity: number;
  unitPrice: number;
};

import { siteConfig } from "@/config/site";

export const CHECKOUT_CART_COOKIE_KEY = "restoflow-order-cart";
export const TABLE_CODE_COOKIE_KEY = "restoflow-table-code";
export const SERVICE_FEE = 6000;
export const TAX_RATE = 0.11;

export function readTableCode(): string {
  if (typeof document === "undefined") {
    return siteConfig.defaultTableCode;
  }
  const match = document.cookie.match(
    new RegExp(`(^| )(${TABLE_CODE_COOKIE_KEY})=([^;]+)`),
  );
  return match?.[3] ?? siteConfig.defaultTableCode;
}

export function persistTableCode(tableCode: string) {
  if (typeof window === "undefined") {
    return;
  }
  document.cookie = `${TABLE_CODE_COOKIE_KEY}=${tableCode}; path=/; max-age=604800; samesite=lax`;
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function getOrderSummary(cart: CartItem[]) {
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
  const serviceFee = cart.length ? SERVICE_FEE : 0;
  const tax = Math.round(subtotal * TAX_RATE);
  const total = subtotal + serviceFee + tax;

  return {
    totalItems,
    subtotal,
    serviceFee,
    tax,
    total,
  };
}

export function parseStoredCart(rawValue?: string | null) {
  try {
    if (!rawValue) {
      return [] as CartItem[];
    }

    const parsed = JSON.parse(decodeURIComponent(rawValue)) as unknown;

    if (!Array.isArray(parsed)) {
      return [] as CartItem[];
    }

    return parsed.filter(isCartItem);
  } catch {
    return [] as CartItem[];
  }
}

export function persistCart(cart: CartItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  const serialized = encodeURIComponent(JSON.stringify(cart));
  document.cookie = `${CHECKOUT_CART_COOKIE_KEY}=${serialized}; path=/; max-age=604800; samesite=lax`;
}

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Record<string, unknown>;

  return (
    typeof item.name === "string" &&
    typeof item.quantity === "number" &&
    typeof item.unitPrice === "number"
  );
}
