import Link from "next/link";
import { siteConfig } from "@/config/site";
import { SectionHeader } from "@/features/admin/components/admin-ui";
import { formatCurrency } from "@/features/order/lib/checkout";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

type OrderItemRow = {
  id: string;
  item_name_snapshot: string;
  unit_price: number;
  quantity: number;
  total_price: number | null;
  notes: string | null;
};

type OrderRow = {
  id: string;
  order_number: number;
  customer_name: string | null;
  notes: string | null;
  order_type: string;
  status: string;
  payment_status: string;
  subtotal: number;
  service_fee: number;
  tax: number;
  total: number;
  placed_at: string;
  paid_at: string | null;
  created_at: string;
  dining_tables: { code: string } | null;
  metadata: Json;
  order_items: OrderItemRow[] | null;
};

type PaymentTab = "unpaid" | "paid";

type OrdersSearchParams = Promise<{
  payment?: string | string[];
  date?: string | string[];
}>;

function getFirstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
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

function getSelectedDate(value: string) {
  const today = getJakartaDate();

  if (!isValidDateValue(value) || value > today) {
    return today;
  }

  return value;
}

function toUtcStartOfJakartaDate(value: string) {
  return new Date(`${value}T00:00:00+07:00`).toISOString();
}

function toUtcStartOfNextJakartaDate(value: string) {
  const date = new Date(`${value}T00:00:00+07:00`);
  date.setTime(date.getTime() + 24 * 60 * 60 * 1000);
  return date.toISOString();
}

function shiftJakartaDate(value: string, days: number) {
  const date = new Date(`${value}T00:00:00+07:00`);
  date.setUTCDate(date.getUTCDate() + days);
  return getJakartaDate(date);
}

function formatSelectedDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "full",
    timeZone: "Asia/Jakarta",
  }).format(new Date(`${value}T00:00:00+07:00`));
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

function formatOrderType(value: string) {
  return value.replaceAll("_", " ").toUpperCase();
}

function getVisibleNotes(notes: string | null) {
  if (!notes) {
    return "";
  }

  return notes
    .replace(/^Pesanan dari checkout Duitku\.\s*/i, "")
    .replace(/^Testing order dari halaman user\.\s*/i, "")
    .replace(/^Meja:\s*[^.]+\.?\s*/i, "")
    .trim();
}

function StatusBadge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "success" | "warning";
}) {
  const styles = {
    default: {
      background: "#f1f5f9",
      color: "var(--admin-muted)",
    },
    success: {
      background: "rgba(22,163,74,0.10)",
      color: "#15803d",
    },
    warning: {
      background: "rgba(255,200,30,0.20)",
      color: "#92700a",
    },
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

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: OrdersSearchParams;
}) {
  const params = await searchParams;
  const requestedTab = getFirstValue(params.payment);
  const paymentTab: PaymentTab = requestedTab === "paid" ? "paid" : "unpaid";
  const selectedDate = getSelectedDate(getFirstValue(params.date));
  const today = getJakartaDate();
  const previousDate = shiftJakartaDate(selectedDate, -1);
  const nextDate = shiftJakartaDate(selectedDate, 1);
  const nextDateHref = nextDate <= today
    ? `/admin/orders?payment=${paymentTab}&date=${nextDate}`
    : undefined;
  const selectedDateStart = toUtcStartOfJakartaDate(selectedDate);
  const selectedDateEnd = toUtcStartOfNextJakartaDate(selectedDate);
  const supabase = await createServerSupabaseClient();
  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("id")
    .eq("slug", siteConfig.restaurantSlug)
    .single();

  if (restaurantError || !restaurant) {
    throw restaurantError ?? new Error("Restaurant tidak ditemukan.");
  }

  const [{ data, error }, { count: unpaidCount }, { count: paidCount }] = await Promise.all([
    supabase
      .from("orders")
      .select(
        `
        id,
        order_number,
        customer_name,
        notes,
        order_type,
        status,
        payment_status,
        subtotal,
        service_fee,
        tax,
        total,
        placed_at,
        paid_at,
        created_at,
        dining_tables ( code ),
        metadata,
        order_items (
          id,
          item_name_snapshot,
          unit_price,
          quantity,
          total_price,
          notes
        )
        `,
      )
      .eq("restaurant_id", restaurant.id)
      .eq("payment_status", paymentTab)
      .gte("placed_at", selectedDateStart)
      .lt("placed_at", selectedDateEnd)
      .order("placed_at", { ascending: false })
      .limit(50),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", restaurant.id)
      .eq("payment_status", "unpaid")
      .gte("placed_at", selectedDateStart)
      .lt("placed_at", selectedDateEnd),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", restaurant.id)
      .eq("payment_status", "paid")
      .gte("placed_at", selectedDateStart)
      .lt("placed_at", selectedDateEnd),
  ]);

  if (error) {
    throw error;
  }

  const orders = (data ?? []) as unknown as OrderRow[];

  return (
    <section className="w-full space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <SectionHeader
              eyebrow="Order"
              title={`Data Pemesanan · ${formatSelectedDate(selectedDate)}`}
              description="Pantau pesanan dan status pembayaran yang dikirim user dari halaman checkout."
            />
          </div>
          <form method="get" className="flex items-end gap-2">
            <input type="hidden" name="payment" value={paymentTab} />
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold" style={{ color: "var(--admin-muted)" }}>
                Tanggal order
              </span>
              <input
                className="admin-input h-[42px]"
                type="date"
                name="date"
                defaultValue={selectedDate}
                max={getJakartaDate()}
                aria-label="Pilih tanggal order"
              />
            </label>
            <button type="submit" className="admin-btn-primary h-[42px] rounded-lg px-4 py-0" style={{ borderRadius: "0.5rem" }}>
              Tampilkan
            </button>
          </form>
        </div>
        <div className="flex items-center justify-between gap-3">
          <Link
            href={`/admin/orders?payment=${paymentTab}&date=${previousDate}` as never}
            className="admin-btn-primary inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm leading-none"
            aria-label="Lihat order hari sebelumnya"
            style={{ borderRadius: "0.5rem" }}
          >
            <span aria-hidden="true">←</span>
            <span>Hari sebelumnya</span>
          </Link>
          <Link
            href={(nextDateHref ?? "#") as never}
            className={`admin-btn-primary inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm leading-none${nextDateHref ? "" : " pointer-events-none opacity-40"}`}
            aria-label="Lihat order hari berikutnya"
            aria-disabled={!nextDateHref}
            tabIndex={nextDateHref ? undefined : -1}
            style={{ borderRadius: "0.5rem" }}
          >
            <span>Hari setelahnya</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>

      <nav
        className="flex w-full gap-2 overflow-x-auto border-b"
        style={{ borderColor: "var(--admin-border)" }}
        aria-label="Filter status pembayaran"
      >
        {[
          { key: "paid" as const, label: "Paid", count: paidCount ?? 0 },
          { key: "unpaid" as const, label: "Unpaid", count: unpaidCount ?? 0 },
        ].map((tab) => {
          const isActive = paymentTab === tab.key;

          return (
            <Link
              key={tab.key}
              href={`/admin/orders?payment=${tab.key}&date=${selectedDate}` as never}
              className="-mb-px inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors"
              style={{
                borderColor: isActive ? "var(--admin-primary)" : "transparent",
                color: isActive ? "var(--admin-primary)" : "var(--admin-muted)",
              }}
              aria-current={isActive ? "page" : undefined}
            >
              {tab.label}
              <span
                className="rounded-full px-2 py-0.5 text-xs"
                style={{
                  background: isActive ? "rgba(9,63,180,0.10)" : "#f1f5f9",
                  color: isActive ? "var(--admin-primary)" : "var(--admin-muted)",
                }}
              >
                {tab.count}
              </span>
            </Link>
          );
        })}
      </nav>

      {orders.length === 0 ? (
        <div className="w-full bg-white py-6 text-sm" style={{ color: "var(--admin-muted)" }}>
          Belum ada order dengan status pembayaran {paymentTab}.
        </div>
      ) : (
        <div className="w-full space-y-0">
          {orders.map((order) => {
            const items = order.order_items ?? [];

            return (
              <article
                key={order.id}
                className="w-full overflow-hidden bg-white"
                style={{ borderBottom: "2px solid #111111" }}
              >
                <div className="grid gap-4 px-4 py-5 lg:grid-cols-[160px_minmax(0,1fr)_190px] lg:items-start">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--admin-muted)" }}>
                      Order
                    </p>
                    <h2 className="mt-1 text-2xl font-bold tracking-tight" style={{ color: "var(--admin-foreground)" }}>
                      #{order.order_number}
                    </h2>
                    <p className="mt-2 text-2xl font-bold tracking-tight" style={{ color: "var(--admin-secondary)" }}>
                      Meja {order.dining_tables?.code ?? "—"}
                    </p>
                    <div className="mt-3">
                      <StatusBadge tone="success">{formatOrderType(order.order_type)}</StatusBadge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="overflow-hidden">
                      <div
                        className="hidden grid-cols-[minmax(180px,1fr)_80px_120px] gap-4 border-b px-0 py-3 text-xs font-semibold uppercase tracking-wider md:grid"
                        style={{ borderColor: "var(--admin-border)", color: "var(--admin-muted)" }}
                      >
                        <span>Item</span>
                        <span>Qty</span>
                        <span className="text-right">Subtotal</span>
                      </div>

                      <div className="divide-y" style={{ borderColor: "var(--admin-border)" }}>
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="grid gap-1 py-3 md:grid-cols-[minmax(180px,1fr)_80px_120px] md:gap-4"
                          >
                            <div>
                              <p className="text-sm font-semibold" style={{ color: "var(--admin-foreground)" }}>
                                {item.item_name_snapshot}
                              </p>
                              <p className="text-xs" style={{ color: "var(--admin-muted)" }}>
                                {formatCurrency(item.unit_price)}
                              </p>
                            </div>
                            <p className="text-sm" style={{ color: "var(--admin-foreground)" }}>
                              {item.quantity}x
                            </p>
                            <p className="text-sm font-semibold md:text-right" style={{ color: "var(--admin-foreground)" }}>
                              {formatCurrency(item.total_price ?? item.unit_price * item.quantity)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1 border-t pt-3 text-sm" style={{ borderColor: "var(--admin-border)" }}>
                      <div className="flex justify-between gap-3">
                        <span style={{ color: "var(--admin-muted)" }}>Subtotal</span>
                        <p className="font-semibold" style={{ color: "var(--admin-foreground)" }}>
                          {formatCurrency(order.subtotal)}
                        </p>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span style={{ color: "var(--admin-muted)" }}>Layanan</span>
                        <p className="font-semibold" style={{ color: "var(--admin-foreground)" }}>
                          {formatCurrency(order.service_fee)}
                        </p>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span style={{ color: "var(--admin-muted)" }}>Pajak</span>
                        <p className="font-semibold" style={{ color: "var(--admin-foreground)" }}>
                          {formatCurrency(order.tax)}
                        </p>
                      </div>
                    </div>

                    {getVisibleNotes(order.notes) ? (
                      <p className="text-xs leading-6" style={{ color: "var(--admin-muted)" }}>
                        {getVisibleNotes(order.notes)}
                      </p>
                    ) : null}
                  </div>

                  <div className="lg:text-right">
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--admin-muted)" }}>
                      Total
                    </p>
                    <p className="mt-1 text-xl font-bold" style={{ color: "var(--admin-primary)" }}>
                      {formatCurrency(order.total)}
                    </p>
                    <div className="mt-3">
                      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--admin-muted)" }}>
                        Metode pembayaran
                      </p>
                      <p className="mt-1 text-sm font-semibold" style={{ color: "var(--admin-foreground)" }}>
                        {order.payment_status === "paid" ? getPaymentMethod(order.metadata) : "Belum dibayar"}
                      </p>
                      <p className="mt-2 text-xs" style={{ color: "var(--admin-muted)" }}>
                        {order.payment_status === "paid"
                          ? `Dibayar: ${formatDateTime(order.paid_at ?? order.placed_at ?? order.created_at)}`
                          : `Dibuat: ${formatDateTime(order.placed_at ?? order.created_at)}`}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
