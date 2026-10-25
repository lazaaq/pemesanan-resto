import Link from "next/link";
import { siteConfig } from "@/config/site";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";
import { formatCurrency } from "@/features/order/lib/checkout";
import { getThemePalette, type ThemePaletteValues } from "@/config/theme-palettes";

export const dynamic = "force-dynamic";

type SetupState = {
  title: string;
  description: string;
  steps: string[];
};

type DashboardOrderItem = {
  item_name_snapshot: string;
  quantity: number;
  total_price: number | null;
};

type DashboardOrder = {
  id: string;
  order_number: number;
  customer_name: string | null;
  total: number;
  payment_status: string;
  placed_at: string;
  paid_at: string | null;
  metadata: Json;
  order_items: DashboardOrderItem[] | null;
};

type SalesDay = {
  key: string;
  label: string;
  revenue: number;
  orders: number;
};

type TopItem = {
  name: string;
  quantity: number;
  revenue: number;
};

function getJakartaDate(value = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Jakarta",
    year: "numeric",
  }).format(value);
}

function shiftJakartaDate(value: string, days: number) {
  const date = new Date(`${value}T00:00:00+07:00`);
  date.setUTCDate(date.getUTCDate() + days);
  return getJakartaDate(date);
}

function toUtcStartOfJakartaDate(value: string) {
  return new Date(`${value}T00:00:00+07:00`).toISOString();
}

function toUtcStartOfNextJakartaDate(value: string) {
  return toUtcStartOfJakartaDate(shiftJakartaDate(value, 1));
}

function formatLongDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "full",
    timeZone: "Asia/Jakarta",
  }).format(new Date(`${value}T00:00:00+07:00`));
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(`${value}T00:00:00+07:00`));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function getSalesDate(order: DashboardOrder) {
  return getJakartaDate(new Date(order.payment_status === "paid" ? order.paid_at ?? order.placed_at : order.placed_at));
}

function getObject(value: Json | undefined) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, Json>)
    : null;
}

function getString(value: Json | undefined) {
  return typeof value === "string" ? value : "";
}

function getPaymentMethod(metadata: Json) {
  const payment = getObject(getObject(metadata)?.payment);
  const provider = getString(payment?.provider).toLowerCase();
  const paymentCode = getString(payment?.payment_code);

  if (provider === "duitku") {
    return paymentCode ? `Duitku · ${paymentCode}` : "Duitku";
  }

  if (provider === "midtrans") {
    return paymentCode ? `Midtrans · ${paymentCode}` : "Midtrans";
  }

  return "Offline / testing";
}

function DashboardMetric({
  label,
  value,
  helper,
  accent,
  href,
}: {
  label: string;
  value: string;
  helper: string;
  accent?: "blue" | "red" | "yellow" | "default";
  href?: string;
}) {
  const accentStyles: Record<string, { border: string; dot: string }> = {
    blue:    { border: "rgba(9,63,180,0.25)",  dot: "var(--admin-primary)" },
    red:     { border: "rgba(237,53,0,0.25)",  dot: "var(--admin-secondary)" },
    yellow:  { border: "rgba(255,200,30,0.5)", dot: "var(--admin-accent)" },
    default: { border: "var(--admin-border)",  dot: "#94a3b8" },
  };
  const style = accentStyles[accent ?? "default"];

  const content = (
    <div
      className="admin-stat-card flex flex-col gap-3 transition-transform hover:-translate-y-0.5"
      style={{ borderColor: style.border }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: style.dot }} />
          <p className="text-xs font-medium" style={{ color: "var(--admin-muted)" }}>
            {label}
          </p>
        </div>
        {href && (
          <span className="text-[11px] font-semibold" style={{ color: "var(--admin-primary)" }}>
            Kelola →
          </span>
        )}
      </div>
      <p className="text-2xl font-bold tracking-tight" style={{ color: "var(--admin-foreground)" }}>
        {value}
      </p>
      <p className="text-xs leading-5" style={{ color: "var(--admin-muted)" }}>
        {helper}
      </p>
    </div>
  );

  return href ? <Link href={href as never}>{content}</Link> : content;
}

function AdminSetupNotice({ title, description, steps }: SetupState) {
  return (
    <div className="space-y-6">
      <section
        className="rounded-2xl p-6"
        style={{
          border: "1px solid rgba(237,53,0,0.25)",
          background: "rgba(237,53,0,0.04)",
        }}
      >
        <div className="space-y-3">
          <p
            className="text-[11px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--admin-secondary)" }}
          >
            setup required
          </p>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--admin-foreground)" }}>
            {title}
          </h1>
          <p className="max-w-3xl text-sm leading-6" style={{ color: "var(--admin-muted)" }}>
            {description}
          </p>
        </div>

        <div
          className="mt-6 rounded-xl p-5"
          style={{
            border: "1px solid rgba(237,53,0,0.18)",
            background: "#fff",
          }}
        >
          <p className="text-sm font-semibold" style={{ color: "var(--admin-foreground)" }}>
            Langkah yang perlu dijalankan
          </p>
          <ol className="mt-4 space-y-3 text-sm leading-6" style={{ color: "var(--admin-muted)" }}>
            {steps.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: "var(--admin-secondary)" }}
                >
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}

function getSetupState(params: {
  hasMissingTables: boolean;
  hasMissingRestaurant: boolean;
}): SetupState | null {
  if (params.hasMissingTables) {
    return {
      title: "Database Supabase belum disiapkan",
      description:
        "Akun admin Anda sudah ada, tetapi schema aplikasi restoran belum dibuat di project Supabase ini. Karena itu dashboard belum bisa membaca tabel restaurants, categories, dan menu_items.",
      steps: [
        "Buka Supabase Dashboard lalu masuk ke SQL Editor project Anda.",
        "Jalankan file supabase/migrations/20260418104500_init_restaurant_ordering.sql.",
        "Jalankan file supabase/migrations/20260418122000_add_theme_palette_slug_to_restaurants.sql.",
        "Jalankan file supabase/seed.sql agar restaurant default, kategori, dan menu demo ikut terisi.",
        "Reload halaman /admin setelah semua query selesai dijalankan.",
      ],
    };
  }

  if (params.hasMissingRestaurant) {
    return {
      title: "Data restaurant default belum ada",
      description:
        "Schema database sudah terbaca, tetapi record restaurant dengan slug default aplikasi belum ditemukan. Dashboard admin membutuhkan 1 restaurant utama untuk memuat kategori, menu, dan pengaturan branding.",
      steps: [
        "Jalankan file supabase/seed.sql di SQL Editor Supabase.",
        "Atau tambahkan 1 row baru ke tabel restaurants dengan slug restoflow-order.",
        "Reload halaman /admin setelah record restaurant tersedia.",
      ],
    };
  }

  return null;
}

function PaymentPill({ status }: { status: string }) {
  const isPaid = status === "paid";

  return (
    <span
      className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{
        background: isPaid ? "rgba(22,163,74,0.10)" : "rgba(245,158,11,0.14)",
        color: isPaid ? "#15803d" : "#a16207",
      }}
    >
      {isPaid ? "Paid" : "Unpaid"}
    </span>
  );
}

export default async function AdminOverviewPage() {
  const today = getJakartaDate();
  const rangeStartDate = shiftJakartaDate(today, -6);
  const supabase = await createServerSupabaseClient();
  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("id, name, slug, currency_code, service_fee, theme_palette_slug, custom_theme_palette")
    .eq("slug", siteConfig.restaurantSlug)
    .single();

  const setupState = getSetupState({
    hasMissingTables: restaurantError?.code === "PGRST205",
    hasMissingRestaurant:
      (!restaurant && !restaurantError) ||
      restaurantError?.code === "PGRST116" ||
      restaurantError?.message?.toLowerCase().includes("contains 0 rows") === true,
  });

  if (setupState) {
    return <AdminSetupNotice {...setupState} />;
  }

  if (restaurantError || !restaurant) {
    throw restaurantError ?? new Error("Restaurant default tidak ditemukan.");
  }

  const rangeStart = toUtcStartOfJakartaDate(rangeStartDate);
  const rangeEnd = toUtcStartOfNextJakartaDate(today);
  const [{ data: salesData, error: salesError }, { count: categoryCount }, { count: menuItemCount }] = await Promise.all([
    supabase
      .from("orders")
      .select(
        `
        id,
        order_number,
        customer_name,
        total,
        payment_status,
        placed_at,
        paid_at,
        metadata,
        order_items (
          item_name_snapshot,
          quantity,
          total_price
        )
        `,
      )
      .eq("restaurant_id", restaurant.id)
      .gte("placed_at", rangeStart)
      .lt("placed_at", rangeEnd)
      .order("placed_at", { ascending: false })
      .limit(500),
    supabase
      .from("categories")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", restaurant.id),
    supabase
      .from("menu_items")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", restaurant.id),
  ]);

  if (salesError) {
    throw salesError;
  }

  const orders = (salesData ?? []) as unknown as DashboardOrder[];
  const paidOrders = orders.filter((order) => order.payment_status === "paid");
  const unpaidOrders = orders.filter((order) => order.payment_status === "unpaid");
  const todayOrders = orders.filter((order) => getJakartaDate(new Date(order.placed_at)) === today);
  const todayPaidOrders = paidOrders.filter((order) => getSalesDate(order) === today);
  const todayRevenue = todayPaidOrders.reduce((sum, order) => sum + Number(order.total), 0);
  const rangeRevenue = paidOrders.reduce((sum, order) => sum + Number(order.total), 0);
  const averageOrderValue = paidOrders.length ? rangeRevenue / paidOrders.length : 0;
  const paymentRate = orders.length ? Math.round((paidOrders.length / orders.length) * 100) : 0;

  const salesDays: SalesDay[] = Array.from({ length: 7 }, (_, index) => {
    const key = shiftJakartaDate(rangeStartDate, index);
    const dayOrders = paidOrders.filter((order) => getSalesDate(order) === key);

    return {
      key,
      label: formatShortDate(key),
      revenue: dayOrders.reduce((sum, order) => sum + Number(order.total), 0),
      orders: dayOrders.length,
    };
  });
  const maxDailyRevenue = Math.max(...salesDays.map((day) => day.revenue), 1);

  const itemTotals = new Map<string, TopItem>();
  paidOrders.forEach((order) => {
    (order.order_items ?? []).forEach((item) => {
      const current = itemTotals.get(item.item_name_snapshot) ?? {
        name: item.item_name_snapshot,
        quantity: 0,
        revenue: 0,
      };
      current.quantity += Number(item.quantity);
      current.revenue += Number(item.total_price ?? 0);
      itemTotals.set(item.item_name_snapshot, current);
    });
  });
  const topItems = [...itemTotals.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5);

  const activePalette = getThemePalette(restaurant.theme_palette_slug);
  const customPalette = restaurant.custom_theme_palette as Partial<ThemePaletteValues> | null;
  const isCustomActive = Boolean(customPalette && Object.keys(customPalette).length > 0);

  return (
    <div className="space-y-8">
      <section
        className="overflow-hidden rounded-2xl p-6 text-white shadow-sm sm:p-8"
        style={{ background: "linear-gradient(120deg, #093fb4 0%, #062a7b 100%)" }}
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-100">Dashboard penjualan</p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Selamat datang di {restaurant.name}</h1>
            <p className="max-w-2xl text-sm leading-6 text-blue-100">
              Pantau performa pembayaran dan aktivitas order dalam 7 hari terakhir dari satu tempat.
            </p>
          </div>
          <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm backdrop-blur-sm">
            <p className="text-xs text-blue-100">Hari ini</p>
            <p className="mt-1 font-semibold">{formatLongDate(today)}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetric label="Penjualan hari ini" value={formatCurrency(todayRevenue)} helper={`${todayPaidOrders.length} transaksi berhasil`} accent="blue" />
        <DashboardMetric label="Penjualan 7 hari" value={formatCurrency(rangeRevenue)} helper={`${paidOrders.length} transaksi paid`} accent="yellow" />
        <DashboardMetric label="Order hari ini" value={String(todayOrders.length)} helper={`${unpaidOrders.filter((order) => getJakartaDate(new Date(order.placed_at)) === today).length} masih unpaid`} accent="red" href="/admin/orders" />
        <DashboardMetric label="Rata-rata transaksi" value={formatCurrency(averageOrderValue)} helper={`${paymentRate}% dari order 7 hari sudah paid`} accent="default" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.8fr)]">
        <div className="admin-card p-5 sm:p-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--admin-primary)" }}>Tren penjualan</p>
              <h2 className="mt-1 text-lg font-bold" style={{ color: "var(--admin-foreground)" }}>Pendapatan harian</h2>
            </div>
            <span className="text-xs" style={{ color: "var(--admin-muted)" }}>Paid · 7 hari terakhir</span>
          </div>
          <div className="mt-8 flex h-56 items-end gap-2 sm:gap-4">
            {salesDays.map((day) => {
              const isToday = day.key === today;
              const height = day.revenue ? Math.max((day.revenue / maxDailyRevenue) * 100, 8) : 4;

              return (
                <div key={day.key} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                  <span className="truncate text-[10px] font-semibold sm:text-xs" style={{ color: "var(--admin-muted)" }}>
                    {day.revenue ? formatCurrency(day.revenue).replace("Rp", "Rp ") : "—"}
                  </span>
                  <div className="flex h-40 w-full items-end rounded-lg bg-slate-100 px-1.5">
                    <div
                      className="w-full rounded-md transition-all"
                      style={{ height: `${height}%`, background: isToday ? "var(--admin-primary)" : "#9bb5ee" }}
                      title={`${day.label}: ${formatCurrency(day.revenue)}`}
                    />
                  </div>
                  <span className={`text-[10px] font-medium sm:text-xs${isToday ? " font-bold" : ""}`} style={{ color: isToday ? "var(--admin-primary)" : "var(--admin-muted)" }}>
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="admin-card p-5 sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--admin-secondary)" }}>Status pembayaran</p>
          <h2 className="mt-1 text-lg font-bold" style={{ color: "var(--admin-foreground)" }}>Kesehatan order</h2>
          <div className="mt-6 space-y-5">
            <div>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: "var(--admin-muted)" }}>Paid</span>
                <span className="font-bold" style={{ color: "#15803d" }}>{paidOrders.length}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${paymentRate}%` }} />
              </div>
            </div>
            <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: "var(--admin-border)" }}>
              <span className="text-sm" style={{ color: "var(--admin-muted)" }}>Unpaid</span>
              <span className="font-bold" style={{ color: "#a16207" }}>{unpaidOrders.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: "var(--admin-muted)" }}>Katalog menu</span>
              <span className="font-bold" style={{ color: "var(--admin-foreground)" }}>{menuItemCount ?? 0} item</span>
            </div>
            <Link href="/admin/finance" className="admin-btn-primary inline-flex w-full items-center justify-center rounded-lg py-2.5" style={{ borderRadius: "0.5rem" }}>
              Buka laporan keuangan →
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
        <div className="admin-card overflow-hidden p-0">
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--admin-border)" }}>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--admin-primary)" }}>Aktivitas terbaru</p>
              <h2 className="mt-1 text-lg font-bold" style={{ color: "var(--admin-foreground)" }}>Order terbaru</h2>
            </div>
            <Link href="/admin/orders" className="text-xs font-semibold" style={{ color: "var(--admin-primary)" }}>Lihat semua →</Link>
          </div>
          {orders.length === 0 ? (
            <p className="px-3 py-4 text-sm sm:px-4" style={{ color: "var(--admin-muted)" }}>Belum ada order dalam 7 hari terakhir.</p>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--admin-border)" }}>
              {orders.slice(0, 6).map((order) => (
                <div key={order.id} className="flex flex-col gap-1.5 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold" style={{ color: "var(--admin-foreground)" }}>#{order.order_number}</p>
                      <PaymentPill status={order.payment_status} />
                    </div>
                    <p className="mt-0.5 truncate text-xs" style={{ color: "var(--admin-muted)" }}>
                      {order.customer_name || "Pelanggan"} · {formatDateTime(order.placed_at)}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-bold" style={{ color: "var(--admin-primary)" }}>{formatCurrency(order.total)}</p>
                    <p className="mt-0.5 text-[11px]" style={{ color: "var(--admin-muted)" }}>{order.payment_status === "paid" ? getPaymentMethod(order.metadata) : "Menunggu pembayaran"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="admin-card p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--admin-secondary)" }}>Produk terlaris</p>
              <h2 className="mt-1 text-lg font-bold" style={{ color: "var(--admin-foreground)" }}>Menu favorit</h2>
            </div>
            <Link href="/admin/menus" className="text-xs font-semibold" style={{ color: "var(--admin-primary)" }}>Kelola →</Link>
          </div>
          {topItems.length === 0 ? (
            <p className="mt-8 text-sm" style={{ color: "var(--admin-muted)" }}>Belum ada menu terjual.</p>
          ) : (
            <div className="mt-5 space-y-4">
              {topItems.map((item, index) => (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold" style={{ background: index === 0 ? "rgba(255,200,30,0.28)" : "#f1f5f9", color: index === 0 ? "#92700a" : "var(--admin-muted)" }}>{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold" style={{ color: "var(--admin-foreground)" }}>{item.name}</p>
                    <p className="mt-0.5 text-xs" style={{ color: "var(--admin-muted)" }}>{item.quantity} terjual</p>
                  </div>
                  <p className="text-right text-xs font-semibold" style={{ color: "var(--admin-foreground)" }}>{formatCurrency(item.revenue)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--admin-border)" }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--admin-foreground)" }}>Pengaturan restoran</p>
          <p className="mt-1 text-xs" style={{ color: "var(--admin-muted)" }}>{categoryCount ?? 0} kategori · {menuItemCount ?? 0} menu · Palet {isCustomActive ? "custom" : activePalette.name}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/categories" className="admin-btn-ghost rounded-lg px-4 py-2" style={{ borderRadius: "0.5rem" }}>Kategori</Link>
          <Link href="/admin/menus" className="admin-btn-ghost rounded-lg px-4 py-2" style={{ borderRadius: "0.5rem" }}>Menu</Link>
          <Link href="/admin/presets" className="admin-btn-ghost rounded-lg px-4 py-2" style={{ borderRadius: "0.5rem" }}>Palet warna</Link>
        </div>
      </section>
    </div>
  );
}
