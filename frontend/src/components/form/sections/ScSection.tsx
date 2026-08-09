import type {
  CaseDraft,
  ScInfo,
  StageProgress,
  TotalPaidCategory,
} from "@/types/case";

import {
  PROGRESS_OPTIONS,
  STAGE_REMARKS_OPTIONS,
  STAGE_STATUS_OPTIONS,
} from "@/constants/caseOptions";

import { Field } from "@/components/cases/Field";

import {
  JudgementRewardField,
  inputCls,
} from "@/components/cases/CurrencyField";

import { InfoBanner } from "@/components/form/shared/InfoBanner";

import {
  SectionHeader,
  STAGE_STYLES,
} from "@/components/form/shared/SectionHeader";

export function ScSection({
  value,
  onChange,
  setSc,
  setProgress,
  setProgressSpecification,
  setTotalPaidCategory,
  senaFilled,
  caEnabled,
  caFilled,
  scEnabled,
  scVisible,
}: {
  value: CaseDraft;
  onChange: (next: CaseDraft) => void;
  setSc: <K extends keyof ScInfo>(
    key: K,
    v: ScInfo[K]
  ) => void;
  setProgress: (
    key: "la" | "nlrc" | "ca" | "sc",
    v: StageProgress
  ) => void;
  setProgressSpecification: (
    key: "la" | "nlrc" | "ca" | "sc",
    v: string
  ) => void;
  setTotalPaidCategory: (
    category: TotalPaidCategory | ""
  ) => void;
  senaFilled: boolean;
  caEnabled: boolean;
  caFilled: boolean;
  scEnabled: boolean;
  scVisible: boolean;
}) {
  return (
    <div
      className={`rounded-xl border ${STAGE_STYLES.sc.ring} bg-white p-4 shadow-sm sm:p-5`}
    >
      <SectionHeader
        stage="sc"
        title="Supreme Court (SC)"
        status={!scVisible ? "locked" : "progress"}
      />

      {senaFilled && !caEnabled && (
        <InfoBanner tone="info">
          Disabled while CA Progress is "Select Progress" or "Settled".
        </InfoBanner>
      )}

      {senaFilled && caEnabled && !caFilled && (
        <InfoBanner tone="info">
          Complete all CA fields above (Date, Status, Judgement
          Award, Remarks) to unlock this section.
        </InfoBanner>
      )}

      {senaFilled && caEnabled && caFilled && !scEnabled && (
        <InfoBanner tone="info">
          CA Progress must be "Not Settled" or "Others" to unlock
          SC. The case is considered resolved if settled at CA.
        </InfoBanner>
      )}

      {scVisible && (
        <>
          <div className="grid gap-4 sm:grid-cols-5">
            <Field label="Date">
              <input
                type="date"
                className={inputCls}
                value={value.sc.date}
                onChange={(e) =>
                  setSc("date", e.target.value)
                }
              />
            </Field>

            <Field label="Status">
              <select
                className={inputCls}
                value={value.sc.status}
                onChange={(e) =>
                  setSc("status", e.target.value)
                }
              >
                <option value="">Select Status</option>

                {STAGE_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </Field>

            <JudgementRewardField
              label="Judgement Award"
              value={value.sc.judgementReward}
              onChange={(v) =>
                setSc("judgementReward", v)
              }
              amountSpecValue={
                value.sc.judgementRewardSpecification
              }
              onAmountSpecChange={(v) =>
                setSc(
                  "judgementRewardSpecification",
                  v
                )
              }
              computedSpecValue={
                value.sc
                  .judgementRewardComputedSpecification
              }
              onComputedSpecChange={(v) =>
                setSc(
                  "judgementRewardComputedSpecification",
                  v
                )
              }
            />

            <Field label="Remarks">
              <select
                className={inputCls}
                value={value.sc.remarks}
                onChange={(e) => {
                  const selected = e.target.value;

                  onChange({
                    ...value,

                    sc: {
                      ...value.sc,
                      remarks: selected,

                      remarksSpecification:
                        selected === "Other"
                          ? value.sc
                              .remarksSpecification ?? ""
                          : "",
                    },
                  });
                }}
              >
                <option value="">Select Remarks</option>

                {STAGE_REMARKS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Progress">
              <select
                className={inputCls}
                value={value.caseProgress.sc}
                onChange={(e) => {
                  const selected =
                    e.target.value as StageProgress;

                  const shouldResetCategory =
                    selected === "Not Settled" ||
                    selected === "Others";

                  setProgress("sc", selected);

                  if (shouldResetCategory) {
                    setTotalPaidCategory("");
                  }
                }}
              >
                <option value="">
                  Select Progress
                </option>

                {PROGRESS_OPTIONS.filter(
                  (
                    p
                  ): p is StageProgress => p !== "All"
                ).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {value.sc.remarks === "Other" && (
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              <Field label="Specify Remarks">
                <input
                  className={inputCls}
                  placeholder="Enter remarks"
                  value={
                    value.sc.remarksSpecification ?? ""
                  }
                  onChange={(e) =>
                    setSc(
                      "remarksSpecification",
                      e.target.value
                    )
                  }
                />
              </Field>
            </div>
          )}

          {(
            value.caseProgress.sc === "Others" ||
            value.caseProgress.sc === "Not Settled"
          ) && (
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              <Field label="Specify SC Progress">
                <input
                  className={inputCls}
                  placeholder="Enter progress"
                  value={
                    value.caseProgress
                      .scSpecification ?? ""
                  }
                  onChange={(e) =>
                    setProgressSpecification(
                      "sc",
                      e.target.value
                    )
                  }
                />
              </Field>
            </div>
          )}
        </>
      )}
    </div>
  );
}