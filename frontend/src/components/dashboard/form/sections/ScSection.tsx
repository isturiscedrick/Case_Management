import type {
  CaseDraft,
  ScInfo,
  StageProgress,
  TotalPaidCategory,
} from "@/types/case";

import {
  PROGRESS_OPTIONS,
  APPEAL_STAGE_REMARKS_OPTIONS,
  STAGE_STATUS_OPTIONS,
} from "@/constants/caseOptions";

import { Field } from "@/components/cases/Field";
import {
  inputCls,
  JudgmentAwardField,
} from "@/components/cases/CurrencyField";
import { InfoBanner } from "@/components/dashboard/form/shared/InfoBanner";
import { SectionHeader, STAGE_STYLES } from "@/components/dashboard/form/shared/SectionHeader";

type ScSectionProps = {
  value: CaseDraft;
  onChange: (next: CaseDraft) => void;

  setSc: <K extends keyof ScInfo>(
    key: K,
    value: ScInfo[K]
  ) => void;

  setProgress: (
    key: "la" | "nlrc" | "ca" | "sc",
    value: StageProgress
  ) => void;

  setProgressSpecification: (
    key: "la" | "nlrc" | "ca" | "sc",
    value: string
  ) => void;

  setTotalPaidCategory: (
    category: TotalPaidCategory | ""
  ) => void;

  senaFilled: boolean;
  caEnabled: boolean;
  caFilled: boolean;
  scEnabled: boolean;
  scVisible: boolean;
};

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
}: ScSectionProps) {
  return (
    <div
      className={`rounded-xl border ${STAGE_STYLES.sc.ring} bg-white p-4 shadow-sm sm:p-5`}
    >
      <SectionHeader
        stage="sc"
        title="Supreme Court (SC)"
        status={!scVisible ? "locked" : "progress"}
      />

      {/* SC DISABLED */}
      {senaFilled && !caEnabled && (
        <InfoBanner tone="info">
          Disabled while CA Progress is "Select Progress" or "Settled".
        </InfoBanner>
      )}

      {senaFilled && caEnabled && !caFilled && (
        <InfoBanner tone="info">
          Complete the required CA fields above (Date, Status, Judgment
          Award) to unlock this section.
        </InfoBanner>
      )}

      {senaFilled && caEnabled && caFilled && !scEnabled && (
        <InfoBanner tone="info">
          CA Progress must be "Not Settled" or "Others" to unlock
          SC. The case is considered resolved if settled at CA.
        </InfoBanner>
      )}

      {/* ================================================ */}
      {/* SC DETAILS */}
      {/* ================================================ */}

      {scVisible && (
        <>
          <div className="grid gap-4">
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
                <option value="">
                  Select Status
                </option>

                {STAGE_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </Field>

            <JudgmentAwardField
              label="Judgment Award"
              value={value.sc.judgmentAward}
              onChange={(v) =>
                setSc("judgmentAward", v)
              }
              amountSpecValue={
                value.sc.judgmentAwardSpecification
              }
              onAmountSpecChange={(v) =>
                setSc(
                  "judgmentAwardSpecification",
                  v
                )
              }
              computedSpecValue={
                value.sc.judgmentAwardComputedSpecification
              }
              onComputedSpecChange={(v) =>
                setSc(
                  "judgmentAwardComputedSpecification",
                  v
                )
              }
            />

            {/* ================================================= */}
            {/* SC REMARKS */}
            {/* ================================================= */}

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
                              .remarksSpecification ??
                            ""
                          : "",
                    },
                  });
                }}
              >
                <option value="">
                  Select Remarks
                </option>

                {APPEAL_STAGE_REMARKS_OPTIONS.map(
                  (option) => (
                    <option
                      key={option}
                      value={option}
                    >
                      {option}
                    </option>
                  )
                )}
              </select>
            </Field>
          </div>

          {/* ================================================ */}
          {/* SPECIFY SC REMARKS */}
          {/* ================================================ */}

          {value.sc.remarks === "Other" && (
            <div className="mt-4 grid gap-4">
              <Field label="Specify Remarks">
                <textarea
                  rows={3}
                  className={inputCls}
                  placeholder="Enter remarks"
                  value={
                    value.sc.remarksSpecification ??
                    ""
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
        </>
      )}

      {/* ================================================ */}
      {/* SC PROGRESS */}
      {/* ================================================ */}

      {scVisible && (
        <div className="mt-4">
          <Field label="SC Progress">
            <select
              className={inputCls}
              value={value.caseProgress.sc}
              onChange={(e) => {
                const selected =
                  e.target.value as StageProgress;

                setProgress("sc", selected);
              }}
            >
              <option value="">
                Select Progress
              </option>

              {PROGRESS_OPTIONS.filter(
                (p): p is StageProgress =>
                  p !== "All"
              ).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>
        </div>
      )}

      {/* ================================================ */}
      {/* SPECIFY SC PROGRESS */}
      {/* ================================================ */}

      {scVisible &&
        (value.caseProgress.sc === "Others" ||
          value.caseProgress.sc === "Not Settled") && (
          <div className="mt-4 grid gap-4">
            <Field label="Specify SC Progress">
              <textarea
                rows={3}
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
    </div>
  );
}