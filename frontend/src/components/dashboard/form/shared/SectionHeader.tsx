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
    ring: "border-teal-200",
    chip: "bg-teal-50 text-teal-700",
    text: "text-teal-700",
    dot: "bg-teal-500",
  },
  la: {
    icon: Gavel,
    ring: "border-sky-200",
    chip: "bg-sky-50 text-sky-700",
    text: "text-sky-700",
    dot: "bg-sky-500",
  },
  nlrc: {
    icon: Building2,
    ring: "border-violet-200",
    chip: "bg-violet-50 text-violet-700",
    text: "text-violet-700",
    dot: "bg-violet-500",
  },
  ca: {
    icon: Landmark,
    ring: "border-fuchsia-200",
    chip: "bg-fuchsia-50 text-fuchsia-700",
    text: "text-fuchsia-700",
    dot: "bg-fuchsia-500",
  },
  sc: {
    icon: Scale,
    ring: "border-rose-200",
    chip: "bg-rose-50 text-rose-700",
    text: "text-rose-700",
    dot: "bg-rose-500",
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
}: {
  stage: StageKey;
  title: string;
  status?: StageStatus;
}) {
  const meta = STAGE_STYLES[stage];
  const Icon = meta.icon;

  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${meta.chip}`}
        >
          <Icon size={16} />
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