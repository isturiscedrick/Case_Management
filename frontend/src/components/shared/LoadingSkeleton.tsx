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

/* ---------- Page-shaped skeletons (Analytics, Users) ---------- */

function SkeletonStatCard() {
  return (
    <div className="flex min-h-19 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
      <div className="skeleton h-9 w-9 shrink-0 rounded-lg" />
      <div className="space-y-2">
        <div className="skeleton h-3 w-16 rounded-md" />
        <div className="skeleton h-5 w-10 rounded-md" />
      </div>
    </div>
  );
}

function SkeletonStageCard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="skeleton h-8 w-8 rounded-lg" />
        <div className="space-y-1.5">
          <div className="skeleton h-3 w-24 rounded-md" />
          <div className="skeleton h-2.5 w-14 rounded-md" />
        </div>
      </div>
      <div className="skeleton mt-3 h-2 w-full rounded-full" />
      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="skeleton h-3 w-full rounded-md" />
        ))}
      </div>
    </div>
  );
}

// Mirrors the Analytics page: stat card, status cards, stage cards, award bars.
export function AnalyticsSkeleton() {
  return (
    <div role="status" aria-live="polite" className="min-h-0 flex-1 space-y-5 overflow-hidden">
      <span className="sr-only">Loading analytics</span>

      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:max-w-xs">
        <div className="skeleton h-10 w-10 rounded-lg" />
        <div className="space-y-2">
          <div className="skeleton h-3 w-24 rounded-md" />
          <div className="skeleton h-5 w-12 rounded-md" />
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2.5">
          <div className="skeleton h-8 w-8 rounded-lg" />
          <div className="space-y-1.5">
            <div className="skeleton h-3.5 w-40 rounded-md" />
            <div className="skeleton h-2.5 w-64 rounded-md" />
          </div>
        </div>

        <div className="mb-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonStatCard key={index} />
          ))}
        </div>

        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonStageCard key={index} />
          ))}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="skeleton h-3.5 w-32 shrink-0 rounded-md" />
              <div className="skeleton h-6 flex-1 rounded-md" />
              <div className="skeleton h-3.5 w-16 shrink-0 rounded-md" />
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="skeleton h-36 w-36 rounded-full" />
          <div className="skeleton h-3 w-32 rounded-md" />
        </div>
      </div>
    </div>
  );
}

// Mirrors the Users page: add-user form + notifications on the left,
// existing-users table on the right.
export function UsersSkeleton() {
  return (
    <div role="status" aria-live="polite" className="grid gap-4 lg:grid-cols-[minmax(300px,0.72fr)_minmax(0,1.5fr)]">
      <span className="sr-only">Loading user management</span>

      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="skeleton h-9 w-9 rounded-lg" />
            <div className="space-y-1.5">
              <div className="skeleton h-3.5 w-20 rounded-md" />
              <div className="skeleton h-2.5 w-48 rounded-md" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-1.5">
                <div className="skeleton h-3 w-20 rounded-md" />
                <div className="skeleton h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
            <div className="skeleton h-10 w-32 rounded-lg" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 space-y-1.5 border-b border-slate-100 pb-4">
            <div className="skeleton h-3.5 w-28 rounded-md" />
            <div className="skeleton h-2.5 w-44 rounded-md" />
          </div>
          <div className="skeleton h-10 w-full rounded-lg" />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 space-y-1.5 border-b border-slate-100 pb-4">
          <div className="skeleton h-3.5 w-32 rounded-md" />
          <div className="skeleton h-2.5 w-40 rounded-md" />
        </div>
        <div className="divide-y divide-slate-100">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 py-3">
              <div className="skeleton h-9 w-9 shrink-0 rounded-full" />
              <div className="skeleton h-3.5 w-32 rounded-md" />
              <div className="skeleton hidden h-3.5 w-24 rounded-md sm:block" />
              <div className="skeleton h-7 w-28 rounded-lg" />
              <div className="skeleton ml-auto h-3.5 w-20 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}