export type PaymentMethodOption = {
  id: string;
  label: string;
  description: string;
  enabledPayments?: string[];
};

export const paymentMethodOptions: PaymentMethodOption[] = [
  {
    id: "all",
    label: "Semua Metode",
    description: "Tampilkan semua channel aktif di Snap Midtrans.",
  },
  {
    id: "qris",
    label: "QRIS",
    description: "Bayar cepat via scan QR dari e-wallet atau mobile banking.",
    enabledPayments: ["qris"],
  },
  {
    id: "gopay",
    label: "GoPay",
    description: "Langsung arahkan checkout ke alur pembayaran GoPay.",
    enabledPayments: ["gopay"],
  },
  {
    id: "shopeepay",
    label: "ShopeePay",
    description: "Cocok untuk pelanggan yang ingin bayar dengan ShopeePay.",
    enabledPayments: ["shopeepay"],
  },
  {
    id: "bank_transfer",
    label: "Transfer Bank",
    description: "Virtual account bank yang aktif di akun Midtrans Anda.",
    enabledPayments: ["bank_transfer"],
  },
  {
    id: "credit_card",
    label: "Kartu Kredit",
    description: "Langsung ke form pembayaran kartu kredit/debit.",
    enabledPayments: ["credit_card"],
  },
];

export function getPaymentMethodOption(methodId?: string | null) {
  return paymentMethodOptions.find((option) => option.id === methodId) ?? paymentMethodOptions[0];
}
