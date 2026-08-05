import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AdminLayoutShell } from "@/features/admin/components/admin-layout-shell";

export const dynamic = "force-dynamic";

type ProtectedAdminLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function ProtectedAdminLayout({
  children,
}: ProtectedAdminLayoutProps) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login" as never);
  }

  return (
    <AdminLayoutShell userEmail={user.email ?? "Admin"}>
      {children}
    </AdminLayoutShell>
  );
}
