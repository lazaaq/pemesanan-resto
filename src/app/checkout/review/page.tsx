import { cookies } from "next/headers";
import { ReviewOrderShell } from "@/features/order/components/review-order-shell";
import { CHECKOUT_CART_COOKIE_KEY, parseStoredCart } from "@/features/order/lib/checkout";
import { getActiveThemeCssVariables } from "@/lib/theme/get-active-theme-palette";

export default async function ReviewOrderPage() {
  const themeCssVariables = await getActiveThemeCssVariables();
  const cookieStore = await cookies();
  const cart = parseStoredCart(cookieStore.get(CHECKOUT_CART_COOKIE_KEY)?.value);

  return (
    <div style={themeCssVariables}>
      <ReviewOrderShell cart={cart} />
    </div>
  );
}
