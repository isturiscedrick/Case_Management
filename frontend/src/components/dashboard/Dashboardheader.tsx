import { Plus, RefreshCw } from "lucide-react";

export function DashboardHeader({
  onCreate,
  onRefresh,
  isRefreshing = false,
}: {
  onCreate: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[#ded7c5] bg-white/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div>
        <h1 className="font-serif text-xl font-medium tracking-tight text-[#12331F] md:text-2xl">
          Case Management
        </h1>

        <p className="mt-0.5 text-xs text-slate-500">
          Track cases from Labor Arbiter through the Supreme Court.
        </p>
      </div>

      <div className="flex items-center gap-2">
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Refresh cases"
            title="Refresh cases"
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={15} className={isRefreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        )}

        <button
          onClick={onCreate}
          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-[#12331F] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#1B4A2C] hover:shadow-md"
        >
          <Plus size={15} />
          Create Case
        </button>
      </div>
    </div>
  );
}