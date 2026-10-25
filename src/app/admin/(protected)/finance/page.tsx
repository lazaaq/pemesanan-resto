import { siteConfig } from "@/config/site";
import { SectionHeader } from "@/features/admin/components/admin-ui";
import { formatCurrency } from "@/features/order/lib/checkout";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

type FinanceSearchParams = Promise<{
  from?: string | string[];
  to?: string | string[];
  paymentStatus?: string | string[];
  method?: string | string[];
}>;

type FinanceOrder = {
  id: string;
  order_number: number;
  total: number;
  payment_status: string;
  status: string;
  created_at: string;
  paid_at: string | null;
  metadata: Json;
};

type PaymentStatusFilter = "all" | "paid" | "unpaid" | "refunded";

const PAYMENT_STATUS_OPTIONS = [
  { value: "all", label: "Semua status" },
  { value: "paid", label: "Berhasil dibayar" },
  { value: "unpaid", label: "Belum dibayar" },
  { value: "refunded", label: "Dikembalikan" },
] as const;

const PAYMENT_METHOD_OPTIONS = [
  { value: "all", label: "Semua metode" },
  { value: "duitku", label: "Duitku" },
  { value: "midtrans", label: "Midtrans" },
  { value: "offline", label: "Offline / testing" },
] as const;

function getFirstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function getJakartaDate(value = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Jakarta",
    year: "numeric",
  }).format(value);
}

function isValidDateValue(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(
    Date.parse(`${value}T00:00:00Z`),
  );
}

function getJakartaDateRange(fromValue: string, toValue: string) {
  const today = getJakartaDate();
  const currentMonthStart = `${today.slice(0, 8)}01`;
  const requestedFrom = isValidDateValue(fromValue) ? fromValue : currentMonthStart;
  const requestedTo = isValidDateValue(toValue) ? toValue : today;

  return requestedFrom <= requestedTo
    ? { from: requestedFrom, to: requestedTo }
    : { from: requestedTo, to: requestedFrom };
}

function toUtcStartOfJakartaDate(value: string) {
  return new Date(`${value}T00:00:00+07:00`).toISOString();
}

function toUtcStartOfNextJakartaDate(value: string) {
  const date = new Date(`${value}T00:00:00+07:00`);
  date.setTime(date.getTime() + 24 * 60 * 60 * 1000);
  return date.toISOString();
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
  const root = getObject(metadata);
  const payment = getObject(root?.payment);
  const provider = getString(payment?.provider).toLowerCase();
  const paymentCode = getString(payment?.payment_code);

  if (provider === "duitku") {
    return {
      key: "duitku" as const,
      label: paymentCode ? `Duitku · ${paymentCode}` : "Duitku",
    };
  }

  if (provider === "midtrans") {
    return {
      key: "midtrans" as const,
      label: paymentCode ? `Midtrans · ${paymentCode}` : "Midtrans",
    };
  }

  if (root?.payment_disabled === true || getString(root?.source).includes("testing")) {
    return {
      key: "offline" as const,
      label: "Offline / testing",
    };
  }

  return {
    key: "unknown" as const,
    label: "Belum ditentukan",
  };
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function StatusBadge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const styles = {
    default: { background: "#f1f5f9", color: "var(--admin-muted)" },
    success: { background: "rgba(22,163,74,0.10)", color: "#15803d" },
    warning: { background: "rgba(255,200,30,0.20)", color: "#92700a" },
    danger: { background: "rgba(220,38,38,0.10)", color: "#b91c1c" },
  };

  return (
    <span
      className="w-fit rounded-full px-2.5 py-1 text-xs font-semibold"
      style={styles[tone]}
    >
      {children}
    </span>
  );
}

function getPaymentStatusTone(status: string) {
  if (status === "paid") return "success" as const;
  if (status === "refunded") return "danger" as const;
  return "warning" as const;
}

export default async function AdminFinancePage({
  searchParams,
}: {
  searchParams: FinanceSearchParams;
}) {
  const params = await searchParams;
  const dateRange = getJakartaDateRange(
    getFirstValue(params.from),
    getFirstValue(params.to),
  );
  const paymentStatus = getFirstValue(params.paymentStatus) || "all";
  const method = getFirstValue(params.method) || "all";
  const selectedPaymentStatus: PaymentStatusFilter = PAYMENT_STATUS_OPTIONS.some(
    (option) => option.value === paymentStatus,
  )
    ? (paymentStatus as PaymentStatusFilter)
    : "all";
  const selectedMethod = PAYMENT_METHOD_OPTIONS.some(
    (option) => option.value === method,
  )
    ? method
    : "all";

  const supabase = await createServerSupabaseClient();
  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("id")
    .eq("slug", siteConfig.restaurantSlug)
    .single();

  if (restaurantError || !restaurant) {
    throw restaurantError ?? new Error("Restaurant tidak ditemukan.");
  }

  let ordersQuery = supabase
    .from("orders")
    .select("id, order_number, total, payment_status, status, created_at, paid_at, metadata")
    .eq("restaurant_id", restaurant.id)
    .gte("created_at", toUtcStartOfJakartaDate(dateRange.from))
    .lt("created_at", toUtcStartOfNextJakartaDate(dateRange.to))
    .order("created_at", { ascending: false })
    .limit(1000);

  if (selectedPaymentStatus !== "all") {
    ordersQuery = ordersQuery.eq("payment_status", selectedPaymentStatus);
  }

  const { data, error } = await ordersQuery;

  if (error) {
    throw error;
  }

  const allOrders = (data ?? []) as unknown as FinanceOrder[];
  const orders = allOrders.filter((order) => {
    return selectedMethod === "all" || getPaymentMethod(order.metadata).key === selectedMethod;
  });
  const paidOrders = orders.filter((order) => order.payment_status === "paid");
  const totalSales = paidOrders.reduce((sum, order) => sum + Number(order.total), 0);
  const pendingSales = orders
    .filter((order) => order.payment_status === "unpaid")
    .reduce((sum, order) => sum + Number(order.total), 0);
  const refundedSales = orders
    .filter((order) => order.payment_status === "refunded")
    .reduce((sum, order) => sum + Number(order.total), 0);
  const averagePaidOrder = paidOrders.length ? totalSales / paidOrders.length : 0;
  const methodTotals = new Map<string, { count: number; total: number }>();

  for (const order of paidOrders) {
    const paymentMethod = getPaymentMethod(order.metadata);
    const current = methodTotals.get(paymentMethod.label) ?? { count: 0, total: 0 };
    methodTotals.set(paymentMethod.label, {
      count: current.count + 1,
      total: current.total + Number(order.total),
    });
  }

  const methodBreakdown = [...methodTotals.entries()].sort(
    ([, first], [, second]) => second.total - first.total,
  );

  return (
    <section className="w-full space-y-6">
      <SectionHeader
        eyebrow="Keuangan"
        title="Laporan Keuangan"
        description="Pantau penjualan, status pembayaran, tanggal transaksi, dan metode pembayaran restoran. Penjualan dihitung dari order yang sudah berstatus paid."
      />

      <form
        method="get"
        className="admin-card grid gap-4 p-4 md:grid-cols-[1fr_1fr_1fr_1fr_auto] md:items-end"
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium" style={{ color: "var(--admin-foreground)" }}>
            Dari tanggal
          </span>
          <input className="admin-input" type="date" name="from" defaultValue={dateRange.from} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium" style={{ color: "var(--admin-foreground)" }}>
            Sampai tanggal
          </span>
          <input className="admin-input" type="date" name="to" defaultValue={dateRange.to} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium" style={{ color: "var(--admin-foreground)" }}>
            Status pembayaran
          </span>
          <select className="admin-input" name="paymentStatus" defaultValue={selectedPaymentStatus}>
            {PAYMENT_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium" style={{ color: "var(--admin-foreground)" }}>
            Metode pembayaran
          </span>
          <select className="admin-input" name="method" defaultValue={selectedMethod}>
            {PAYMENT_METHOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="admin-btn-primary px-5 py-2.5">
          Terapkan
        </button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total penjualan", value: formatCurrency(totalSales), helper: `${paidOrders.length} transaksi lunas`, tone: "var(--admin-primary)" },
          { label: "Rata-rata transaksi", value: formatCurrency(averagePaidOrder), helper: "Order berstatus paid", tone: "#15803d" },
          { label: "Belum dibayar", value: formatCurrency(pendingSales), helper: "Masih menunggu pembayaran", tone: "#92700a" },
          { label: "Dikembalikan", value: formatCurrency(refundedSales), helper: "Total order refunded", tone: "#b91c1c" },
        ].map((stat) => (
          <div key={stat.label} className="admin-stat-card" style={{ borderTopColor: stat.tone }}>
            <p className="text-xs font-medium" style={{ color: "var(--admin-muted)" }}>{stat.label}</p>
            <p className="mt-2 text-2xl font-bold tracking-tight" style={{ color: "var(--admin-foreground)" }}>{stat.value}</p>
            <p className="mt-1 text-xs" style={{ color: "var(--admin-muted)" }}>{stat.helper}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="admin-card overflow-hidden">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b p-5" style={{ borderColor: "var(--admin-border)" }}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--admin-primary)" }}>Transaksi</p>
              <h3 className="mt-1 text-lg font-bold" style={{ color: "var(--admin-foreground)" }}>Rincian penjualan</h3>
            </div>
            <p className="text-xs" style={{ color: "var(--admin-muted)" }}>{orders.length} order ditemukan</p>
          </div>

          {orders.length === 0 ? (
            <p className="p-5 text-sm" style={{ color: "var(--admin-muted)" }}>Tidak ada transaksi untuk filter yang dipilih.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead style={{ background: "#f8fafc", color: "var(--admin-muted)" }}>
                  <tr>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider">Tanggal</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider">Order</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider">Metode</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--admin-border)" }}>
                  {orders.map((order) => {
                    const paymentMethod = getPaymentMethod(order.metadata);

                    return (
                      <tr key={order.id}>
                        <td className="px-5 py-4" style={{ color: "var(--admin-muted)" }}>
                          <p>{formatDateTime(order.created_at)}</p>
                          {order.paid_at ? <p className="mt-1 text-xs">Lunas: {formatDateTime(order.paid_at)}</p> : null}
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold" style={{ color: "var(--admin-foreground)" }}>#{order.order_number}</p>
                          <p className="mt-1 font-mono text-[10px]" style={{ color: "var(--admin-muted)" }}>{order.id.slice(0, 8)}…</p>
                        </td>
                        <td className="px-5 py-4" style={{ color: "var(--admin-foreground)" }}>{paymentMethod.label}</td>
                        <td className="px-5 py-4"><StatusBadge tone={getPaymentStatusTone(order.payment_status)}>{order.payment_status}</StatusBadge></td>
                        <td className="px-5 py-4 text-right font-semibold" style={{ color: "var(--admin-foreground)" }}>{formatCurrency(Number(order.total))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <aside className="admin-card h-fit p-5">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--admin-primary)" }}>Breakdown</p>
          <h3 className="mt-1 text-lg font-bold" style={{ color: "var(--admin-foreground)" }}>Metode pembayaran</h3>
          {methodBreakdown.length === 0 ? (
            <p className="mt-5 text-sm" style={{ color: "var(--admin-muted)" }}>Belum ada pembayaran berhasil.</p>
          ) : (
            <div className="mt-5 space-y-4">
              {methodBreakdown.map(([label, breakdown]) => (
                <div key={label} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--admin-foreground)" }}>{label}</p>
                    <p className="mt-1 text-xs" style={{ color: "var(--admin-muted)" }}>{breakdown.count} transaksi</p>
                  </div>
                  <p className="text-right text-sm font-bold" style={{ color: "var(--admin-primary)" }}>{formatCurrency(breakdown.total)}</p>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
