import {
  Lock,
  CheckCircle2,
  Circle,
} from "lucide-react";

export type StatusPillState =
  | "locked"
  | "progress"
  | "done";

export function StatusPill({
  state,
}: {
  state: StatusPillState;
}) {
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