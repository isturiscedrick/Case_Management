import { BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="h-full min-w-0 space-y-4 overflow-y-auto bg-[#F7F5F0] p-4">
      <div>
        <h1 className="font-serif text-lg font-medium tracking-tight text-[#0B1D3A] md:text-xl">
          Analytics
        </h1>
        <p className="mt-0.5 text-xs text-slate-500">
          Trends and insights across all cases.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-16 text-center shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0B1D3A]/5">
          <BarChart3 className="h-5 w-5 text-[#0B1D3A]/40" />
        </div>
        <p className="mt-4 text-sm font-medium text-slate-700">Analytics coming soon</p>
        <p className="mt-1 max-w-xs text-xs text-slate-400">
          Case volume, resolution time, and outcome breakdowns will appear here.
        </p>
      </div>
    </div>
  );
}