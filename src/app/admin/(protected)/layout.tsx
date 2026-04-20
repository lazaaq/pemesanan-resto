import Link from "next/link";
import { redirect } from "next/navigation";
import { signOutAdminAction } from "@/app/admin/actions";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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
    <div className="min-h-screen bg-[#f7f4ee] px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-[2rem] border border-border bg-white px-6 py-5 shadow-[0_24px_80px_rgba(80,44,16,0.12)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="font-mono text-xs uppercase tracking-[0.32em] text-primary">
                admin dashboard
              </p>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                  Kelola Menu Restoran
                </h1>
                <p className="mt-1 text-sm leading-7 text-muted">
                  Login sebagai <span className="font-medium">{user.email}</span> untuk
                  mengelola kategori, makanan, dan minuman.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/"
                className="rounded-full border border-border bg-[#fffaf3] px-4 py-2 text-sm font-medium text-foreground"
              >
                Lihat halaman user
              </Link>
              <form action={signOutAdminAction}>
                <button
                  type="submit"
                  className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
                >
                  Keluar
                </button>
              </form>
            </div>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
