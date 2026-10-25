"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { siteConfig } from "@/config/site";
import { CHECKOUT_CART_COOKIE_KEY } from "@/features/order/lib/checkout";

function IconCheckCircle() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-12 w-12"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function IconChefHat() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-5 w-5"
    >
      <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
      <line x1="6" y1="17" x2="18" y2="17" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-5 w-5"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-4 w-4"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

// ─── Animated dots ────────────────────────────────────────────────────────────

function AnimatedDots() {
  return (
    <span className="inline-flex items-end gap-0.5" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce"
          style={{ animationDelay: `${i * 0.18}s`, animationDuration: "1.1s" }}
        />
      ))}
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OrderSuccessShell({ tableCode }: { tableCode: string }) {
  // Clear the cart cookie on mount so user starts fresh if they order again
  useEffect(() => {
    document.cookie = `${CHECKOUT_CART_COOKIE_KEY}=; path=/; max-age=0; samesite=lax`;
  }, []);

  const tableDisplay = tableCode || siteConfig.defaultTableCode;

  return (
    <div className="bg-white sm:py-0 sm:px-6">
      <div className="mobile-app-shell mx-auto flex min-h-screen w-full max-w-[576px] flex-col bg-background sm:rounded-b-[2rem] sm:border sm:border-border sm:shadow-[0_24px_90px_rgba(20,44,30,0.14)]">

        {/* ── Header bar ─────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-30 border-b border-border/70 bg-background/96 backdrop-blur-xl">
          <Container className="py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 text-primary"
                  aria-hidden="true"
                >
                  <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                  <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                  <line x1="6" y1="1" x2="6" y2="4" />
                  <line x1="10" y1="1" x2="10" y2="4" />
                  <line x1="14" y1="1" x2="14" y2="4" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold leading-tight text-foreground">{siteConfig.name}</p>
                <p className="text-[11px] text-muted leading-tight">Dine in · Pesan di sini</p>
              </div>
            </div>
          </Container>
        </header>

        {/* ── Main ───────────────────────────────────────────────────────── */}
        <main className="flex flex-1 flex-col items-center justify-center pb-16">
          <Container className="flex w-full flex-col items-center gap-8 py-10">

            {/* Success icon with animated ring */}
            <div className="relative flex items-center justify-center">
              {/* Pulsing ring */}
              <span className="absolute inline-flex h-28 w-28 rounded-full bg-primary/10 animate-ping opacity-60" style={{ animationDuration: "2.4s" }} />
              <span className="absolute inline-flex h-24 w-24 rounded-full bg-primary/8" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 text-primary">
                <IconCheckCircle />
              </div>
            </div>

            {/* Status text */}
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-2">
                Pembayaran Berhasil
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Pesanan Diterima! 🎉
              </h1>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
                Terima kasih telah memesan. Tim dapur kami sedang menyiapkan hidangan Anda.
              </p>
            </div>

            {/* Info cards */}
            <div className="w-full space-y-3">
              {/* Preparing card */}
              <div className="flex items-center gap-4 rounded-2xl border border-border bg-white/90 px-4 py-4 shadow-sm">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <IconChefHat />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    Masakan sedang disiapkan <AnimatedDots />
                  </p>
                  <p className="mt-0.5 text-xs text-muted leading-relaxed">
                    Chef kami akan segera mengolah semua pesanan Anda dengan penuh perhatian.
                  </p>
                </div>
              </div>

              {/* Estimate card */}
              <div className="flex items-center gap-4 rounded-2xl border border-border bg-white/90 px-4 py-4 shadow-sm">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                  <IconClock />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    Estimasi siap: <span className="text-primary">15–20 menit</span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted leading-relaxed">
                    Pesanan akan diantarkan langsung ke Meja{" "}
                    <span className="font-bold text-foreground">{tableDisplay}</span>.
                  </p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="w-full flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted">Ingin menambah pesanan?</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            {/* Order again button */}
            <div className="w-full">
              <Link
                href={`/?table=${encodeURIComponent(tableDisplay)}`}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-md hover:bg-primary/90 active:scale-[0.98] transition-all"
              >
                <IconPlus />
                Pesan Lagi
              </Link>
              <p className="mt-2.5 text-center text-xs text-muted">
                Anda akan kembali ke halaman menu dengan meja yang sama
              </p>
            </div>

          </Container>
        </main>

      </div>
    </div>
  );
}
