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
    <div className="flex min-h-[76px] items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${accent}`}>
        <Icon size={15} />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-900">{value}</h2>
      </div>
    </div>
  );
}
