import { cookies } from "next/headers";
import { ReviewOrderShell } from "@/features/order/components/review-order-shell";
import { CHECKOUT_CART_COOKIE_KEY, parseStoredCart } from "@/features/order/lib/checkout";

export default async function ReviewOrderPage() {
  const cookieStore = await cookies();
  const cart = parseStoredCart(cookieStore.get(CHECKOUT_CART_COOKIE_KEY)?.value);

  return <ReviewOrderShell cart={cart} />;
}
