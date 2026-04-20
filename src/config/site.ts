export const siteConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "RestoFlow Order",
  description:
    "Aplikasi pemesanan online restoran dengan pengalaman mobile-first untuk pilih menu, tambah ke cart, dan checkout.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  restaurantSlug: "restoflow-order",
  defaultTableCode: "A12",
  midtrans: {
    paymentRoute: "/api/payments/midtrans/token",
  },
  navigation: [
    { href: "#category-best-seller", label: "Best Seller" },
    { href: "#category-makanan-berat", label: "Makanan" },
    { href: "#checkout", label: "Checkout" },
  ],
} as const;
