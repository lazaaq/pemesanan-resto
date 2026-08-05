"use client";

import { useEffect, useRef, useState } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/container";
import { siteConfig } from "@/config/site";
import { categorySections, menuItems } from "@/features/home/data";
import {
  type CartItem,
  formatCurrency,
  getOrderSummary,
  persistCart,
} from "@/features/order/lib/checkout";

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconSearch() {
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
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconX() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconCart() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

function IconLogo() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-7 w-7 text-primary"
    >
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
      <line x1="6" y1="1" x2="6" y2="4" />
      <line x1="10" y1="1" x2="10" y2="4" />
      <line x1="14" y1="1" x2="14" y2="4" />
    </svg>
  );
}

function IconChevronRight() {
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
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function HomeShell({ initialCart = [] }: { initialCart?: CartItem[] }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>(initialCart);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [cartExpanded, setCartExpanded] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  // tracks how many times each item has been added — used as a re-mount key
  const [addCounts, setAddCounts] = useState<Record<string, number>>({});
  const pillNavRef = useRef<HTMLDivElement>(null);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredMenuItems = menuItems.filter((item) => {
    if (!normalizedQuery) return true;
    const searchableText =
      `${item.name} ${item.categories.join(" ")} ${item.description}`.toLowerCase();
    return searchableText.includes(normalizedQuery);
  });

  const menuSections = categorySections
    .map((section) => ({
      ...section,
      items: filteredMenuItems.filter((item) =>
        item.categories.some((cat) => cat === section.slug),
      ),
    }))
    .filter((section) => section.items.length > 0);

  const { subtotal, serviceFee, tax, total, totalItems: totalCartItems } = getOrderSummary(cart);

  useEffect(() => {
    persistCart(cart);
  }, [cart]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Initialise active category when sections first become available
  const firstSectionSlug = menuSections[0]?.slug ?? "";
  if (!activeCategory && firstSectionSlug) {
    setActiveCategory(firstSectionSlug);
  }

  useEffect(() => {
    const sections = menuSections.map((s) =>
      document.getElementById(`category-${s.slug}`),
    );

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible?.target.id) {
          const slug = visible.target.id.replace("category-", "");
          setActiveCategory(slug);
          // scroll pill into view
          const pill = pillNavRef.current?.querySelector<HTMLElement>(
            `[data-slug="${slug}"]`,
          );
          pill?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        }
      },
      { threshold: 0.25, rootMargin: "-120px 0px -40% 0px" },
    );

    sections.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [menuSections.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cart helpers ────────────────────────────────────────────────────────────

  function getCartQty(itemName: string) {
    return cart.find((c) => c.name === itemName)?.quantity ?? 0;
  }

  function handleAddOne(item: (typeof menuItems)[number]) {
    setCart((current) => {
      const existing = current.find((c) => c.name === item.name);
      if (existing) {
        return current.map((c) =>
          c.name === item.name ? { ...c, quantity: c.quantity + 1 } : c,
        );
      }
      return [...current, { name: item.name, quantity: 1, unitPrice: item.priceValue }];
    });
    // increment add-count to trigger qty-pop re-mount animation
    setAddCounts((prev) => ({ ...prev, [item.name]: (prev[item.name] ?? 0) + 1 }));
  }

  function handleRemoveOne(itemName: string) {
    setCart((current) => {
      const existing = current.find((c) => c.name === itemName);
      if (!existing) return current;
      if (existing.quantity === 1) return current.filter((c) => c.name !== itemName);
      return current.map((c) =>
        c.name === itemName ? { ...c, quantity: c.quantity - 1 } : c,
      );
    });
  }

  function handleProceedToCheckout() {
    if (!cart.length) return;
    router.push("/checkout/review" as Route);
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="bg-white py-0 sm:px-6">
      <div className="mobile-app-shell mx-auto flex min-h-screen w-full max-w-[576px] flex-col bg-background sm:rounded-b-[2rem] sm:border sm:border-border sm:shadow-[0_24px_90px_rgba(20,44,30,0.14)]">

        {/* ── Sticky Header ──────────────────────────────────────────────── */}
        <header className="sticky top-0 z-30 border-b border-border/70 bg-background/94 backdrop-blur-xl">
          <Container className={`transition-all duration-300 ease-in-out ${isScrolled ? "py-2" : "py-3.5"}`}>

            {/* Collapsible Top row — CSS grid 0fr/1fr trick for silky-smooth animation */}
            <div
              className={`grid transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                isScrolled
                  ? "grid-rows-[0fr] opacity-0 pointer-events-none mb-0"
                  : "grid-rows-[1fr] opacity-100 mb-3"
              }`}
            >
              <div className="min-h-0 overflow-hidden">
                <div className="flex items-start justify-between gap-4 pb-1">
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <IconLogo />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-foreground">
                      {siteConfig.name}
                    </h1>
                    <p className="max-w-[340px] text-xs leading-relaxed text-muted">
                      Aplikasi pemesanan menu makanan dan minuman favorit Anda secara langsung di cafe atau restoran ini.
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-white/70 px-3 py-1.5 shadow-sm">
                    <span className="text-xs text-muted">Meja</span>
                    <span className="text-xs font-semibold text-foreground">
                      {siteConfig.defaultTableCode}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Search bar — compact single row */}
            <label
              className={`flex items-center gap-2.5 rounded-full border border-border bg-white/70 px-4 py-2.5 shadow-sm focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-ring transition-all duration-300 ${
                isScrolled ? "mt-0" : "mt-1"
              }`}
              htmlFor="menu-search"
            >
              <span className="shrink-0 text-muted">
                <IconSearch />
              </span>
              <input
                id="menu-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari menu, kategori, atau minuman…"
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted/70"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="shrink-0 rounded-full p-0.5 text-muted hover:text-foreground"
                  aria-label="Hapus pencarian"
                >
                  <IconX />
                </button>
              )}
            </label>

            {/* Category pill nav with scroll hint */}
            <div className={`scroll-hint-right transition-all duration-300 ${isScrolled ? "mt-2" : "mt-3"}`}>
              <nav
                ref={pillNavRef}
                className="no-scrollbar flex gap-2 overflow-x-auto pr-10 pb-0.5"
                aria-label="Navigasi kategori"
              >
                {menuSections.map((section) => {
                  const isActive = activeCategory === section.slug;
                  return (
                    <a
                      key={section.slug}
                      data-slug={section.slug}
                      href={`#category-${section.slug}`}
                      onClick={() => setActiveCategory(section.slug)}
                      className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                        isActive
                          ? "bg-primary text-white shadow-sm"
                          : "border border-border bg-white/70 text-foreground hover:border-primary/40 hover:bg-white"
                      }`}
                    >
                      {section.label}
                    </a>
                  );
                })}
              </nav>
            </div>

          </Container>
        </header>

        {/* ── Main content ───────────────────────────────────────────────── */}
        <main className="flex-1 pb-32">

          {/* Menu subtitle */}
          <section className="pt-6">
            <Container>
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Menu</h2>
                <span className="text-xs text-muted">
                  {filteredMenuItems.length} item
                  {normalizedQuery ? ` untuk "${searchQuery.trim()}"` : ""}
                </span>
              </div>
            </Container>
          </section>

          {/* Category sections */}
          {menuSections.length ? (
            menuSections.map((section) => (
              <section
                key={section.slug}
                id={`category-${section.slug}`}
                className="scroll-mt-[148px] pt-5"
              >
                <Container className="space-y-3">
                  {/* Section header */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {section.label}
                    </h3>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted">
                      {section.description}
                    </p>
                  </div>

                  {/* Menu cards */}
                  <div className="grid gap-3">
                    {section.items.map((item) => {
                      const cartQty = getCartQty(item.name);
                      const inCart = cartQty > 0;

                      return (
                        <article
                          key={`${section.slug}-${item.name}-${addCounts[item.name] ?? 0}`}
                          className={`rounded-[1.6rem] border bg-white/85 p-4 shadow-sm transition-all hover:shadow-md ${
                            inCart
                              ? "border-primary/30 ring-1 ring-primary/10"
                              : "border-border"
                          } ${
                            (addCounts[item.name] ?? 0) > 0 ? "card-flash" : ""
                          }`}
                        >
                          <div className="flex gap-3.5">
                            {/* Item gradient thumbnail */}
                            <div
                              className={`h-24 w-20 shrink-0 rounded-[1.2rem] bg-gradient-to-br ${item.accent}`}
                            />

                            {/* Item info */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-base font-semibold leading-snug text-foreground">
                                  {item.name}
                                </h4>
                                <span className="shrink-0 rounded-full bg-primary/8 px-2.5 py-1 text-xs font-semibold text-primary">
                                  {item.price}
                                </span>
                              </div>
                              <p className="mt-1.5 text-xs leading-relaxed text-muted line-clamp-2">
                                {item.description}
                              </p>

                              {/* Add / stepper control */}
                              <div className="mt-3 flex items-center justify-end">
                                {inCart ? (
                                  /* Inline stepper */
                                  <div className="flex items-center gap-0.5 rounded-full border border-border bg-white/90 px-1 py-1 shadow-sm">
                                    <button
                                      type="button"
                                      aria-label={`Kurangi ${item.name}`}
                                      onClick={() => handleRemoveOne(item.name)}
                                      className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-muted hover:bg-background hover:text-foreground"
                                    >
                                      −
                                    </button>
                                    {/* Re-keying on addCounts triggers qty-pop animation */}
                                    <span
                                      key={addCounts[item.name] ?? 0}
                                      className="qty-pop min-w-6 text-center text-sm font-semibold text-foreground"
                                    >
                                      {cartQty}
                                    </span>
                                    <button
                                      type="button"
                                      aria-label={`Tambah ${item.name}`}
                                      onClick={() => handleAddOne(item)}
                                      className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-bold text-white hover:bg-primary/90 active:scale-90 transition-transform"
                                    >
                                      +
                                    </button>
                                  </div>
                                ) : (
                                  /* Single-tap add button with "Tambah" label */
                                  <button
                                    type="button"
                                    aria-label={`Tambah ${item.name} ke pesanan`}
                                    onClick={() => handleAddOne(item)}
                                    className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 active:scale-95 transition-transform"
                                  >
                                    <span className="text-base leading-none">+</span>
                                    <span>Tambah</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </Container>
              </section>
            ))
          ) : (
            <section className="pt-6">
              <Container>
                <div className="rounded-[1.6rem] border border-dashed border-border bg-white/60 p-8 text-center">
                  <p className="text-2xl">🔍</p>
                  <h4 className="mt-3 text-base font-semibold text-foreground">
                    Menu tidak ditemukan
                  </h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">
                    Coba kata kunci lain, misalnya nama menu, kategori, atau jenis minuman.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="mt-4 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/15"
                  >
                    Lihat semua menu
                  </button>
                </div>
              </Container>
            </section>
          )}
          {/* Separation and Bottom Checkout Button */}
          <div className="mt-8 border-t border-border/80 pt-8 pb-4">
            <Container>
              <div className="rounded-[1.6rem] bg-white/40 p-5 text-center border border-border/50 shadow-sm backdrop-blur-sm">
                <p className="text-xs text-muted mb-3.5">
                  Sudah selesai memilih? Tinjau kembali pesanan Anda sebelum melakukan checkout.
                </p>
                <button
                  type="button"
                  disabled={cart.length === 0}
                  onClick={handleProceedToCheckout}
                  className="flex w-full items-center justify-center gap-1.5 rounded-full bg-primary py-3.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all shadow-md"
                >
                  Lanjut ke Checkout
                  <IconChevronRight />
                </button>
              </div>
            </Container>
          </div>
        </main>

        {/* ── Floating Order Summary ──────────────────────────────────────── */}
        <div
          id="cart-bar"
          className="sticky bottom-0 z-30 border-t border-border/60 bg-background/96 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl"
        >
          <Container>
            {cart.length > 0 ? (
              <div className="overflow-hidden rounded-[1.6rem] bg-[#1a2e24] shadow-[0_8px_40px_rgba(20,44,30,0.30)]">

                {/* Toggle header — always visible */}
                <button
                  type="button"
                  onClick={() => setCartExpanded((v) => !v)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-white"
                >
                  {/* Cart icon + badge */}
                  <div className="relative shrink-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                      <IconCart />
                    </div>
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-[#1a1f1c]">
                      {totalCartItems > 9 ? "9+" : totalCartItems}
                    </span>
                  </div>

                  {/* Summary */}
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-[11px] font-medium text-white/55">
                      {totalCartItems} item · ketuk untuk lihat detail
                    </p>
                    <p className="text-sm font-semibold text-white">{formatCurrency(subtotal)}</p>
                  </div>

                  {/* Expand chevron */}
                  <span
                    className={`shrink-0 text-white/60 transition-transform duration-200 ${
                      cartExpanded ? "rotate-90" : "-rotate-90"
                    }`}
                  >
                    <IconChevronRight />
                  </span>
                </button>

                {/* Expanded detail panel */}
                {cartExpanded && (
                  <div className="border-t border-white/10 px-4 pb-4 pt-3">
                    {/* Item list */}
                    <div className="space-y-2.5">
                      {cart.map((item) => (
                        <div key={item.name} className="flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-white">{item.name}</p>
                            <p className="text-[11px] text-white/50">{item.quantity}× pesanan</p>
                          </div>
                          <p className="shrink-0 text-sm font-semibold text-white">
                            {formatCurrency(item.unitPrice * item.quantity)}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Price breakdown */}
                    <div className="mt-4 space-y-1.5 rounded-[1rem] bg-white/7 px-3.5 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-white/55">Subtotal</p>
                        <p className="text-xs font-semibold text-white">{formatCurrency(subtotal)}</p>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-white/55">Biaya layanan</p>
                        <p className="text-xs font-semibold text-white">{formatCurrency(serviceFee)}</p>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-white/55">Pajak (11%)</p>
                        <p className="text-xs font-semibold text-white">{formatCurrency(tax)}</p>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-3 border-t border-white/10 pt-2">
                        <p className="text-sm font-semibold text-white">Total</p>
                        <p className="text-sm font-bold text-accent">{formatCurrency(total)}</p>
                      </div>
                    </div>

                    {/* Checkout CTA */}
                    <button
                      type="button"
                      onClick={handleProceedToCheckout}
                      className="mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-full bg-accent py-3 text-sm font-semibold text-[#1a1f1c] hover:bg-accent/90 active:scale-[0.98]"
                    >
                      Lanjut ke Checkout
                      <IconChevronRight />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Cart empty: minimal prompt */
              <div className="flex items-center gap-3 rounded-[1.4rem] border border-dashed border-border/80 bg-white/50 px-4 py-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background text-muted">
                  <IconCart />
                </div>
                <p className="text-sm text-muted">
                  Belum ada pesanan. Ketuk{" "}
                  <span className="font-semibold text-foreground">Tambah</span> di menu untuk mulai.
                </p>
              </div>
            )}
          </Container>
        </div>

      </div>
    </div>
  );
}
