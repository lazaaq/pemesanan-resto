import Link from "next/link";
import { Container } from "@/components/layout/container";
import { siteConfig } from "@/config/site";
import { menuItems } from "@/features/home/data";
import { MidtransPayButton } from "@/features/order/components/midtrans-pay-button";
import {
  type CartItem,
  formatCurrency,
  getOrderSummary,
} from "@/features/order/lib/checkout";
import {
  getMidtransClientConfig,
  getMidtransSnapScriptUrl,
} from "@/lib/payments/midtrans";

const paymentRows = [
  { label: "Tipe pesanan", value: "Dine in" },
  { label: "Metode bayar", value: "Pilih di bagian bawah" },
  { label: "Estimasi siap", value: "15 - 20 menit" },
];

export function ReviewOrderShell({ cart }: { cart: CartItem[] }) {
  const summary = getOrderSummary(cart);
  const { clientKey, isProduction } = getMidtransClientConfig();
  const snapScriptUrl = getMidtransSnapScriptUrl(isProduction);
  const detailedItems = cart.map((cartItem) => {
    const menuItem = menuItems.find((item) => item.name === cartItem.name);

    return {
      ...cartItem,
      accent: menuItem?.accent ?? "from-[#c4b29d] to-[#f2e6d8]",
      description: menuItem?.description ?? "Pesanan restoran pilihan Anda.",
    };
  });

  return (
    <div className="bg-white py-0 sm:px-6">
      <div className="mobile-app-shell mx-auto flex min-h-screen w-full max-w-[576px] flex-col overflow-hidden bg-background sm:rounded-b-[2rem] sm:border sm:border-border sm:shadow-[0_24px_90px_rgba(80,44,16,0.14)]">
        <header className="sticky top-0 z-30 border-b border-border/80 bg-background/92 backdrop-blur-xl">
          <Container className="py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="font-mono text-xs uppercase tracking-[0.32em] text-primary">
                  review order
                </p>
                <div>
                  <h1 className="text-2xl font-semibold text-foreground">Review pemesanan</h1>
                  <p className="mt-1 text-sm text-muted">
                    Pastikan daftar pesanan, nomor meja, dan total pembayaran sudah sesuai.
                  </p>
                </div>
              </div>
              <div className="rounded-2xl bg-white/80 px-3 py-2 text-right shadow-sm">
                <p className="text-xs text-muted">Meja</p>
                <p className="text-sm font-semibold text-foreground">{siteConfig.defaultTableCode}</p>
              </div>
            </div>
          </Container>
        </header>

        <main className="flex-1 pb-36">
          <section className="pt-5">
            <Container className="space-y-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">
                  daftar pesanan
                </p>
                <h2 className="mt-1 text-xl font-semibold text-foreground">Item yang akan diproses</h2>
              </div>

              {detailedItems.length ? (
                <div className="overflow-hidden rounded-[1.8rem] border border-border bg-white/85 shadow-sm">
                  <div className="border-b border-border/80 px-5 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">Ringkasan item pesanan</p>
                      <span className="rounded-full bg-[#eef5f3] px-3 py-1 text-xs font-semibold text-secondary">
                        {summary.totalItems} item
                      </span>
                    </div>
                  </div>

                  <div className="divide-y divide-border/70">
                    {detailedItems.map((item) => (
                      <div key={item.name} className="px-5 py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-3">
                              <div
                                className={`h-10 w-10 shrink-0 rounded-2xl bg-gradient-to-br ${item.accent}`}
                              />
                              <div className="min-w-0">
                                <h3 className="truncate text-base font-semibold text-foreground">
                                  {item.name}
                                </h3>
                                <p className="mt-1 text-sm text-muted">
                                  {item.quantity}x {formatCurrency(item.unitPrice)}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-xs text-muted">Subtotal</p>
                            <p className="mt-1 text-sm font-semibold text-foreground">
                              {formatCurrency(item.unitPrice * item.quantity)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-[1.8rem] border border-dashed border-border bg-white/70 p-6 text-center">
                  <h3 className="text-lg font-semibold text-foreground">Belum ada pesanan</h3>
                  <p className="mt-2 text-sm leading-7 text-muted">
                    Kembali ke halaman menu untuk menambahkan makanan atau minuman lebih dulu.
                  </p>
                  <Link
                    href="/"
                    className="mt-4 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white"
                  >
                    Kembali ke menu
                  </Link>
                </div>
              )}
            </Container>
          </section>

          <section className="pt-6">
            <Container className="space-y-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">
                  rincian pembayaran
                </p>
                <h2 className="mt-1 text-xl font-semibold text-foreground">Summary checkout</h2>
              </div>

              <div className="rounded-[1.8rem] border border-border bg-white/85 p-5 shadow-sm">
                <div className="space-y-3">
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
                    <p className="text-sm text-muted">Pajak restoran (11%)</p>
                    <p className="text-sm font-semibold text-foreground">
                      {formatCurrency(summary.tax)}
                    </p>
                  </div>
                  <div className="border-t border-border/80 pt-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">Total pembayaran</p>
                      <p className="text-base font-semibold text-primary">
                        {formatCurrency(summary.total)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 rounded-[1.5rem] bg-[#fff8ef] p-4">
                  {paymentRows.map((row) => (
                    <div key={row.label} className="flex items-center justify-between gap-3">
                      <p className="text-sm text-muted">{row.label}</p>
                      <p className="text-sm font-semibold text-foreground">{row.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Container>
          </section>
        </main>

        <div className="sticky bottom-0 z-30 border-t border-border/80 bg-background/95 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur-xl">
          <Container>
            <div className="rounded-[2rem] bg-[#1f1a17] p-4 text-white shadow-[0_18px_42px_rgba(31,26,23,0.22)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/56">
                    final review
                  </p>
                  <h3 className="mt-2 text-lg font-semibold">Siap lanjut ke pembayaran</h3>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/88">
                  {summary.totalItems} item
                </span>
              </div>

              <div className="mt-5 space-y-2 rounded-[1.4rem] bg-white/7 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white/64">Nomor meja</p>
                  <p className="text-sm font-semibold text-white">{siteConfig.defaultTableCode}</p>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white/64">Total pembayaran</p>
                  <p className="text-sm font-semibold text-white">{formatCurrency(summary.total)}</p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <Link
                  href="/"
                  className="flex items-center justify-center rounded-full border border-white/18 px-5 py-3.5 text-sm font-semibold text-white"
                >
                  Kembali ke menu
                </Link>
                <MidtransPayButton
                  cart={cart}
                  clientKey={clientKey}
                  paymentRoute={siteConfig.midtrans.paymentRoute}
                  snapScriptUrl={snapScriptUrl}
                />
              </div>
            </div>
          </Container>
        </div>
      </div>
    </div>
  );
}
