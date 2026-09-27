"use client";

import { useEffect, useRef, useState } from "react";
import {
  createDiningTableAction,
  updateDiningTableAction,
  deleteDiningTableAction,
} from "@/app/admin/actions";
import { siteConfig } from "@/config/site";

type DiningTableRow = {
  id: string;
  code: string;
  capacity: number;
  is_active: boolean;
};

type TablesGridProps = {
  restaurantId: string;
  restaurantName: string;
  tableRows: DiningTableRow[];
};

function TableFormDialog({
  mode,
  table,
  restaurantId,
  onSuccess,
}: {
  mode: "add" | "edit";
  table?: DiningTableRow;
  restaurantId: string;
  onSuccess?: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isPending, setIsPending] = useState(false);

  function openDialog() {
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    dialogRef.current?.close();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (mode === "edit" && table) {
      formData.set("tableId", table.id);
    }
    setIsPending(true);
    try {
      if (mode === "add") {
        await createDiningTableAction(formData);
      } else {
        await updateDiningTableAction(formData);
      }
      closeDialog();
      onSuccess?.();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className={mode === "add" ? "admin-btn-primary px-5 py-2.5" : "admin-btn-ghost px-3 py-1.5 text-xs"}
      >
        {mode === "add" ? "Tambah meja baru" : "Edit"}
      </button>

      <dialog
        ref={dialogRef}
        className="fixed left-1/2 top-1/2 w-[min(400px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-0 shadow-2xl backdrop:bg-slate-950/40"
        onClose={closeDialog}
      >
        <form onSubmit={handleSubmit} className="grid gap-4 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--admin-muted)" }}>
                Meja
              </p>
              <h3 className="mt-1 text-lg font-bold" style={{ color: "var(--admin-foreground)" }}>
                {mode === "add" ? "Tambah meja baru" : "Edit meja"}
              </h3>
            </div>
            <button type="button" onClick={closeDialog} className="admin-btn-ghost px-3 py-1.5 text-xs">
              Tutup
            </button>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: "var(--admin-foreground)" }}>
              Kode Meja
            </span>
            <input
              name="code"
              required
              placeholder="A1"
              defaultValue={table?.code}
              className="admin-input"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: "var(--admin-foreground)" }}>
              Kapasitas (orang)
            </span>
            <input
              name="capacity"
              type="number"
              min={1}
              max={20}
              placeholder="4"
              defaultValue={table?.capacity ?? 4}
              className="admin-input"
            />
          </label>

          <button type="submit" disabled={isPending} className="admin-btn-primary w-full py-2.5">
            {isPending ? "Menyimpan..." : mode === "add" ? "Tambah meja" : "Simpan"}
          </button>
        </form>
      </dialog>
    </>
  );
}

function QRCodeModal({
  table,
  restaurantId,
  restaurantName,
  onClose,
}: {
  table: DiningTableRow;
  restaurantId: string;
  restaurantName: string;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [format, setFormat] = useState<"png" | "jpeg">("png");
  const [sizeCm, setSizeCm] = useState(4);

  // 300 DPI → 300/2.54 ≈ 118px per cm
  const PPI = 300 / 2.54;
  const pixelSize = Math.round(sizeCm * PPI);

  const encoded = btoa(`${restaurantId}:${table.code}`);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${pixelSize}x${pixelSize}&data=${encodeURIComponent(
    `${siteConfig.url}?t=${encoded}`
  )}`;

  // Open dialog on mount
  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  function handleClose() {
    dialogRef.current?.close();
    onClose();
  }

  // Close on backdrop click
  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) {
      handleClose();
    }
  }

  // Copy QR URL to clipboard
  function handleCopyUrl() {
    navigator.clipboard.writeText(`${siteConfig.url}?t=${encoded}`);
  }
  async function handleDownload() {
    try {
      const res = await fetch(qrUrl);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);

        // Canvas with padding: 10% padding on each side
        const padding = Math.round(img.width * 0.1);
        const canvas = document.createElement("canvas");
        canvas.width = img.width + padding * 2;
        canvas.height = img.height + padding * 2;
        const ctx = canvas.getContext("2d")!;

        // White background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw QR centered
        ctx.drawImage(img, padding, padding);

        canvas.toBlob((blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `QR-${restaurantName}-${table.code}.${format}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, `image/${format}`);
      };
      img.src = objectUrl;
    } catch {
      // fallback: open in new tab
      window.open(qrUrl, "_blank");
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 m-auto max-w-sm rounded-xl bg-white p-6 shadow-2xl backdrop:bg-slate-950/40"
      onClick={handleBackdropClick}
    >
      <div className="flex flex-col items-center gap-4">
        {/* Header */}
        <div className="flex w-full items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--admin-muted)" }}>
              Meja
            </p>
            <h3 className="mt-1 text-lg font-bold" style={{ color: "var(--admin-foreground)" }}>
              QR Code Meja {table.code}
            </h3>
            <p className="mt-0.5 text-xs" style={{ color: "var(--admin-muted)" }}>
              {restaurantName} · Kapasitas {table.capacity} orang
            </p>
          </div>
          <button type="button" onClick={handleClose} className="admin-btn-ghost px-3 py-1.5 text-xs shrink-0">
            ✕
          </button>
        </div>

        {/* QR Preview */}
        <div className="overflow-hidden rounded-xl border-4 border-white shadow-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrUrl} alt={`QR Code untuk meja ${table.code}`} width={pixelSize} height={pixelSize} />
        </div>

        {/* Options: Format & Size */}
        <div className="flex w-full flex-col gap-3 rounded-xl border p-3" style={{ borderColor: "var(--admin-border)" }}>
          <div className="flex gap-3">
            {/* Format toggle */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium" style={{ color: "var(--admin-foreground)" }}>Format</span>
              <div className="flex rounded-lg border p-0.5" style={{ borderColor: "var(--admin-border)" }}>
                {(["png", "jpeg"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFormat(f)}
                    className={`flex-1 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                      format === f ? "bg-primary text-white" : "text-muted hover:bg-slate-100"
                    }`}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Size selector */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium" style={{ color: "var(--admin-foreground)" }}>Ukuran (cm)</span>
              <div className="flex items-center gap-1">
                {[3, 4, 5, 6].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSizeCm(s)}
                    className={`w-9 rounded-md border py-1 text-xs font-medium transition-colors ${
                      sizeCm === s
                        ? "border-primary bg-primary text-white"
                        : "border-slate-200 text-muted hover:bg-slate-100"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* URL */}
          <div className="flex items-center gap-1">
            <p className="flex-1 truncate rounded bg-slate-50 px-2 py-1 text-xs font-mono text-muted" title={qrUrl}>
              {siteConfig.url}?t={encoded}
            </p>
            <button
              type="button"
              onClick={handleCopyUrl}
              className="shrink-0 rounded bg-slate-50 px-2 py-1 text-xs text-muted hover:bg-slate-100 hover:text-foreground"
              title="Copy URL"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex w-full gap-2">
          <button
            type="button"
            onClick={handleDownload}
            className="flex-1 admin-btn-primary py-2.5"
          >
            ⬇️ Download
          </button>
          <button type="button" onClick={handleClose} className="admin-btn-ghost px-4 py-2.5">
            Tutup
          </button>
        </div>
      </div>
    </dialog>
  );
}

function DeleteTableButton({
  tableId,
  tableCode,
}: {
  tableId: string;
  tableCode: string;
}) {
  const [isPending, setIsPending] = useState(false);

  async function handleDelete() {
    if (!window.confirm(`Yakin ingin menghapus meja ${tableCode}?`)) return;
    setIsPending(true);
    try {
      const formData = new FormData();
      formData.set("tableId", tableId);
      await deleteDiningTableAction(formData);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="admin-btn-danger px-3 py-1.5 text-xs"
    >
      {isPending ? "Menghapus..." : "Hapus"}
    </button>
  );
}

export function TablesGrid({ restaurantId, restaurantName, tableRows }: TablesGridProps) {
  const [qrTable, setQrTable] = useState<DiningTableRow | null>(null);

  return (
    <>
      <div className="flex justify-end">
        <TableFormDialog mode="add" restaurantId={restaurantId} />
      </div>

      {tableRows.length === 0 ? (
        <div className="w-full bg-white py-12 text-center">
          <p className="text-sm" style={{ color: "var(--admin-muted)" }}>
            Belum ada meja. Tambahkan meja pertama Anda.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tableRows.map((table) => (
            <div
              key={table.id}
              className="overflow-hidden rounded-xl border bg-white"
              style={{ borderColor: "var(--admin-border)" }}
            >
              {/* QR Preview */}
              <div
                className="flex aspect-square items-center justify-center p-4"
                style={{ background: "var(--admin-muted)" }}
              >
                <div className="overflow-hidden rounded-lg bg-white p-2 shadow">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                      `${siteConfig.url}?t=${btoa(`${restaurantId}:${table.code}`)}`
                    )}`}
                    alt={`QR ${table.code}`}
                    width={160}
                    height={160}
                    className="block"
                  />
                </div>
              </div>

              {/* Info */}
              <div className="border-t p-4" style={{ borderColor: "var(--admin-border)" }}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold" style={{ color: "var(--admin-foreground)" }}>
                      Meja {table.code}
                    </h4>
                    <p className="text-xs" style={{ color: "var(--admin-muted)" }}>
                      Kapasitas: {table.capacity} orang
                    </p>
                  </div>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-semibold"
                    style={{
                      background: table.is_active ? "rgba(22,163,74,0.10)" : "#f1f5f9",
                      color: table.is_active ? "#15803d" : "var(--admin-muted)",
                    }}
                  >
                    {table.is_active ? "Aktif" : "Nonaktif"}
                  </span>
                </div>

                {/* Actions */}
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setQrTable(table)}
                    className="flex-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium hover:bg-slate-200"
                    style={{ color: "var(--admin-foreground)" }}
                  >
                    Lihat QR
                  </button>
                  <TableFormDialog mode="edit" table={table} restaurantId={restaurantId} />
                  <DeleteTableButton tableId={table.id} tableCode={table.code} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {qrTable && (
        <QRCodeModal
          table={qrTable}
          restaurantId={restaurantId}
          restaurantName={restaurantName}
          onClose={() => setQrTable(null)}
        />
      )}
    </>
  );
}
