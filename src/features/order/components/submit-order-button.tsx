"use client";

import { useMemo, useState } from "react";
import { siteConfig } from "@/config/site";
import {
  CHECKOUT_CART_COOKIE_KEY,
  type CartItem,
  formatCurrency,
  getOrderSummary,
} from "@/features/order/lib/checkout";

type SubmitOrderButtonProps = {
  cart: CartItem[];
  orderRoute: string;
};

export function SubmitOrderButton({ cart, orderRoute }: SubmitOrderButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const summary = useMemo(() => getOrderSummary(cart), [cart]);

  async function handleSubmitOrder() {
    if (!cart.length || isLoading || isSuccess) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(orderRoute, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cart,
          tableCode: siteConfig.defaultTableCode,
        }),
      });

      const result = (await response.json()) as {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(result.message ?? "Gagal menyimpan pesanan.");
      }

      document.cookie = `${CHECKOUT_CART_COOKIE_KEY}=; path=/; max-age=0; samesite=lax`;
      setIsSuccess(true);
      setMessage(result.message ?? "Pesanan berhasil masuk ke dashboard admin.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan pesanan.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        className="rounded-full bg-accent px-5 py-3.5 text-sm font-semibold text-[#3d250f] disabled:cursor-not-allowed disabled:opacity-50"
        type="button"
        disabled={!cart.length || isLoading || isSuccess}
        onClick={handleSubmitOrder}
      >
        {isLoading
          ? "Mengirim pesanan..."
          : isSuccess
            ? "Pesanan terkirim"
            : `Kirim pesanan ${formatCurrency(summary.total)}`}
      </button>

      {message ? (
        <p className="text-center text-xs leading-6 text-white/72">{message}</p>
      ) : (
        <p className="text-center text-xs leading-6 text-white/56">
          Payment sementara dinonaktifkan. Pesanan akan langsung masuk ke admin.
        </p>
      )}
    </div>
  );
}
