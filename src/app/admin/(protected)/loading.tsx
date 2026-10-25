export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Page header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-32 rounded bg-slate-200" />
          <div className="h-4 w-48 rounded bg-slate-200" />
        </div>
        <div className="h-9 w-28 rounded-lg bg-slate-200" />
      </div>

      {/* Stats cards skeleton (for dashboard) */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-xl border bg-slate-50" />
        ))}
      </div>

      {/* Table/list skeleton */}
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-lg border p-4">
            <div className="h-12 w-12 rounded-lg bg-slate-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 rounded bg-slate-200" />
              <div className="h-3 w-1/2 rounded bg-slate-200" />
            </div>
            <div className="h-8 w-20 rounded bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
