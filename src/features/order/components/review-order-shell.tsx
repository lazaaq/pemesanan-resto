"use client";

import Link from "next/link";
import { Container } from "@/components/layout/container";
import { siteConfig } from "@/config/site";
import { menuItems } from "@/features/home/data";
import { DuitkuPayButton } from "@/features/order/components/duitku-pay-button";
import {
  type CartItem,
  formatCurrency,
  getOrderSummary,
  readTableCode,
} from "@/features/order/lib/checkout";

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconArrowLeft() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function IconReceipt() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

// ─── Static payment info ──────────────────────────────────────────────────────

const ORDER_META = [
  { label: "Tipe pesanan", value: "Dine in" },
  { label: "Pembayaran", value: "Duitku" },
  { label: "Estimasi siap", value: "15–20 menit" },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function ReviewOrderShell({ cart, tableCode }: { cart: CartItem[]; tableCode: string }) {
  const summary = getOrderSummary(cart);
  const detailedItems = cart.map((cartItem) => {
    const menuItem = menuItems.find((item) => item.name === cartItem.name);
    return {
      ...cartItem,
      accent: menuItem?.accent ?? "from-[#c4b29d] to-[#f2e6d8]",
    };
  });

  return (
    <div className="bg-white sm:py-0 sm:px-6">
      <div className="mobile-app-shell mx-auto flex min-h-screen w-full max-w-[576px] flex-col bg-background sm:rounded-b-[2rem] sm:border sm:border-border sm:shadow-[0_24px_90px_rgba(80,44,16,0.14)]">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-30 border-b border-border/80 bg-background/96 backdrop-blur-xl">
          <Container className="py-3">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-white text-muted hover:border-primary/30 hover:text-primary transition-colors"
                aria-label="Kembali ke menu"
              >
                <IconArrowLeft />
              </Link>
              <div className="min-w-0 flex-1">
                <h1 className="text-base font-bold text-foreground">Review Pesanan</h1>
                <p className="text-xs text-muted">Pastikan semua item dan total sudah sesuai</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 shadow-sm">
                <span className="text-[11px] text-muted">Meja</span>
                <span className="text-sm font-bold text-foreground">{tableCode}</span>
              </div>
            </div>
          </Container>
        </header>

        {/* ── Main content ───────────────────────────────────────────────── */}
        <main className="flex-1 pb-6">
          <Container className="pt-5 space-y-4">

            {/* ── Order items ─────────────────────────────────────────────── */}
            <section aria-labelledby="order-items-heading">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 id="order-items-heading" className="text-base font-bold text-foreground">
                  Daftar Pesanan
                </h2>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {summary.totalItems} item
                </span>
              </div>

              {detailedItems.length ? (
                <div className="rounded-2xl border border-border bg-white/90 shadow-sm overflow-hidden">
                  <div className="divide-y divide-border/60">
                    {detailedItems.map((item) => (
                      <div key={item.name} className="flex items-center gap-3 px-4 py-3.5">
                        {/* Thumbnail */}
                        <div
                          className={`h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br ${item.accent}`}
                          aria-hidden="true"
                        />
                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
                          <p className="text-xs text-muted mt-0.5">
                            {item.quantity}× {formatCurrency(item.unitPrice)}
                          </p>
                        </div>
                        {/* Subtotal */}
                        <p className="shrink-0 text-sm font-bold text-foreground">
                          {formatCurrency(item.unitPrice * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-white/70 p-6 text-center">
                  <p className="text-2xl mb-2" aria-hidden="true">🛒</p>
                  <h3 className="text-sm font-semibold text-foreground">Belum ada pesanan</h3>
                  <p className="mt-1 text-xs text-muted leading-relaxed">
                    Kembali ke halaman menu untuk menambahkan makanan atau minuman.
                  </p>
                  <Link
                    href="/"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-xs font-semibold text-white"
                  >
                    <IconArrowLeft />
                    Kembali ke menu
                  </Link>
                </div>
              )}
            </section>

            {/* ── Payment summary ──────────────────────────────────────────── */}
            {detailedItems.length > 0 && (
              <section aria-labelledby="payment-summary-heading">
                <h2 id="payment-summary-heading" className="text-base font-bold text-foreground mb-3">
                  Rincian Pembayaran
                </h2>

                <div className="rounded-2xl border border-border bg-white/90 shadow-sm overflow-hidden">
                  {/* Price rows */}
                  <div className="px-4 py-4 space-y-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-muted">Subtotal pesanan</p>
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(summary.subtotal)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-muted">Biaya layanan</p>
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(summary.serviceFee)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-muted">Pajak (11%)</p>
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(summary.tax)}
                      </p>
                    </div>
                  </div>

                  {/* Total row */}
                  <div className="border-t border-border/60 bg-primary/5 px-4 py-3.5 flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-foreground">Total pembayaran</p>
                    <p className="text-base font-extrabold text-primary">
                      {formatCurrency(summary.total)}
                    </p>
                  </div>

                  {/* Order meta */}
                  <div className="border-t border-border/40 bg-[#fff9f0] px-4 py-3.5 grid gap-2">
                    {ORDER_META.map((row) => (
                      <div key={row.label} className="flex items-center justify-between gap-3">
                        <p className="text-xs text-muted">{row.label}</p>
                        <p className="text-xs font-semibold text-foreground">{row.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* ── Payment panel ────────────────────────────────────────────── */}
            {detailedItems.length > 0 && (
              <section aria-labelledby="checkout-panel-heading">
                <div className="rounded-2xl bg-[#1a2e24] p-4 shadow-lg">
                  {/* Panel header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-white">
                        <IconReceipt />
                      </div>
                      <div>
                        <h2
                          id="checkout-panel-heading"
                          className="text-sm font-bold text-white leading-tight"
                        >
                          Selesaikan Pembayaran
                        </h2>
                        <p className="text-[11px] text-white/55 leading-tight mt-0.5">
                          Masukkan email untuk notifikasi
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-white/50">Total</p>
                      <p className="text-sm font-bold text-accent">{formatCurrency(summary.total)}</p>
                    </div>
                  </div>

                  {/* Info baris */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="rounded-xl bg-white/8 px-3 py-2.5">
                      <p className="text-[11px] text-white/50">Nomor meja</p>
                      <p className="text-sm font-bold text-white">{tableCode}</p>
                    </div>
                    <div className="rounded-xl bg-white/8 px-3 py-2.5">
                      <p className="text-[11px] text-white/50">Jumlah item</p>
                      <p className="text-sm font-bold text-white">{summary.totalItems} item</p>
                    </div>
                  </div>

                  {/* Payment form + CTA */}
                  <DuitkuPayButton
                    cart={cart}
                    paymentRoute={siteConfig.duitku.paymentRoute}
                    tableCode={tableCode}
                  />

                  {/* Back link */}
                  <Link
                    href="/"
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full border border-white/15 px-5 py-3 text-xs font-semibold text-white/70 hover:border-white/30 hover:text-white transition-colors"
                  >
                    <IconArrowLeft />
                    Kembali ke menu
                  </Link>
                </div>
              </section>
            )}

          </Container>
        </main>

      </div>
    </div>
  );
}
