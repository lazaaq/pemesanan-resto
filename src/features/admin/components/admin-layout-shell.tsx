"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { signOutAdminAction } from "@/app/admin/actions";

// ─── SVG Icon atoms ──────────────────────────────────────────────────────────

function IconGrid() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}
function IconPalette() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" /><circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" /><circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12a10 10 0 0 0 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  );
}
function IconSliders() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}
function IconTag() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}
function IconUtensilsCrossed() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 2l5 5-5 5"/><path d="M8 2 3 7l5 5"/>
      <path d="M14 14l5.5 5.5a2.121 2.121 0 0 1-3 3L11 17"/>
      <path d="M11 11 5.5 5.5a2.121 2.121 0 0 1 3-3L14 8"/>
    </svg>
  );
}
function IconLogOut() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
function IconMenu() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}
function IconX() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function IconExternalLink() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

// ─── Nav config ──────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: "/admin",                label: "Overview",         icon: <IconGrid />,          title: "Overview Restoran" },
  { href: "/admin/presets",        label: "Palet Preset",      icon: <IconPalette />,       title: "Palet Warna Preset" },
  { href: "/admin/custom-palette", label: "Kustom Palet",      icon: <IconSliders />,       title: "Konfigurasi Custom Palette" },
  { href: "/admin/categories",     label: "Kategori",          icon: <IconTag />,           title: "Kelola Kategori Menu" },
  { href: "/admin/menus",          label: "Menu",              icon: <IconUtensilsCrossed />,title: "Kelola Makanan & Minuman" },
];

// ─── Sidebar content ─────────────────────────────────────────────────────────

function SidebarContent({
  userEmail,
  pathname,
  onNavClick,
}: {
  userEmail: string;
  pathname: string;
  onNavClick?: () => void;
}) {
  return (
    <>
      {/* Logo / branding */}
      <div
        style={{ borderBottom: "1px solid var(--admin-border)" }}
        className="flex items-center gap-2.5 px-5 py-4"
      >
        <span
          style={{ background: "var(--admin-primary)" }}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
            <path d="M7 2v20" />
            <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
          </svg>
        </span>
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--admin-foreground)" }}>
            RestoFlow
          </p>
          <p className="text-[11px]" style={{ color: "var(--admin-muted)" }}>
            Admin Panel
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p
          className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--admin-muted)", opacity: 0.7 }}
        >
          Navigasi
        </p>
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href as never}
                  className={`admin-nav-link${isActive ? " active" : ""}`}
                  onClick={() => onNavClick?.()}
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="my-4" style={{ borderTop: "1px solid var(--admin-border)" }} />

        <p
          className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--admin-muted)", opacity: 0.7 }}
        >
          Lainnya
        </p>
        <Link
          href="/"
          target="_blank"
          className="admin-nav-link"
          onClick={() => onNavClick?.()}
        >
          <IconExternalLink />
          Halaman User
        </Link>
      </nav>

      {/* User / sign-out footer */}
      <div
        style={{ borderTop: "1px solid var(--admin-border)" }}
        className="px-4 py-4"
      >
        <div className="mb-3 flex items-center gap-2.5 rounded-lg px-1">
          <span
            style={{ background: "var(--admin-primary)" }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
          >
            {userEmail.charAt(0).toUpperCase()}
          </span>
          <p
            className="truncate text-xs font-medium"
            style={{ color: "var(--admin-foreground)", maxWidth: 140 }}
          >
            {userEmail}
          </p>
        </div>
        <form action={signOutAdminAction}>
          <button
            type="submit"
            className="admin-btn-ghost flex w-full items-center justify-center gap-1.5 py-2 text-xs"
            style={{ color: "var(--admin-secondary)", borderColor: "rgba(237,53,0,0.3)" }}
          >
            <IconLogOut />
            Keluar
          </button>
        </form>
      </div>
    </>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function AdminLayoutShell({
  userEmail,
  children,
}: {
  userEmail: string;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Find active nav item for title
  const activeNavItem = NAV_ITEMS.find((n) => n.href === pathname) ?? NAV_ITEMS[0];

  // Close sidebar on resize to desktop
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) setSidebarOpen(false);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div className="admin-dashboard" style={{ minHeight: "100dvh" }}>
      {/* ── Overlay (mobile) ── */}
      <div
        className={`admin-overlay${sidebarOpen ? " open" : ""}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* ── Sidebar ── */}
      <aside className={`admin-sidebar${sidebarOpen ? " open" : ""}`} aria-label="Admin navigation">
        <SidebarContent
          userEmail={userEmail}
          pathname={pathname}
          onNavClick={() => setSidebarOpen(false)}
        />
      </aside>

      {/* ── Top Navbar ── */}
      <header className="admin-navbar">
        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setSidebarOpen((o) => !o)}
          className="lg:hidden -ml-1 flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-slate-100"
          aria-label={sidebarOpen ? "Tutup menu" : "Buka menu"}
          style={{ color: "var(--admin-foreground)" }}
        >
          {sidebarOpen ? <IconX /> : <IconMenu />}
        </button>

        {/* Page title */}
        <div className="flex-1 min-w-0">
          <h1
            className="truncate text-base font-semibold leading-none"
            style={{ color: "var(--admin-foreground)" }}
          >
            {activeNavItem.title}
          </h1>
          <p
            className="mt-0.5 truncate text-xs"
            style={{ color: "var(--admin-muted)" }}
          >
            Login sebagai {userEmail}
          </p>
        </div>

        {/* Accent badge */}
        <span
          className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
          style={{
            background: "rgba(9,63,180,0.08)",
            color: "var(--admin-primary)",
            border: "1px solid rgba(9,63,180,0.18)",
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: "var(--admin-primary)" }}
          />
          Admin
        </span>
      </header>

      {/* ── Main content ── */}
      <main className="admin-content">
        <div className="px-6 py-7 lg:px-8 xl:px-10">
          {children}
        </div>
      </main>
    </div>
  );
}
