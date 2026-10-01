import type { LucideIcon } from "lucide-react";

export function SummaryCard({
  label,
  value,
  icon: Icon,
  accent,
  onClick,
  active = false,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  accent: string;
  onClick?: () => void;
  active?: boolean;
}) {
  const body = (
    <>
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${accent}`}>
        <Icon size={15} />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <h2 className="mt-0.5 text-xl font-semibold tabular-nums tracking-tight text-slate-900">{value}</h2>
      </div>
    </>
  );

  const base =
    "flex min-h-[76px] w-full items-center gap-3 rounded-xl border bg-white p-3.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md";

  if (!onClick) {
    return <div className={`${base} border-slate-200`}>{body}</div>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`${base} cursor-pointer ${
        active
          ? "border-[#12331F] ring-2 ring-[#12331F]/15"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      {body}
    </button>
  );
}