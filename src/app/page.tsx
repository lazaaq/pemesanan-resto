import { cookies } from "next/headers";
import { HomeShell } from "@/features/home/components/home-shell";
import { parseStoredCart, CHECKOUT_CART_COOKIE_KEY } from "@/features/order/lib/checkout";
import { getTableCode } from "@/features/order/lib/tables";
import { getActiveThemeCssVariables } from "@/lib/theme/get-active-theme-palette";

type HomeSearchParams = Promise<{
  table?: string | string[];
}>;

export default async function HomePage({
  searchParams,
}: {
  searchParams: HomeSearchParams;
}) {
  const themeCssVariables = await getActiveThemeCssVariables();
  const cookieStore = await cookies();
  const initialCart = parseStoredCart(cookieStore.get(CHECKOUT_CART_COOKIE_KEY)?.value);
  const params = await searchParams;
  const requestedTable = Array.isArray(params.table) ? params.table[0] : params.table;
  const tableCode = getTableCode(requestedTable);

  return (
    <div style={themeCssVariables}>
      <HomeShell initialCart={initialCart} tableCode={tableCode} />
    </div>
  );
}
