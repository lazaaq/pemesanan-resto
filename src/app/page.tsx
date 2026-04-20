import { cookies } from "next/headers";
import { getThemePaletteCssVariables } from "@/config/theme-palettes";
import { HomeShell } from "@/features/home/components/home-shell";
import { parseStoredCart, CHECKOUT_CART_COOKIE_KEY } from "@/features/order/lib/checkout";
import { getActiveThemePaletteSlug } from "@/lib/theme/get-active-theme-palette";

export default async function HomePage() {
  const activePaletteSlug = await getActiveThemePaletteSlug();
  const cookieStore = await cookies();
  const initialCart = parseStoredCart(cookieStore.get(CHECKOUT_CART_COOKIE_KEY)?.value);

  return (
    <div style={getThemePaletteCssVariables(activePaletteSlug)}>
      <HomeShell initialCart={initialCart} />
    </div>
  );
}
