import { cookies } from "next/headers";
import { getActiveThemeCssVariables } from "@/lib/theme/get-active-theme-palette";
import { TABLE_CODE_COOKIE_KEY } from "@/features/order/lib/checkout";
import { OrderSuccessShell } from "@/features/order/components/order-success-shell";

export const dynamic = "force-dynamic";

type SuccessSearchParams = Promise<{
  table?: string | string[];
  merchantOrderId?: string;
  resultCode?: string;
  reference?: string;
}>;

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams?: SuccessSearchParams;
}) {
  const themeCssVariables = await getActiveThemeCssVariables();
  const cookieStore = await cookies();
  const params = searchParams ? await searchParams : {};
  const requestedTable = Array.isArray(params?.table) ? params.table[0] : params?.table;
  const cookieTable = cookieStore.get(TABLE_CODE_COOKIE_KEY)?.value ?? "";
  const tableCode = requestedTable || cookieTable;

  return (
    <div style={themeCssVariables}>
      <OrderSuccessShell tableCode={tableCode} />
    </div>
  );
}
