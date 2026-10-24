"use client";

import { useMemo, useState } from "react";
import {
  type CartItem,
  formatCurrency,
  getOrderSummary,
} from "@/features/order/lib/checkout";

type DuitkuPayButtonProps = {
  cart: CartItem[];
  paymentRoute: string;
  tableCode: string;
};

export function DuitkuPayButton({ cart, paymentRoute, tableCode }: DuitkuPayButtonProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const summary = useMemo(() => getOrderSummary(cart), [cart]);

  async function handlePayment() {
    if (!cart.length || isLoading) {
      return;
    }

    if (!email.trim()) {
      setMessage("Email pelanggan wajib diisi untuk membuat pembayaran Duitku.");
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(paymentRoute, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cart,
          tableCode,
          email,
        }),
      });
      const result = (await response.json()) as {
        message?: string;
        paymentUrl?: string;
      };

      if (!response.ok || !result.paymentUrl) {
        throw new Error(result.message ?? "Gagal membuat invoice pembayaran Duitku.");
      }

      window.location.assign(result.paymentUrl);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat membuka pembayaran Duitku.",
      );
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-[1.4rem] bg-white/7 p-4">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-white/56">
          data pembayaran
        </p>
        <p className="mt-2 text-sm leading-6 text-white/72">
          Email dipakai Duitku untuk kebutuhan transaksi dan notifikasi pembayaran.
        </p>
        <div className="mt-4 grid gap-3">
          <label className="grid gap-1.5 text-xs font-semibold text-white/80">
            Email pelanggan <span className="text-accent">wajib</span>
            <input
              className="rounded-xl border border-white/12 bg-white/8 px-3 py-2.5 text-sm font-normal text-white outline-none placeholder:text-white/35 focus:border-accent"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nama@email.com"
              autoComplete="email"
              maxLength={255}
            />
          </label>
        </div>
      </div>

      <button
        className="w-full rounded-full bg-accent px-5 py-3.5 text-sm font-semibold text-[#3d250f] disabled:cursor-not-allowed disabled:opacity-50"
        type="button"
        disabled={!cart.length || isLoading}
        onClick={handlePayment}
      >
        {isLoading
          ? "Menyiapkan pembayaran..."
          : `Bayar via Duitku ${formatCurrency(summary.total)}`}
      </button>

      {message ? (
        <p className="text-center text-xs leading-6 text-white/72">{message}</p>
      ) : (
        <p className="text-center text-xs leading-6 text-white/56">
          Anda akan diarahkan ke halaman pembayaran Duitku.
        </p>
      )}
    </div>
  );
}
