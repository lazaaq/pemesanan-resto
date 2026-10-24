import { formatCurrency } from "@/features/order/lib/checkout";

type InvoiceEmailItem = {
  name: string;
  quantity: number;
  price: number;
};

type SendInvoiceEmailInput = {
  to: string;
  orderId: string;
  restaurantName: string;
  tableCode: string;
  items: InvoiceEmailItem[];
  subtotal: number;
  serviceFee: number;
  tax: number;
  total: number;
  paymentUrl: string;
};

type SendPaymentSuccessEmailInput = {
  to: string;
  orderId: string;
  restaurantName: string;
  total: number;
  reference?: string;
};

type ResendResponse = {
  id?: string;
  message?: string;
};

function requireEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function emailLayout(title: string, content: string) {
  const fromName = escapeHtml(process.env.EMAIL_FROM_NAME?.trim() || "RestoFlow");

  return `<!doctype html>
<html lang="id">
  <body style="margin:0;background:#f5f1ea;color:#2f261d;font-family:Arial,sans-serif;line-height:1.6">
    <div style="max-width:600px;margin:0 auto;padding:32px 16px">
      <div style="background:#ffffff;border-radius:20px;padding:32px;box-shadow:0 8px 30px rgba(47,38,29,.08)">
        <p style="margin:0 0 20px;color:#9b5b2a;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase">${fromName}</p>
        <h1 style="margin:0 0 24px;font-size:26px;line-height:1.25">${title}</h1>
        ${content}
      </div>
    </div>
  </body>
</html>`;
}

async function sendEmail({
  to,
  subject,
  html,
  idempotencyKey,
}: {
  to: string;
  subject: string;
  html: string;
  idempotencyKey: string;
}) {
  const apiKey = requireEnv("RESEND_API_KEY");
  const from = requireEnv("EMAIL_FROM");
  const replyTo = process.env.EMAIL_REPLY_TO?.trim();

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
    cache: "no-store",
  });

  const result = (await response.json().catch(() => ({}))) as ResendResponse;

  if (!response.ok || !result.id) {
    throw new Error(result.message || `Resend request failed with status ${response.status}`);
  }

  return result.id;
}

export async function sendInvoiceEmail(input: SendInvoiceEmailInput) {
  const itemRows = input.items
    .map(
      (item) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #eee">${escapeHtml(item.name)}</td>
        <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
        <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right">${formatCurrency(item.price * item.quantity)}</td>
      </tr>`,
    )
    .join("");

  const html = emailLayout(
    "Invoice pembayaran",
    `<p>Terima kasih. Silakan selesaikan pembayaran pesanan Anda melalui tombol berikut.</p>
    <p><strong>Nomor invoice:</strong> ${escapeHtml(input.orderId)}<br />
    <strong>Meja:</strong> ${escapeHtml(input.tableCode)}</p>
    <table style="width:100%;border-collapse:collapse;margin:24px 0;font-size:14px">
      <thead><tr>
        <th style="padding:10px 0;text-align:left;border-bottom:2px solid #2f261d">Pesanan</th>
        <th style="padding:10px 0;text-align:center;border-bottom:2px solid #2f261d">Qty</th>
        <th style="padding:10px 0;text-align:right;border-bottom:2px solid #2f261d">Jumlah</th>
      </tr></thead>
      <tbody>${itemRows}</tbody>
    </table>
    <p style="margin:4px 0;text-align:right">Subtotal: ${formatCurrency(input.subtotal)}</p>
    <p style="margin:4px 0;text-align:right">Biaya layanan: ${formatCurrency(input.serviceFee)}</p>
    <p style="margin:4px 0;text-align:right">Pajak: ${formatCurrency(input.tax)}</p>
    <p style="margin:12px 0 24px;text-align:right;font-size:18px"><strong>Total: ${formatCurrency(input.total)}</strong></p>
    <p style="text-align:center"><a href="${escapeHtml(input.paymentUrl)}" style="display:inline-block;background:#9b5b2a;color:#fff;padding:13px 22px;border-radius:999px;text-decoration:none;font-weight:700">Lanjutkan pembayaran</a></p>
    <p style="margin:24px 0 0;color:#6f655c;font-size:12px">Link pembayaran akan kedaluwarsa sesuai batas waktu yang ditentukan Duitku.</p>`,
  );

  return sendEmail({
    to: input.to,
    subject: `Invoice pembayaran ${input.restaurantName} - ${input.orderId}`,
    html,
    idempotencyKey: `invoice-email-${input.orderId}`,
  });
}

export async function sendPaymentSuccessEmail(input: SendPaymentSuccessEmailInput) {
  const html = emailLayout(
    "Pembayaran berhasil",
    `<p>Pembayaran pesanan Anda telah berhasil diterima.</p>
    <p><strong>Nomor invoice:</strong> ${escapeHtml(input.orderId)}<br />
    <strong>Total:</strong> ${formatCurrency(input.total)}${
      input.reference
        ? `<br /><strong>Referensi Duitku:</strong> ${escapeHtml(input.reference)}`
        : ""
    }</p>
    <p>Pesanan Anda sedang diproses oleh ${escapeHtml(input.restaurantName)}.</p>`,
  );

  return sendEmail({
    to: input.to,
    subject: `Pembayaran berhasil ${input.restaurantName} - ${input.orderId}`,
    html,
    idempotencyKey: `payment-success-email-${input.orderId}`,
  });
}
