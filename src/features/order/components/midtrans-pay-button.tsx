"use client";

import Script from "next/script";
import { useMemo, useState } from "react";
import { siteConfig } from "@/config/site";
import {
  type CartItem,
  formatCurrency,
  getOrderSummary,
} from "@/features/order/lib/checkout";
import {
  getPaymentMethodOption,
  paymentMethodOptions,
} from "@/features/order/lib/payment-methods";

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options?: {
          onSuccess?: (result: unknown) => void;
          onPending?: (result: unknown) => void;
          onError?: (result: unknown) => void;
          onClose?: () => void;
        },
      ) => void;
    };
  }
}

type MidtransPayButtonProps = {
  cart: CartItem[];
  clientKey: string;
  paymentRoute: string;
  snapScriptUrl: string;
};

export function MidtransPayButton({
  cart,
  clientKey,
  paymentRoute,
  snapScriptUrl,
}: MidtransPayButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [selectedMethodId, setSelectedMethodId] = useState(paymentMethodOptions[0]?.id ?? "all");
  const summary = useMemo(() => getOrderSummary(cart), [cart]);
  const selectedMethod = getPaymentMethodOption(selectedMethodId);

  async function handlePayment() {
    if (!cart.length || isLoading) {
      return;
    }

    if (!window.snap) {
      setPaymentMessage("Widget pembayaran Midtrans belum siap. Coba beberapa detik lagi.");
      return;
    }

    setIsLoading(true);
    setPaymentMessage(null);

    try {
      const response = await fetch(paymentRoute, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cart,
          tableCode: siteConfig.defaultTableCode,
          paymentMethodId: selectedMethod.id,
        }),
      });

      const result = (await response.json()) as {
        message?: string;
        token?: string;
      };

      if (!response.ok || !result.token) {
        throw new Error(result.message ?? "Gagal membuat token pembayaran.");
      }

      window.snap.pay(result.token, {
        onSuccess: () => {
          setPaymentMessage(
            `Pembayaran berhasil diproses untuk total ${formatCurrency(summary.total)}.`,
          );
        },
        onPending: () => {
          setPaymentMessage("Pembayaran dibuat. Silakan selesaikan pembayaran di Midtrans.");
        },
        onError: () => {
          setPaymentMessage("Pembayaran gagal diproses. Silakan coba lagi.");
        },
        onClose: () => {
          setPaymentMessage("Popup pembayaran ditutup sebelum transaksi selesai.");
        },
      });
    } catch (error) {
      setPaymentMessage(
        error instanceof Error ? error.message : "Terjadi kesalahan saat membuka pembayaran.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Script
        src={snapScriptUrl}
        data-client-key={clientKey}
        strategy="afterInteractive"
      />

      <div className="space-y-3">
        <div className="rounded-[1.4rem] bg-white/7 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-white/56">
                metode pembayaran
              </p>
              <p className="mt-2 text-sm font-semibold text-white">{selectedMethod.label}</p>
            </div>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/88">
              Pilih 1
            </span>
          </div>

          <div className="mt-4 grid gap-2">
            {paymentMethodOptions.map((option) => {
              const isSelected = option.id === selectedMethod.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedMethodId(option.id)}
                  className={`rounded-[1.2rem] border px-4 py-3 text-left ${
                    isSelected
                      ? "border-accent bg-accent text-[#3d250f]"
                      : "border-white/12 bg-white/6 text-white"
                  }`}
                >
                  <p className="text-sm font-semibold">{option.label}</p>
                  <p className={`mt-1 text-xs leading-6 ${isSelected ? "text-[#5b3715]" : "text-white/64"}`}>
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <button
          className="rounded-full bg-accent px-5 py-3.5 text-sm font-semibold text-[#3d250f] disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          disabled={!cart.length || isLoading}
          onClick={handlePayment}
        >
          {isLoading ? "Menyiapkan pembayaran..." : `Bayar dengan ${selectedMethod.label}`}
        </button>

        {paymentMessage ? (
          <p className="text-center text-xs leading-6 text-white/72">{paymentMessage}</p>
        ) : null}
      </div>
    </>
  );
}
