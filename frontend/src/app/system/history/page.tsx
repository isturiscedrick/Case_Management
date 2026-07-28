import { History } from "lucide-react";

export default function HistoryPage() {
  return (
    <div className="h-full min-w-0 space-y-4 overflow-y-auto bg-[#F7F5F0] p-4">
      <div>
        <h1 className="font-serif text-lg font-medium tracking-tight text-[#0B1D3A] md:text-xl">
          History
        </h1>
        <p className="mt-0.5 text-xs text-slate-500">
          A record of changes made across all cases.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-16 text-center shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0B1D3A]/5">
          <History className="h-5 w-5 text-[#0B1D3A]/40" />
        </div>
        <p className="mt-4 text-sm font-medium text-slate-700">History coming soon</p>
        <p className="mt-1 max-w-xs text-xs text-slate-400">
          This page will track updates, edits, and status changes over time.
        </p>
      </div>
    </div>
  );
}