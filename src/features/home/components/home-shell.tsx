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
      className="h-5 w-5 text-primary"
      aria-hidden="true"
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

function IconChevronUp() {
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
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

function IconChevronDown() {
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
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// ─── Menu Card ────────────────────────────────────────────────────────────────

function MenuCard({
  item,
  cartQty,
  flashKey,
  onAdd,
  onRemove,
}: {
  item: (typeof menuItems)[number];
  cartQty: number;
  flashKey: number;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const inCart = cartQty > 0;

  return (
    <article
      className={`menu-card rounded-2xl border bg-white/90 shadow-sm transition-shadow hover:shadow-md ${inCart ? "border-primary/25 ring-1 ring-primary/10" : "border-border"
        } ${flashKey > 0 ? "card-flash" : ""}`}
    >
      <div className="flex gap-3 p-3.5">
        {/* Thumbnail */}
        <div
          className={`h-[88px] w-[72px] shrink-0 rounded-xl bg-gradient-to-br ${item.accent}`}
          aria-hidden="true"
        />

        {/* Info */}
        <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
          <div>
            <h4 className="text-sm font-semibold leading-snug text-foreground">
              {item.name}
            </h4>
            <p className="mt-1 text-xs leading-relaxed text-muted line-clamp-2">
              {item.description}
            </p>
          </div>

          {/* Price + stepper row */}
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-sm font-bold text-primary">{item.price}</span>

            {inCart ? (
              <div className="flex items-center gap-0.5 rounded-full border border-border bg-white px-1 py-1 shadow-sm">
                <button
                  type="button"
                  aria-label={`Kurangi ${item.name}`}
                  onClick={onRemove}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-base font-bold text-muted hover:bg-background hover:text-foreground transition-colors"
                >
                  −
                </button>
                <span
                  key={flashKey}
                  className="qty-pop min-w-[1.75rem] text-center text-sm font-bold text-foreground"
                >
                  {cartQty}
                </span>
                <button
                  type="button"
                  aria-label={`Tambah ${item.name}`}
                  onClick={onAdd}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-base font-bold text-white hover:bg-primary/90 active:scale-90 transition-transform"
                >
                  +
                </button>
              </div>
            ) : (
              <button
                type="button"
                aria-label={`Tambah ${item.name} ke pesanan`}
                onClick={onAdd}
                className="flex min-h-[2.25rem] items-center gap-1 rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary/90 active:scale-95 transition-transform"
              >
                <span className="text-sm leading-none">+</span>
                <span>Tambah</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function HomeShell({
  initialCart = [],
  tableCode,
}: {
  initialCart?: CartItem[];
  tableCode: string;
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>(initialCart);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [cartExpanded, setCartExpanded] = useState(false);
  // tracks add counts per item — used only as animation key, NOT as React key
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
      { threshold: 0.2, rootMargin: "-110px 0px -40% 0px" },
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
    router.push(`/checkout/review?table=${encodeURIComponent(tableCode)}` as Route);
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="bg-white sm:py-0 sm:px-6">
      <div className="mobile-app-shell mx-auto flex min-h-screen w-full max-w-[576px] flex-col bg-background sm:rounded-b-[2rem] sm:border sm:border-border sm:shadow-[0_24px_90px_rgba(20,44,30,0.14)]">

        {/* ── Sticky Header ──────────────────────────────────────────────── */}
        <header className="sticky top-0 z-30 border-b border-border/70 bg-background/96 backdrop-blur-xl">
          <Container className="py-3">

            {/* Top row: logo + app name + table badge */}
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                  <IconLogo />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold leading-tight text-foreground truncate">
                    {siteConfig.name}
                  </p>
                  <p className="text-[11px] text-muted leading-tight">Dine in · Pesan di sini</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 shadow-sm">
                <span className="text-[11px] text-muted">Meja</span>
                <span className="text-sm font-bold text-foreground">{tableCode}</span>
              </div>
            </div>

            {/* Search bar */}
            <label
              className="flex items-center gap-2.5 rounded-full border border-border bg-white px-4 py-2.5 shadow-sm focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-ring transition-all"
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
                placeholder="Cari nama menu atau kategori…"
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted/60"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-border/60 text-muted hover:bg-border hover:text-foreground transition-colors"
                  aria-label="Hapus pencarian"
                >
                  <IconX />
                </button>
              )}
            </label>

            {/* Category pill nav */}
            <div className="scroll-hint-right mt-2.5">
              <nav
                ref={pillNavRef}
                className="no-scrollbar flex gap-2 overflow-x-auto pb-0.5 pr-10"
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
                      className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${isActive
                        ? "bg-primary text-white shadow-sm"
                        : "border border-border bg-white text-muted hover:border-primary/30 hover:text-foreground"
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
        <main className="flex-1 pb-36">

          {/* Category sections */}
          {menuSections.length ? (
            <>
              {/* Item count */}
              <div className="pt-5 pb-1">
                <Container>
                  <div className="flex items-baseline justify-between gap-3">
                    <h1 className="text-lg font-bold tracking-tight text-foreground">Menu</h1>
                    <span className="text-xs text-muted">
                      {filteredMenuItems.length} item
                      {normalizedQuery ? ` untuk "${searchQuery.trim()}"` : ""}
                    </span>
                  </div>
                </Container>
              </div>

              {menuSections.map((section) => (
                <section
                  key={section.slug}
                  id={`category-${section.slug}`}
                  className="scroll-mt-[130px] pt-5"
                >
                  <Container className="space-y-3">
                    {/* Section header */}
                    <div className="flex items-baseline gap-2">
                      <h2 className="text-base font-bold text-foreground">{section.label}</h2>
                      <span className="text-xs text-muted">
                        {section.items.length} item
                      </span>
                    </div>

                    {/* Menu cards */}
                    <div className="grid gap-2.5">
                      {section.items.map((item) => {
                        const cartQty = getCartQty(item.name);
                        const flashKey = addCounts[item.name] ?? 0;

                        return (
                          <MenuCard
                            key={item.name}
                            item={item}
                            cartQty={cartQty}
                            flashKey={flashKey}
                            onAdd={() => handleAddOne(item)}
                            onRemove={() => handleRemoveOne(item.name)}
                          />
                        );
                      })}
                    </div>
                  </Container>
                </section>
              ))}

              {/* Bottom checkout cue */}
              <div className="pt-8 pb-4">
                <Container>
                  <div className="rounded-2xl border border-border/60 bg-white/60 p-4 text-center">
                    <p className="text-xs text-muted mb-3">
                      Sudah selesai memilih? Tinjau pesanan sebelum checkout.
                    </p>
                    <button
                      type="button"
                      disabled={cart.length === 0}
                      onClick={handleProceedToCheckout}
                      className="flex w-full items-center justify-center gap-1.5 rounded-full bg-primary py-3.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all shadow-sm"
                    >
                      Lanjut ke Checkout
                      <IconChevronRight />
                    </button>
                  </div>
                </Container>
              </div>
            </>
          ) : (
            <div className="pt-6">
              <Container>
                <div className="rounded-2xl border border-dashed border-border bg-white/70 p-8 text-center">
                  <p className="text-3xl mb-3" aria-hidden="true">🔍</p>
                  <h2 className="text-base font-semibold text-foreground">
                    Menu tidak ditemukan
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">
                    Coba kata kunci lain, misalnya nama menu atau kategori.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="mt-4 rounded-full bg-primary/10 px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary/15 transition-colors"
                  >
                    Lihat semua menu
                  </button>
                </div>
              </Container>
            </div>
          )}
        </main>

        {/* ── Sticky Cart Bar ──────────────────────────────────────────── */}
        <div
          id="cart-bar"
          className="sticky bottom-0 z-30 border-t border-border/50 bg-background/97 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-xl"
        >
          <Container>
            {cart.length > 0 ? (
              <div className="overflow-hidden rounded-2xl bg-[#1a2e24]">

                {/* Toggle header — always visible */}
                <button
                  type="button"
                  onClick={() => setCartExpanded((v) => !v)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-white"
                  aria-expanded={cartExpanded}
                  aria-controls="cart-detail-panel"
                >
                  {/* Cart icon + badge */}
                  <div className="relative shrink-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                      <IconCart />
                    </div>
                    <span
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-[#1a1f1c]"
                      aria-label={`${totalCartItems} item di keranjang`}
                    >
                      {totalCartItems > 9 ? "9+" : totalCartItems}
                    </span>
                  </div>

                  {/* Summary */}
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-[11px] font-medium text-white/55">
                      {totalCartItems} item · {cart.length} menu dipilih
                    </p>
                    <p className="text-sm font-bold text-white">{formatCurrency(subtotal)}</p>
                  </div>

                  {/* Expand chevron */}
                  <span className="shrink-0 text-white/60 transition-transform duration-200">
                    {cartExpanded ? <IconChevronDown /> : <IconChevronUp />}
                  </span>
                </button>

                {/* Expanded detail panel */}
                {cartExpanded && (
                  <div id="cart-detail-panel" className="border-t border-white/10 px-4 pb-4 pt-3">
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
                    <div className="mt-3.5 rounded-xl bg-white/8 px-3.5 py-3 space-y-1.5">
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
                      <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-1.5">
                        <p className="text-sm font-semibold text-white">Total</p>
                        <p className="text-sm font-bold text-accent">{formatCurrency(total)}</p>
                      </div>
                    </div>

                    {/* Checkout CTA */}
                    <button
                      type="button"
                      onClick={handleProceedToCheckout}
                      className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full bg-accent py-3 text-sm font-bold text-[#1a1f1c] hover:bg-accent/90 active:scale-[0.98] transition-all"
                    >
                      Lanjut ke Checkout
                      <IconChevronRight />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Cart empty */
              <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border/70 bg-white/50 px-4 py-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background text-muted">
                  <IconCart />
                </div>
                <p className="text-sm text-muted">
                  Belum ada pesanan. Ketuk{" "}
                  <span className="font-semibold text-foreground">Tambah</span>{" "}
                  di menu untuk mulai.
                </p>
              </div>
            )}
          </Container>
        </div>

      </div>
    </div>
  );
}
