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
  const [message, setMessage] = useState<{ type: "error" | "info"; text: string } | null>(null);
  const summary = useMemo(() => getOrderSummary(cart), [cart]);

  async function handlePayment() {
    if (!cart.length || isLoading) {
      return;
    }

    if (!email.trim()) {
      setMessage({ type: "error", text: "Email wajib diisi untuk melanjutkan pembayaran." });
      return;
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setMessage({ type: "error", text: "Format email tidak valid. Cek kembali alamat email Anda." });
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
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat membuka pembayaran Duitku.",
      });
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Email input */}
      <div>
        <label
          htmlFor="duitku-email"
          className="mb-1.5 block text-xs font-semibold text-white/80"
        >
          Email pelanggan{" "}
          <span className="text-accent font-bold">*</span>
        </label>
        <p className="mb-2 text-[11px] leading-relaxed text-white/50">
          Dipakai Duitku untuk notifikasi status transaksi Anda.
        </p>
        <input
          id="duitku-email"
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (message?.type === "error") setMessage(null);
          }}
          placeholder="nama@email.com"
          autoComplete="email"
          maxLength={255}
          className={`w-full rounded-xl border px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 transition-colors bg-white/8 ${message?.type === "error"
              ? "border-red-400/60 focus:border-red-400"
              : "border-white/15 focus:border-accent/70 focus:bg-white/12"
            }`}
        />

        {/* Feedback message */}
        {message && (
          <p
            className={`mt-2 text-xs leading-relaxed ${message.type === "error" ? "text-red-300" : "text-white/60"
              }`}
            role={message.type === "error" ? "alert" : "status"}
          >
            {message.text}
          </p>
        )}
      </div>

      {/* Pay button */}
      <button
        id="duitku-pay-btn"
        type="button"
        disabled={!cart.length || isLoading}
        onClick={handlePayment}
        className="w-full rounded-full bg-accent px-5 py-3.5 text-sm font-bold text-[#3d250f] shadow-md hover:bg-accent/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 transition-all"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Menyiapkan pembayaran…
          </span>
        ) : (
          `Bayar via Duitku · ${formatCurrency(summary.total)}`
        )}
      </button>

      {!message && (
        <p className="text-center text-[11px] text-white/45">
          Anda akan diarahkan ke halaman pembayaran Duitku.
        </p>
      )}
    </div>
  );
}
