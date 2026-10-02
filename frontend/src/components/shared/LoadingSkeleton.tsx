const DEFAULT_ROWS = 9;

// Same placeholder row the Dashboard and My Cases pages use.
function SkeletonRows({ count = DEFAULT_ROWS }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 p-3">
          <div className="skeleton h-3.5 w-10 rounded-md" />
          <div className="skeleton h-6 w-24 rounded-full" />
          <div className="skeleton h-3.5 w-20 rounded-md" />
          <div className="skeleton h-3.5 w-48 rounded-md" />
          <div className="skeleton hidden h-3.5 flex-1 rounded-md sm:block" />
          <div className="skeleton hidden h-3.5 w-28 rounded-md md:block" />
        </div>
      ))}
    </>
  );
}

// Full card (header strip + rows). Identical to the Dashboard loading state.
export function TableSkeleton({ label, rows = DEFAULT_ROWS }: { label: string; rows?: number }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <span className="sr-only">{label}</span>

      <div className="border-b border-slate-200 bg-slate-50 p-3">
        <div className="skeleton h-3 w-40 rounded-md" />
      </div>

      <div className="min-h-0 flex-1 divide-y divide-slate-100 overflow-hidden">
        <SkeletonRows count={rows} />
      </div>
    </div>
  );
}

// Rows only, for pages that already render their own card around the list.
export function InlineSkeleton({ label, rows = DEFAULT_ROWS }: { label: string; rows?: number }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-0 flex-1 divide-y divide-slate-100 overflow-hidden"
    >
      <span className="sr-only">{label}</span>
      <SkeletonRows count={rows} />
    </div>
  );
}