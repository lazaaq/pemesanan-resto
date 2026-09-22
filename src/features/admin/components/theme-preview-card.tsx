import type { CSSProperties } from "react";

export function ThemePreviewCard({
  cssVariables,
  title = "Menu Resto",
  label = "Live Preview",
  description = "Real-time update",
}: {
  cssVariables: CSSProperties;
  title?: string;
  label?: string;
  description?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">
          {label}
        </span>
        <span className="text-[11px] text-muted">{description}</span>
      </div>

      <div
        style={cssVariables}
        className="overflow-hidden rounded-[1.75rem] border border-border bg-background transition-all"
      >
        <div className="mobile-app-shell p-4">
          <div className="rounded-[1.4rem] border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
                  RestoFlow
                </p>
                <p className="mt-0.5 text-sm font-bold text-foreground">{title}</p>
              </div>
              <div className="flex gap-1.5">
                <span className="h-3.5 w-3.5 rounded-full bg-primary" />
                <span className="h-3.5 w-3.5 rounded-full bg-secondary" />
                <span className="h-3.5 w-3.5 rounded-full bg-accent" />
              </div>
            </div>

            <div className="mt-3.5 space-y-2">
              <div className="rounded-full bg-white/80 px-3 py-1.5 text-xs text-muted shadow-xs">
                🔍 Cari makanan...
              </div>
              <div className="flex gap-2">
                <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-white shadow-xs">
                  Best Seller
                </span>
                <span className="rounded-full border border-border bg-card px-3 py-1 text-[11px] font-medium text-foreground">
                  Minuman
                </span>
              </div>
            </div>

            <div className="mt-3.5 rounded-[1rem] border border-border bg-surfaceCard p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-foreground">Nasi Goreng Special</p>
                  <p className="text-[10px] text-muted">Rp 35.000</p>
                </div>
                <button
                  type="button"
                  className="rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-white"
                >
                  + Tambah
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
