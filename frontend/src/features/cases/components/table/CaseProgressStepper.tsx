import type { CaseProgress, StageProgress } from "@/types/case";
import { PROGRESS_STAGES } from "@/constants/caseOptions";

function stageColor(stage: StageProgress) {
  if (stage === "Settled") return "bg-emerald-500 border-emerald-500";
  if (stage === "Others") return "bg-amber-400 border-amber-400";
  return "bg-white border-slate-300";
}

export function CaseProgressStepper({ progress }: { progress: CaseProgress }) {
  return (
    <div className="flex items-center" title="LA → NLRC → CA → SC">
      {PROGRESS_STAGES.map((stage, i) => (
        <div key={stage.key} className="flex items-center">
          <div className="group relative flex flex-col items-center">
            <span className={`h-2.5 w-2.5 rounded-full border-2 ${stageColor(progress[stage.key])}`} />
            <span className="mt-1 text-[10px] font-medium text-slate-500">{stage.label}</span>
          </div>
          {i < PROGRESS_STAGES.length - 1 && (
            <span
              className={`mx-1 mb-4 h-2px w-5 ${
                progress[stage.key] === "Settled" ? "bg-emerald-400" : "bg-slate-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}