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
}: {
  steps: StageStep[];
}) {
  return (
    <div className="mb-6 overflow-x-auto">
      <div className="flex min-w-max items-center">
        {steps.map((step, index) => {
          const meta = STAGE_STYLES[step.key];
          const Icon = meta.icon;

          return (
            <div
              key={step.key}
              className="flex items-center"
            >
              <div className="flex items-center gap-2">
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

                <div className="flex flex-col">
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
              </div>

              {index < steps.length - 1 && (
                <div className="mx-3 h-px w-8 bg-slate-200 sm:w-12" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}