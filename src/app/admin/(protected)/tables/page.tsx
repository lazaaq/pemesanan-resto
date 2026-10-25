import QRCode from "qrcode";
import Image from "next/image";
import { siteConfig } from "@/config/site";
import { QR_TABLE_CODES } from "@/features/order/lib/tables";

export const dynamic = "force-dynamic";

async function createTableQrCode(tableCode: string) {
  const targetUrl = new URL(`/?table=${encodeURIComponent(tableCode)}`, siteConfig.url).toString();

  return {
    tableCode,
    targetUrl,
    dataUrl: await QRCode.toDataURL(targetUrl, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 360,
      color: {
        dark: "#111827",
        light: "#ffffff",
      },
    }),
  };
}

export default async function AdminTablesPage() {
  const tableCodes = await Promise.all(QR_TABLE_CODES.map(createTableQrCode));

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--admin-primary)" }}>
            Operasional
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight" style={{ color: "var(--admin-foreground)" }}>
            QR Code Meja
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6" style={{ color: "var(--admin-muted)" }}>
            Cetak dan letakkan QR code ini di meja. Setelah dipindai, pelanggan akan langsung membuka menu dengan nomor meja yang sesuai.
          </p>
        </div>
        <div className="rounded-lg border px-3 py-2 text-xs" style={{ borderColor: "var(--admin-border)", color: "var(--admin-muted)" }}>
          {siteConfig.url}
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
        {tableCodes.map(({ tableCode, targetUrl, dataUrl }) => (
          <article key={tableCode} className="admin-card flex flex-col items-center p-4 text-center">
            <div className="w-full border-b pb-3" style={{ borderColor: "var(--admin-border)" }}>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--admin-muted)" }}>
                Nomor meja
              </p>
              <h2 className="mt-1 text-3xl font-bold" style={{ color: "var(--admin-primary)" }}>{tableCode}</h2>
            </div>
            <div className="mt-4 rounded-xl border bg-white p-2" style={{ borderColor: "var(--admin-border)" }}>
              {/* The QR data URL is generated server-side for reliable printing. */}
              <Image src={dataUrl} alt={`QR code untuk meja ${tableCode}`} width={210} height={210} className="h-auto w-full max-w-[210px]" unoptimized />
            </div>
            <p className="mt-3 break-all text-[10px] leading-4" style={{ color: "var(--admin-muted)" }}>{targetUrl}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
