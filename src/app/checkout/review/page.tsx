import { cookies } from "next/headers";
import { ReviewOrderShell } from "@/features/order/components/review-order-shell";
import { CHECKOUT_CART_COOKIE_KEY, parseStoredCart } from "@/features/order/lib/checkout";
import { getTableCode } from "@/features/order/lib/tables";
import { getActiveThemeCssVariables } from "@/lib/theme/get-active-theme-palette";

type ReviewSearchParams = Promise<{
  table?: string | string[];
}>;

export default async function ReviewOrderPage({
  searchParams,
}: {
  searchParams: ReviewSearchParams;
}) {
  const themeCssVariables = await getActiveThemeCssVariables();
  const cookieStore = await cookies();
  const cart = parseStoredCart(cookieStore.get(CHECKOUT_CART_COOKIE_KEY)?.value);
  const params = await searchParams;
  const requestedTable = Array.isArray(params.table) ? params.table[0] : params.table;
  const tableCode = getTableCode(requestedTable);

  return (
    <div style={themeCssVariables}>
      <ReviewOrderShell cart={cart} tableCode={tableCode} />
    </div>
  );
}
