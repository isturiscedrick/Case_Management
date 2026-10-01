import { AlertCircle, CheckCircle2, Landmark, Lock } from "lucide-react";

import { STAGE_STYLES, type StageKey } from "./SectionHeader";

// "review" is the final Total Judgment Award step; it isn't a case stage, so
// it has no entry in STAGE_STYLES and gets its own (emerald) meta below.
export type StageStepKey = StageKey | "review";

export type StageStepStatus = "done" | "current" | "locked";

export type StageStep = {
  key: StageStepKey;
  label: string;
  status: StageStepStatus;
  // True when this step has inline validation errors (shown after a failed save).
  hasError?: boolean;
};

const REVIEW_META = {
  icon: Landmark,
  ring: "border-emerald-200",
  chip: "bg-emerald-50 text-emerald-700",
  text: "text-emerald-700",
};

export function StageStepper({
  steps,
  activeKey,
  onStepClick,
}: {
  steps: StageStep[];
  // Which step is currently being viewed/edited. Drives the "you are here"
  // highlight and the "Step X of N" caption; status still drives done/locked.
  activeKey?: StageStepKey;
  // When provided, steps become clickable (used by the wizard). Locked
  // steps stay unclickable regardless.
  onStepClick?: (key: StageStepKey) => void;
}) {
  const activeIndex = steps.findIndex((step) => step.key === activeKey);

  return (
    <div className="mb-2">
      {activeIndex >= 0 && (
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
          Step {activeIndex + 1} of {steps.length} · {steps[activeIndex].label}
        </p>
      )}

      <div className="overflow-x-auto" role="group" aria-label="Case stages">
        <div className="flex min-w-max items-center">
          {steps.map((step, index) => {
            const meta = step.key === "review" ? REVIEW_META : STAGE_STYLES[step.key];
            const Icon = meta.icon;
            const isActive = activeKey === step.key;
            const clickable = !!onStepClick && step.status !== "locked";

            const circleCls = step.hasError
              ? "border-rose-300 bg-rose-50 text-rose-600"
              : step.status === "done"
                ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                : step.status === "current"
                  ? `${meta.ring} ${meta.chip}`
                  : "border-slate-200 bg-slate-50 text-slate-400";

            const labelCls = step.hasError
              ? "text-rose-600"
              : step.status === "locked"
                ? "text-slate-400"
                : step.status === "done"
                  ? "text-emerald-600"
                  : meta.text;

            const subtitle = step.hasError
              ? "Needs attention"
              : step.status === "done"
                ? "Complete"
                : step.status === "current"
                  ? isActive
                    ? "You are here"
                    : "In progress"
                  : "Locked";

            return (
              <div key={step.key} className="flex items-center">
                <button
                  type="button"
                  disabled={!clickable}
                  aria-current={isActive ? "step" : undefined}
                  onClick={() => clickable && onStepClick?.(step.key)}
                  className={[
                    "flex items-center gap-2 rounded-lg px-1.5 py-1 transition",
                    clickable ? "cursor-pointer hover:bg-slate-50" : "cursor-default",
                    isActive ? "bg-white shadow-sm ring-2 ring-inset ring-[#B08D57]/60" : "",
                  ].join(" ")}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${circleCls}`}
                  >
                    {step.hasError ? (
                      <AlertCircle size={17} />
                    ) : step.status === "done" ? (
                      <CheckCircle2 size={17} />
                    ) : step.status === "locked" ? (
                      <Lock size={15} />
                    ) : (
                      <Icon size={17} />
                    )}
                  </div>

                  <div className="flex flex-col items-start">
                    <span className={`text-xs ${isActive ? "font-bold" : "font-semibold"} ${labelCls}`}>
                      {step.label}
                    </span>

                    <span
                      className={`text-[10px] ${step.hasError ? "font-medium text-rose-500" : "text-slate-400"}`}
                    >
                      {subtitle}
                    </span>
                  </div>
                </button>

                {index < steps.length - 1 && (
                  <div
                    className={`mx-2 h-0.5 w-6 rounded-full sm:w-10 ${
                      step.status === "done" && !step.hasError ? "bg-emerald-300" : "bg-slate-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}