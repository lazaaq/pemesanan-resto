"use client";

import { useEffect, useState } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/container";
import { siteConfig } from "@/config/site";
import {
  categorySections,
  menuItems,
} from "@/features/home/data";
import {
  type CartItem,
  formatCurrency,
  getOrderSummary,
  persistCart,
} from "@/features/order/lib/checkout";

export function HomeShell({ initialCart = [] }: { initialCart?: CartItem[] }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>(initialCart);
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(menuItems.map((item) => [item.name, 1])),
  );

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredMenuItems = menuItems.filter((item) => {
    if (!normalizedQuery) {
      return true;
    }

    const searchableText = `${item.name} ${item.categories.join(" ")} ${item.description}`.toLowerCase();

    return searchableText.includes(normalizedQuery);
  });

  const menuSections = categorySections
    .map((section) => ({
      ...section,
      items: filteredMenuItems.filter((item) =>
        item.categories.some((categorySlug) => categorySlug === section.slug),
      ),
    }))
    .filter((section) => section.items.length > 0);

  const { serviceFee, subtotal, total, totalItems: totalCartItems } = getOrderSummary(cart);

  useEffect(() => {
    persistCart(cart);
  }, [cart]);

  function changeSelectedQuantity(itemName: string, nextValue: number) {
    setSelectedQuantities((current) => ({
      ...current,
      [itemName]: Math.max(1, nextValue),
    }));
  }

  function handleAddToCart(item: (typeof menuItems)[number]) {
    const quantityToAdd = selectedQuantities[item.name] ?? 1;

    setCart((current) => {
      const existingItem = current.find((cartItem) => cartItem.name === item.name);

      if (existingItem) {
        return current.map((cartItem) =>
          cartItem.name === item.name
            ? { ...cartItem, quantity: cartItem.quantity + quantityToAdd }
            : cartItem,
        );
      }

      return [
        ...current,
        {
          name: item.name,
          quantity: quantityToAdd,
          unitPrice: item.priceValue,
        },
      ];
    });

    changeSelectedQuantity(item.name, 1);
  }

  function handleProceedToCheckout() {
    if (!cart.length) {
      return;
    }

    router.push("/checkout/review" as Route);
  }

  return (
    <div className="bg-white py-0 sm:px-6">
      <div className="mobile-app-shell mx-auto flex min-h-screen w-full max-w-[576px] flex-col overflow-hidden bg-background sm:rounded-b-[2rem] sm:border sm:border-border sm:shadow-[0_24px_90px_rgba(80,44,16,0.14)]">
        <header className="sticky top-0 z-30 border-b border-border/80 bg-background/92 backdrop-blur-xl">
          <Container className="py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="font-mono text-xs uppercase tracking-[0.32em] text-primary">
                  online ordering
                </p>
                <div>
                  <h1 className="text-2xl font-semibold text-foreground">
                    {siteConfig.name}
                  </h1>
                  <p className="mt-1 text-sm text-muted">
                    Order makanan favoritmu, atur jumlah, lalu checkout.
                  </p>
                </div>
              </div>
              <div className="rounded-2xl bg-white/80 px-3 py-2 text-right shadow-sm">
                <p className="text-xs text-muted">Meja</p>
                <p className="text-sm font-semibold text-foreground">{siteConfig.defaultTableCode}</p>
              </div>
            </div>

            <div className="mt-5 rounded-[1.75rem] bg-white/78 p-4 shadow-sm ring-1 ring-black/4">
              <label
                className="flex items-center gap-3 rounded-2xl border border-border bg-[#fff8ef] px-4 py-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring"
                htmlFor="menu-search"
              >
                <span className="text-sm font-medium text-muted">Cari</span>
                <input
                  id="menu-search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Cari ayam bakar, minuman segar, atau dessert"
                  className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-semibold text-primary"
                  >
                    Reset
                  </button>
                ) : null}
              </label>
            </div>
          </Container>
        </header>

        <main className="flex-1 pb-36">
          <section className="pt-5">
            <Container className="space-y-5">
              <nav className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
                {menuSections.map((section, index) => (
                  <a
                    key={section.slug}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${
                      index === 0
                        ? "bg-primary text-white"
                        : "border border-border bg-white/80 text-foreground"
                    }`}
                    href={`#category-${section.slug}`}
                  >
                    {section.label}
                  </a>
                ))}
              </nav>
            </Container>
          </section>

          <section id="menu" className="pt-6">
            <Container className="space-y-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">
                  menu pilihan
                </p>
                <h3 className="mt-1 text-xl font-semibold text-foreground">
                  Pilih makanan yang ingin di-order
                </h3>
                <p className="mt-2 text-sm leading-7 text-muted">
                  Setiap item bisa ditambah ke cart lalu direview sebelum checkout.
                </p>
                <p className="mt-3 text-sm text-muted">
                  {filteredMenuItems.length} menu ditemukan
                  {normalizedQuery ? ` untuk "${searchQuery.trim()}"` : ""}
                </p>
              </div>
            </Container>
          </section>

          {menuSections.length ? (
            menuSections.map((section) => (
              <section
                key={section.slug}
                id={`category-${section.slug}`}
                className="scroll-mt-36 pt-6"
              >
                <Container className="space-y-4">
                  <div className="space-y-2">
                    <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">
                      {section.label}
                    </p>
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-semibold text-foreground">
                          {section.label}
                        </h3>
                        <p className="mt-1 text-sm leading-7 text-muted">
                          {section.description}
                        </p>
                      </div>
                      <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-secondary">
                        {section.items.length} menu
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    {section.items.map((item) => (
                      <article
                        key={`${section.slug}-${item.name}`}
                        className="rounded-[1.8rem] border border-border bg-white/85 p-4 shadow-sm"
                      >
                        <div className="flex gap-4">
                          <div
                            className={`h-28 w-24 shrink-0 rounded-[1.4rem] bg-gradient-to-br ${item.accent}`}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-xs uppercase tracking-[0.18em] text-secondary">
                                  {section.label}
                                </p>
                                <h4 className="mt-1 text-lg font-semibold text-foreground">
                                  {item.name}
                                </h4>
                              </div>
                              <span className="rounded-full bg-[#eef5f3] px-3 py-1 text-xs font-semibold text-secondary">
                                {item.price}
                              </span>
                            </div>
                            <p className="mt-3 text-sm leading-7 text-muted">{item.description}</p>
                            <div className="mt-4 flex items-center justify-between">
                              <div className="flex items-center gap-2 rounded-full border border-border px-3 py-2">
                                <button
                                  className="text-sm font-semibold text-muted"
                                  type="button"
                                  onClick={() =>
                                    changeSelectedQuantity(
                                      item.name,
                                      (selectedQuantities[item.name] ?? 1) - 1,
                                    )
                                  }
                                >
                                  -
                                </button>
                                <span className="min-w-5 text-center text-sm font-semibold text-foreground">
                                  {selectedQuantities[item.name] ?? 1}
                                </span>
                                <button
                                  className="text-sm font-semibold text-primary"
                                  type="button"
                                  onClick={() =>
                                    changeSelectedQuantity(
                                      item.name,
                                      (selectedQuantities[item.name] ?? 1) + 1,
                                    )
                                  }
                                >
                                  +
                                </button>
                              </div>
                              <button
                                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
                                type="button"
                                onClick={() => handleAddToCart(item)}
                              >
                                Tambah
                              </button>
                            </div>
                            {cart.some((cartItem) => cartItem.name === item.name) ? (
                              <p className="mt-3 text-xs font-medium text-secondary">
                                Sudah ada {cart.find((cartItem) => cartItem.name === item.name)?.quantity}{" "}
                                item di cart
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </Container>
              </section>
            ))
          ) : (
            <section className="pt-6">
              <Container>
                <div className="rounded-[1.8rem] border border-dashed border-border bg-white/70 p-6 text-center">
                  <h4 className="text-lg font-semibold text-foreground">Menu tidak ditemukan</h4>
                  <p className="mt-2 text-sm leading-7 text-muted">
                    Coba kata kunci lain, misalnya nama menu, kategori, atau jenis minuman.
                  </p>
                </div>
              </Container>
            </section>
          )}

        </main>

        <div
          id="checkout"
          className="sticky bottom-0 z-30 border-t border-border/80 bg-background/95 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur-xl"
        >
          <Container>
            <div className="rounded-[2rem] bg-[#1f1a17] p-4 text-white shadow-[0_18px_42px_rgba(31,26,23,0.22)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/56">
                    cart summary
                  </p>
                  <h3 className="mt-2 text-lg font-semibold">Pesanan aktif</h3>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/88">
                  {totalCartItems} item
                </span>
              </div>

              {cart.length ? (
                <div className="mt-4 space-y-3">
                  {cart.map((item) => (
                    <div key={item.name} className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-white">{item.name}</p>
                        <p className="text-xs text-white/56">{item.quantity}x pesanan</p>
                      </div>
                      <p className="text-sm font-semibold text-white">
                        {formatCurrency(item.unitPrice * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-[1.4rem] bg-white/7 p-4 text-sm leading-7 text-white/64">
                  Cart masih kosong. Tambahkan makanan atau minuman dari daftar menu di atas.
                </div>
              )}

              <div className="mt-5 space-y-2 rounded-[1.4rem] bg-white/7 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white/64">Subtotal</p>
                  <p className="text-sm font-semibold text-white">{formatCurrency(subtotal)}</p>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white/64">Biaya layanan</p>
                  <p className="text-sm font-semibold text-white">{formatCurrency(serviceFee)}</p>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white/64">Total</p>
                  <p className="text-sm font-semibold text-white">{formatCurrency(total)}</p>
                </div>
              </div>

              <button
                className="mt-5 flex w-full items-center justify-center rounded-full bg-accent px-5 py-3.5 text-sm font-semibold text-[#3d250f] disabled:cursor-not-allowed disabled:opacity-50"
                type="button"
                disabled={!cart.length}
                onClick={handleProceedToCheckout}
              >
                Lanjut ke Checkout
              </button>
            </div>
          </Container>
        </div>
      </div>
    </div>
  );
}
