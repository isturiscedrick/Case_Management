import { Plus } from "lucide-react";

export function DashboardHeader({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="font-serif text-lg font-medium tracking-tight text-[#12331F] md:text-xl">
          Case Management
        </h1>

        <p className="mt-0.5 text-xs text-slate-500">
          Track cases from Labor Arbiter through the Supreme Court.
        </p>
      </div>

      <button
        onClick={onCreate}
        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#12331F] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1B4A2C]"
      >
        <Plus size={15} />
        Create Case
      </button>
    </div>
  );
}