"use client";

import { type MouseEvent, useEffect, useRef, useState } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/container";
import { siteConfig } from "@/config/site";
import {
  type CartItem,
  formatCurrency,
  getOrderSummary,
  persistCart,
  persistTableCode,
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

// ─── Types ───────────────────────────────────────────────────────────────────

export type MenuItemData = {
  id?: string;
  name: string;
  slug?: string;
  description: string | null;
  price: number | string;
  priceValue?: number;
  image_url?: string | null;
  accent?: string;
  sort_order?: number;
  is_available?: boolean;
  is_featured?: boolean;
  categories: string[];
};

export type CategorySection = {
  label: string;
  slug: string;
  description?: string;
};

export type HomeShellProps = {
  initialCart?: CartItem[];
  menuItems: MenuItemData[];
  categorySections: CategorySection[];
  tableCode: string;
};

// ─── Menu Card ────────────────────────────────────────────────────────────────

function MenuCard({
  item,
  cartQty,
  flashKey,
  onAdd,
  onRemove,
}: {
  item: MenuItemData;
  cartQty: number;
  flashKey: number;
  onAdd: (thumbnail: HTMLElement | null) => void;
  onRemove: () => void;
}) {
  const inCart = cartQty > 0;
  const isAvailable = item.is_available !== false;
  const cardRef = useRef<HTMLElement>(null);
  const displayPrice = typeof item.price === "string" ? item.price : formatCurrency(item.price);

  return (
    <article
      ref={cardRef}
      className={`menu-card rounded-2xl border bg-white/90 p-3.5 shadow-sm transition-all hover:shadow-md ${
        inCart ? "border-primary/25 ring-1 ring-primary/10" : "border-border"
      } ${!isAvailable ? "opacity-60 grayscale" : ""} ${flashKey > 0 ? "card-flash" : ""}`}
    >
      <div className="flex gap-3 items-start">
        {/* Thumbnail: image from DB or fallback gradient */}
        <div
          data-menu-thumbnail
          className={`h-[88px] w-[76px] shrink-0 overflow-hidden rounded-xl bg-gradient-to-br ${
            item.accent ?? "from-primary/20 to-accent/20"
          } flex items-center justify-center`}
        >
          {item.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.image_url}
              alt={item.name}
              width={76}
              height={88}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-2xl font-bold text-primary/40">
              {item.name.charAt(0)}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-semibold leading-snug text-foreground">
                {item.name}
              </h4>
              {!isAvailable && (
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-muted">
                  Habis
                </span>
              )}
            </div>
            {item.description && (
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
                {item.description}
              </p>
            )}
          </div>

          {/* Price + stepper row */}
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-sm font-bold text-primary">{displayPrice}</span>

            {isAvailable ? (
              inCart ? (
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
                    onClick={() => {
                      const thumbnail =
                        cardRef.current?.querySelector<HTMLImageElement>("img") ??
                        cardRef.current?.querySelector<HTMLElement>("[data-menu-thumbnail]") ??
                        null;
                      onAdd(thumbnail);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-base font-bold text-white hover:bg-primary/90 active:scale-90 transition-transform"
                  >
                    +
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  aria-label={`Tambah ${item.name} ke pesanan`}
                  onClick={() => {
                    const thumbnail =
                      cardRef.current?.querySelector<HTMLImageElement>("img") ??
                      cardRef.current?.querySelector<HTMLElement>("[data-menu-thumbnail]") ??
                      null;
                    onAdd(thumbnail);
                  }}
                  className="flex min-h-[2.25rem] items-center gap-1 rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary/90 active:scale-95 transition-transform"
                >
                  <span className="text-sm leading-none">+</span>
                  <span>Tambah</span>
                </button>
              )
            ) : (
              <span className="text-xs text-muted">Tidak tersedia</span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function HomeShell({
  initialCart = [],
  menuItems,
  categorySections,
  tableCode,
}: HomeShellProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>(initialCart);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [cartExpanded, setCartExpanded] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [addCounts, setAddCounts] = useState<Record<string, number>>({});

  const pillNavRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const categoryScrollTimeoutRef = useRef<number | undefined>(undefined);
  const headerTransitionTimeoutRef = useRef<number | undefined>(undefined);
  const headerIsTransitioningRef = useRef(false);
  const isScrolledRef = useRef(false);

  // Fly-to-cart animation using standard Web Animations API
  function flyToCart(img: HTMLElement | null) {
    const cartIcon = document.getElementById("cart-icon") || document.getElementById("cart-bar");
    if (!img || !cartIcon) return;

    try {
      const imgRect = img.getBoundingClientRect();
      const cartRect = cartIcon.getBoundingClientRect();

      const wrapper = document.createElement("div");
      wrapper.style.position = "fixed";
      wrapper.style.left = `${imgRect.left}px`;
      wrapper.style.top = `${imgRect.top}px`;
      wrapper.style.width = `${imgRect.width}px`;
      wrapper.style.height = `${imgRect.height}px`;
      wrapper.style.borderRadius = "1rem";
      wrapper.style.overflow = "hidden";
      wrapper.style.zIndex = "999";
      wrapper.style.pointerEvents = "none";
      wrapper.style.margin = "0";
      wrapper.style.opacity = "1";
      wrapper.style.transformOrigin = "center center";

      const clone = img.cloneNode(true) as HTMLElement;
      clone.style.width = "100%";
      clone.style.height = "100%";
      clone.style.objectFit = "cover";
      clone.style.display = "block";
      clone.style.margin = "0";

      wrapper.appendChild(clone);
      document.body.appendChild(wrapper);

      const deltaX = cartRect.left + cartRect.width / 2 - imgRect.left - imgRect.width / 2;
      const deltaY = cartRect.top + cartRect.height / 2 - imgRect.top - imgRect.height / 2;
      const endScale = 18 / Math.max(imgRect.width, imgRect.height);

      const animation = wrapper.animate(
        [
          {
            transform: "translate3d(0, 0, 0) scale(1)",
            borderRadius: "1rem",
            opacity: 1,
          },
          {
            transform: "translate3d(0, 0, 0) scale(1.08)",
            borderRadius: "1.1rem",
            opacity: 1,
            offset: 0.2,
          },
          {
            transform: `translate3d(${deltaX}px, ${deltaY}px, 0) scale(${endScale})`,
            borderRadius: "50%",
            opacity: 0,
            offset: 1,
          },
        ],
        {
          duration: 550,
          easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
          fill: "forwards",
        },
      );

      animation.onfinish = () => {
        wrapper.remove();
      };
    } catch {
      // Graceful fallback if DOM is detached
    }
  }

  // Filter menu items by search query
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredMenuItems = menuItems.filter((item) => {
    if (!normalizedQuery) return true;
    const searchableText = `${item.name} ${item.categories.join(" ")} ${item.description ?? ""}`.toLowerCase();
    return searchableText.includes(normalizedQuery);
  });

  // Group into categories, placing unavailable items at the bottom
  const menuSections = categorySections
    .map((section) => ({
      ...section,
      items: filteredMenuItems
        .filter((item) => item.categories.some((cat) => cat === section.slug))
        .sort((a, b) => Number(b.is_available !== false) - Number(a.is_available !== false)),
    }))
    .filter((section) => section.items.length > 0);

  const { subtotal, serviceFee, tax, total, totalItems: totalCartItems } = getOrderSummary(cart);

  // Persist cart to cookie
  useEffect(() => {
    persistCart(cart);
  }, [cart]);

  // Persist table code to cookie
  useEffect(() => {
    if (tableCode) {
      persistTableCode(tableCode);
    }
  }, [tableCode]);

  // Hysteresis scroll collapse
  const SCROLL_COLLAPSE = 70;
  const SCROLL_EXPAND = 45;
  const HEADER_COLLAPSE_DURATION = 400;
  const CATEGORY_SCROLL_GAP = 16;

  function markHeaderTransitioning() {
    window.clearTimeout(headerTransitionTimeoutRef.current);
    headerIsTransitioningRef.current = true;
    headerTransitionTimeoutRef.current = window.setTimeout(() => {
      headerIsTransitioningRef.current = false;
    }, HEADER_COLLAPSE_DURATION);
  }

  useEffect(() => {
    let rafId: number;
    const handleScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const y = window.scrollY;
        const nowCollapsed = isScrolledRef.current;
        let next = nowCollapsed;

        if (nowCollapsed) {
          next = y > SCROLL_EXPAND;
        } else {
          next = y > SCROLL_COLLAPSE;
        }

        if (next !== nowCollapsed) {
          isScrolledRef.current = next;
          markHeaderTransitioning();
          setIsScrolled(next);
        }
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    return () => {
      window.clearTimeout(categoryScrollTimeoutRef.current);
      window.clearTimeout(headerTransitionTimeoutRef.current);
    };
  }, []);

  // Initialise active category when sections first load
  const firstSectionSlug = menuSections[0]?.slug ?? "";
  if (!activeCategory && firstSectionSlug) {
    setActiveCategory(firstSectionSlug);
  }

  // Active category intersection observer
  useEffect(() => {
    const sections = menuSections.map((s) => document.getElementById(`category-${s.slug}`));

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible?.target.id) {
          const slug = visible.target.id.replace("category-", "");
          setActiveCategory(slug);
          const pill = pillNavRef.current?.querySelector<HTMLElement>(`[data-slug="${slug}"]`);
          pill?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        }
      },
      { threshold: 0.25, rootMargin: "-120px 0px -40% 0px" },
    );

    sections.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [menuSections.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cart Handlers ──────────────────────────────────────────────────────────

  function getCartQty(itemName: string) {
    return cart.find((c) => c.name === itemName)?.quantity ?? 0;
  }

  function handleAddOne(item: MenuItemData, thumbnail: HTMLElement | null) {
    const unitPrice = typeof item.price === "number" ? item.price : item.priceValue ?? 0;

    setCart((current) => {
      const existing = current.find((c) => c.name === item.name);
      if (existing) {
        return current.map((c) =>
          c.name === item.name ? { ...c, quantity: c.quantity + 1 } : c,
        );
      }
      return [...current, { name: item.name, quantity: 1, unitPrice }];
    });

    setAddCounts((prev) => ({ ...prev, [item.name]: (prev[item.name] ?? 0) + 1 }));
    flyToCart(thumbnail);
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

  function handleCategoryNavigation(event: MouseEvent<HTMLAnchorElement>, slug: string) {
    event.preventDefault();
    setActiveCategory(slug);

    const target = document.getElementById(`category-${slug}`);
    if (!target) return;

    const scrollToCategory = () => {
      const headerHeight = headerRef.current?.getBoundingClientRect().height ?? 0;
      const targetTop = window.scrollY + target.getBoundingClientRect().top;
      window.scrollTo({
        top: Math.max(0, targetTop - headerHeight - CATEGORY_SCROLL_GAP),
        behavior: "smooth",
      });
    };

    window.clearTimeout(categoryScrollTimeoutRef.current);
    const targetIsBelowHeader =
      target.getBoundingClientRect().top > (headerRef.current?.getBoundingClientRect().height ?? 0);

    if (!isScrolledRef.current && targetIsBelowHeader) {
      isScrolledRef.current = true;
      markHeaderTransitioning();
      setIsScrolled(true);
    }

    if (headerIsTransitioningRef.current) {
      categoryScrollTimeoutRef.current = window.setTimeout(scrollToCategory, HEADER_COLLAPSE_DURATION);
      return;
    }

    scrollToCategory();
  }

  return (
    <div className="bg-white sm:py-0 sm:px-6">
      <div className="mobile-app-shell mx-auto flex min-h-screen w-full max-w-[576px] flex-col bg-background sm:rounded-b-[2rem] sm:border sm:border-border sm:shadow-[0_24px_90px_rgba(20,44,30,0.14)]">

        {/* ── Sticky Header ──────────────────────────────────────────────── */}
        <header
          ref={headerRef}
          className="sticky top-0 z-30 border-b border-border/70 bg-background/96 backdrop-blur-xl"
        >
          <Container className={`transition-all duration-300 ${isScrolled ? "py-2" : "py-3"}`}>
            {/* Top row: logo + app name + table badge */}
            <div
              className={`flex items-center justify-between gap-3 transition-all duration-300 ${
                isScrolled ? "mb-1.5 opacity-90 scale-[0.98] origin-top" : "mb-3"
              }`}
            >
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
                      onClick={(event) => handleCategoryNavigation(event, section.slug)}
                      className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                        isActive
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
          {menuSections.length ? (
            <>
              {/* Item count header */}
              <div className="pt-5 pb-1">
                <Container>
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 className="text-lg font-bold tracking-tight text-foreground">Menu</h2>
                    <span className="text-xs text-muted">
                      {filteredMenuItems.length} pilihan
                      {normalizedQuery ? ` untuk "${searchQuery.trim()}"` : ""}
                    </span>
                  </div>
                </Container>
              </div>

              {/* Category sections */}
              <div className="space-y-6 pt-3">
                {menuSections.map((section) => (
                  <section
                    key={section.slug}
                    id={`category-${section.slug}`}
                    className="scroll-mt-36"
                  >
                    <Container>
                      <div className="mb-3">
                        <h3 className="text-sm font-bold tracking-tight text-foreground">
                          {section.label}
                        </h3>
                        {section.description && (
                          <p className="mt-0.5 text-xs text-muted">{section.description}</p>
                        )}
                      </div>

                      <div className="space-y-3">
                        {section.items.map((item) => (
                          <MenuCard
                            key={item.id ?? `${section.slug}-${item.name}`}
                            item={item}
                            cartQty={getCartQty(item.name)}
                            flashKey={addCounts[item.name] ?? 0}
                            onAdd={(thumb) => handleAddOne(item, thumb)}
                            onRemove={() => handleRemoveOne(item.name)}
                          />
                        ))}
                      </div>
                    </Container>
                  </section>
                ))}
              </div>
            </>
          ) : (
            <div className="pt-10">
              <Container>
                <div className="rounded-2xl border border-dashed border-border bg-white/70 p-8 text-center">
                  <p className="text-3xl mb-3" aria-hidden="true">
                    🔍
                  </p>
                  <h2 className="text-base font-semibold text-foreground">Menu tidak ditemukan</h2>
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
                  <div id="cart-icon" className="relative shrink-0">
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
                        <p className="text-xs font-semibold text-white">
                          {formatCurrency(subtotal)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-white/55">Biaya layanan</p>
                        <p className="text-xs font-semibold text-white">
                          {formatCurrency(serviceFee)}
                        </p>
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
                      className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full bg-accent py-3 text-sm font-bold text-[#1a1f1c] hover:bg-accent/90 active:scale-[0.98] transition-all cursor-pointer"
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
