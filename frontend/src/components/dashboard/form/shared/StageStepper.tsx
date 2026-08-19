import {
  CheckCircle2,
  Lock,
} from "lucide-react";

import {
  STAGE_STYLES,
  type StageKey,
} from "./SectionHeader";

export type StageStepStatus = "done" | "current" | "locked";

export type StageStep = {
  key: StageKey;
  label: string;
  status: StageStepStatus;
};

export function StageStepper({
  steps,
  activeKey,
  onStepClick,
}: {
  steps: StageStep[];
  // Which step is the one currently being viewed/edited. Distinct from
  // "current" status (first not-yet-done step) — activeKey drives the
  // visual "you are here" ring, status still drives done/locked coloring.
  activeKey?: StageKey;
  // When provided, steps become clickable (used by the wizard). Locked
  // steps stay unclickable regardless.
  onStepClick?: (key: StageKey) => void;
}) {
  return (
    <div className="mb-2 overflow-x-auto">
      <div className="flex min-w-max items-center">
        {steps.map((step, index) => {
          const meta = STAGE_STYLES[step.key];
          const Icon = meta.icon;
          const isActive = activeKey === step.key;
          const clickable = !!onStepClick && step.status !== "locked";

          return (
            <div
              key={step.key}
              className="flex items-center"
            >
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onStepClick?.(step.key)}
                className={[
                  "flex items-center gap-2 rounded-lg px-1.5 py-1 transition",
                  clickable ? "cursor-pointer hover:bg-slate-50" : "cursor-default",
                  isActive ? "ring-1 ring-inset ring-slate-200 bg-slate-50/70" : "",
                ].join(" ")}
              >
                <div
                  className={[
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border",
                    step.status === "done"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                      : step.status === "current"
                        ? `${meta.ring} ${meta.chip}`
                        : "border-slate-200 bg-slate-50 text-slate-400",
                  ].join(" ")}
                >
                  {step.status === "done" ? (
                    <CheckCircle2 size={17} />
                  ) : step.status === "locked" ? (
                    <Lock size={15} />
                  ) : (
                    <Icon size={17} />
                  )}
                </div>

                <div className="flex flex-col items-start">
                  <span
                    className={[
                      "text-xs font-semibold",
                      step.status === "locked"
                        ? "text-slate-400"
                        : step.status === "done"
                          ? "text-emerald-600"
                          : meta.text,
                    ].join(" ")}
                  >
                    {step.label}
                  </span>

                  <span className="text-[10px] text-slate-400">
                    {step.status === "done"
                      ? "Complete"
                      : step.status === "current"
                        ? "In progress"
                        : "Locked"}
                  </span>
                </div>
              </button>

              {index < steps.length - 1 && (
                <div className="mx-2 h-px w-6 bg-slate-200 sm:w-10" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}