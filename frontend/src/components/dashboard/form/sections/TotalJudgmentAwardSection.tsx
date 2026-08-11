import { Landmark, Lock } from "lucide-react";

import type {
  CaseDraft,
  TotalPaidCategory,
} from "@/types/case";

import { Field } from "@/components/cases/Field";
import { inputCls } from "@/components/cases/CurrencyField";

import { formatCurrency } from "@/lib/caseHelpers";

export function TotalJudgmentAwardSection({
  value,
  totalJudgmentAward,
  anyStageSettled,
  setTotalPaidCategory,
}: {
  value: CaseDraft;
  totalJudgmentAward: string;
  anyStageSettled: boolean;
  setTotalPaidCategory: (
    category: TotalPaidCategory | ""
  ) => void;
}) {
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-sm sm:p-5">
      <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
        <Landmark size={13} />
        Total Judgment Award
      </h3>

      <div className="rounded-lg border border-emerald-200 bg-white px-3 py-2.5 text-lg font-semibold text-emerald-800 shadow-sm">
        {formatCurrency(totalJudgmentAward)}
      </div>

      <p className="mt-1.5 text-[11px] text-emerald-700/70">
        Reflects the latest stage&apos;s Judgment Award
        (SC, then CA, NLRC, LA) — not a sum of all stages.
      </p>

      <div className="mt-3 max-w-sm">
        <Field label="Category">
          <select
            className={inputCls}
            value={value.totalPaid.category}
            disabled={!anyStageSettled}
            onChange={(e) =>
              setTotalPaidCategory(
                e.target.value as TotalPaidCategory | ""
              )
            }
          >
            <option value="">Select Category</option>

            <option value="Judgment-Award-L">
              Judgment-Award-L
            </option>

            <option value="Judgment-Award-W">
              Judgment-Award-W
            </option>

            <option value="Settlement">
              Settlement
            </option>
          </select>
        </Field>

        {!anyStageSettled && (
          <p className="mt-1 flex items-center gap-1 text-[10px] text-emerald-700/60">
            <Lock size={10} />
            Enabled once a stage&apos;s Remarks/Progress is marked
            &quot;Settled&quot;.
          </p>
        )}
      </div>
    </div>
  );
}