import { siteConfig } from "@/config/site";
import { SectionHeader } from "@/features/admin/components/admin-ui";
import { formatCurrency } from "@/features/order/lib/checkout";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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
  created_at: string;
  order_items: OrderItemRow[] | null;
};

function formatDateTime(value: string) {
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

export default async function AdminOrdersPage() {
  const supabase = await createServerSupabaseClient();
  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("id")
    .eq("slug", siteConfig.restaurantSlug)
    .single();

  if (restaurantError || !restaurant) {
    throw restaurantError ?? new Error("Restaurant tidak ditemukan.");
  }

  const { data, error } = await supabase
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
        created_at,
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
    .order("placed_at", { ascending: false })
    .limit(50);

  if (error) {
    throw error;
  }

  const orders = (data ?? []) as unknown as OrderRow[];

  return (
    <section className="w-full space-y-6">
      <SectionHeader
        eyebrow="Order"
        title="Data Pemesanan"
        description="Pantau pesanan yang dikirim user dari halaman checkout. Payment sementara masih dinonaktifkan untuk testing data masuk."
      />

      {orders.length === 0 ? (
        <div className="w-full bg-white py-6 text-sm" style={{ color: "var(--admin-muted)" }}>
          Belum ada order masuk.
        </div>
      ) : (
        <div className="w-full space-y-5">
          {orders.map((order) => {
            const items = order.order_items ?? [];

            return (
              <article
                key={order.id}
                className="w-full overflow-hidden bg-white"
                style={{ borderTop: "1px solid var(--admin-border)" }}
              >
                <div className="grid gap-4 px-4 py-5 lg:grid-cols-[160px_minmax(0,1fr)_150px_150px] lg:items-start">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--admin-muted)" }}>
                      Order
                    </p>
                    <h2 className="mt-1 text-2xl font-bold tracking-tight" style={{ color: "var(--admin-foreground)" }}>
                      #{order.order_number}
                    </h2>
                    <p className="mt-1 text-xs" style={{ color: "var(--admin-muted)" }}>
                      {formatDateTime(order.placed_at ?? order.created_at)}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge tone="warning">{order.status}</StatusBadge>
                      <StatusBadge>{order.payment_status}</StatusBadge>
                      <StatusBadge tone="success">{order.order_type}</StatusBadge>
                    </div>

                    <div className="overflow-hidden border-y" style={{ borderColor: "var(--admin-border)" }}>
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

                    {order.notes ? (
                      <p className="text-xs leading-6" style={{ color: "var(--admin-muted)" }}>
                        {order.notes}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between gap-3 lg:block">
                      <span style={{ color: "var(--admin-muted)" }}>Subtotal</span>
                      <p className="font-semibold" style={{ color: "var(--admin-foreground)" }}>
                        {formatCurrency(order.subtotal)}
                      </p>
                    </div>
                    <div className="flex justify-between gap-3 lg:block">
                      <span style={{ color: "var(--admin-muted)" }}>Layanan</span>
                      <p className="font-semibold" style={{ color: "var(--admin-foreground)" }}>
                        {formatCurrency(order.service_fee)}
                      </p>
                    </div>
                    <div className="flex justify-between gap-3 lg:block">
                      <span style={{ color: "var(--admin-muted)" }}>Pajak</span>
                      <p className="font-semibold" style={{ color: "var(--admin-foreground)" }}>
                        {formatCurrency(order.tax)}
                      </p>
                    </div>
                  </div>

                  <div className="lg:text-right">
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--admin-muted)" }}>
                      Total
                    </p>
                    <p className="mt-1 text-xl font-bold" style={{ color: "var(--admin-primary)" }}>
                      {formatCurrency(order.total)}
                    </p>
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
