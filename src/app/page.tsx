import { cookies } from "next/headers";
import { HomeShell } from "@/features/home/components/home-shell";
import { parseStoredCart, CHECKOUT_CART_COOKIE_KEY } from "@/features/order/lib/checkout";
import { getActiveThemeCssVariables } from "@/lib/theme/get-active-theme-palette";

export default async function HomePage() {
  const themeCssVariables = await getActiveThemeCssVariables();
  const cookieStore = await cookies();
  const initialCart = parseStoredCart(cookieStore.get(CHECKOUT_CART_COOKIE_KEY)?.value);

  return (
    <div style={themeCssVariables}>
      <HomeShell initialCart={initialCart} />
    </div>
  );
}
