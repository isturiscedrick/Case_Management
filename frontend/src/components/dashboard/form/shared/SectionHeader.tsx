import {
  Handshake,
  Gavel,
  Building2,
  Landmark,
  Scale,
  Lock,
  CheckCircle2,
  Circle,
} from "lucide-react";

export const STAGE_STYLES = {
  sena: {
    icon: Handshake,
    ring: "border-yellow-200",
    chip: "bg-yellow-50 text-yellow-700",
    bar: "bg-yellow-50/60",
    text: "text-yellow-700",
    dot: "bg-yellow-500",
  },
  la: {
    icon: Gavel,
    ring: "border-sky-200",
    chip: "bg-sky-50 text-sky-700",
    bar: "bg-sky-50/60",
    text: "text-sky-700",
    dot: "bg-sky-500",
  },
  nlrc: {
    icon: Building2,
    ring: "border-violet-200",
    chip: "bg-violet-50 text-violet-700",
    bar: "bg-violet-50/60",
    text: "text-violet-700",
    dot: "bg-violet-500",
  },
  ca: {
    icon: Landmark,
    ring: "border-green-200",
    chip: "bg-green-50 text-green-700",
    bar: "bg-green-50/60",
    text: "text-green-700",
    dot: "bg-green-500",
  },
  sc: {
    icon: Scale,
    ring: "border-pink-200",
    chip: "bg-pink-50 text-pink-700",
    bar: "bg-pink-50/60",
    text: "text-pink-700",
    dot: "bg-pink-500",
  },
} as const;

export type StageKey = keyof typeof STAGE_STYLES;

export type StageStatus = "locked" | "progress" | "done";

function StatusPill({ state }: { state: StageStatus }) {
  if (state === "locked") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-400">
        <Lock size={11} />
        Locked
      </span>
    );
  }

  if (state === "done") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
        <CheckCircle2 size={11} />
        Complete
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-600">
      <Circle size={11} />
      In progress
    </span>
  );
}

export function SectionHeader({
  stage,
  title,
  status,
  size = 8,
}: {
  stage: StageKey;
  title: string;
  status?: StageStatus;
  size?: 7 | 8;
}) {
  const meta = STAGE_STYLES[stage];
  const Icon = meta.icon;
  const boxCls = size === 7 ? "h-7 w-7" : "h-8 w-8";
  const iconSize = size === 7 ? 14 : 16;

  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <div
          className={`flex ${boxCls} items-center justify-center rounded-lg ${meta.chip}`}
        >
          <Icon size={iconSize} />
        </div>

        <h3
          className={`text-xs font-semibold uppercase tracking-wide ${meta.text}`}
        >
          {title}
        </h3>
      </div>

      {status && <StatusPill state={status} />}
    </div>
  );
}