import Link from "next/link";
import { signInAdminAction } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

type AdminLoginPageProps = {
  searchParams: Promise<{
    error?: string;
    redirectedFrom?: string;
  }>;
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = await searchParams;

  return (
    <div className="min-h-screen bg-[#f7f4ee] px-4 py-8 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md items-center">
        <div className="w-full rounded-[2rem] border border-border bg-white p-6 shadow-[0_24px_80px_rgba(80,44,16,0.12)] sm:p-8">
          <div className="space-y-3">
            <p className="font-mono text-xs uppercase tracking-[0.32em] text-primary">
              admin access
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Login Dashboard
            </h1>
            <p className="text-sm leading-7 text-muted">
              Masuk menggunakan akun Supabase Auth untuk mengelola kategori serta menu
              makanan dan minuman.
            </p>
          </div>

          {params.error ? (
            <div className="mt-5 rounded-2xl border border-[#f1c3b6] bg-[#fff1ec] px-4 py-3 text-sm text-primary">
              {params.error}
            </div>
          ) : null}

          {params.redirectedFrom ? (
            <div className="mt-4 rounded-2xl border border-border bg-[#faf6ef] px-4 py-3 text-sm text-muted">
              Anda perlu login untuk membuka <span className="font-medium">{params.redirectedFrom}</span>.
            </div>
          ) : null}

          <form action={signInAdminAction} className="mt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full rounded-2xl border border-border bg-[#fffaf3] px-4 py-3 text-sm text-foreground outline-none ring-0 placeholder:text-muted focus:border-primary"
                placeholder="admin@restoflow.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full rounded-2xl border border-border bg-[#fffaf3] px-4 py-3 text-sm text-foreground outline-none ring-0 placeholder:text-muted focus:border-primary"
                placeholder="Masukkan password"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white"
            >
              Masuk ke Dashboard
            </button>
          </form>

          <div className="mt-6 text-sm text-muted">
            <p>Belum punya user admin?</p>
            <p className="mt-1 leading-7">
              Buat user di Supabase Auth lalu login di halaman ini.
            </p>
          </div>

          <div className="mt-8 border-t border-border pt-5">
            <Link href="/" className="text-sm font-medium text-secondary">
              Kembali ke halaman pemesanan
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
