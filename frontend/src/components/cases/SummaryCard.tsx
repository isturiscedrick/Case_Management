import type { LucideIcon } from "lucide-react";

export function SummaryCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:shadow-md">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${accent}`}>
        <Icon size={15} />
      </div>
      <div>
        <p className="text-[11px] text-slate-500">{label}</p>
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">{value}</h2>
      </div>
    </div>
  );
}