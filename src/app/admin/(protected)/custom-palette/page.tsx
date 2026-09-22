import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminCustomPalettePage() {
  redirect("/admin/presets" as never);
}
