import type {
  CaseDraft,
  LaInfo,
  StageProgress,
} from "@/types/case";

import {
  PROGRESS_OPTIONS,
  STAGE_REMARKS_OPTIONS,
  STAGE_STATUS_OPTIONS,
} from "@/constants/caseOptions";

import { Field } from "@/components/cases/Field";
import {
  inputCls,
  JudgmentAwardField,
} from "@/components/cases/CurrencyField";
import { InfoBanner } from "@/components/dashboard/form/shared/InfoBanner";
import { SectionHeader, STAGE_STYLES } from "@/components/dashboard/form/shared/SectionHeader";

type LaSectionProps = {
  value: CaseDraft;
  onChange: (next: CaseDraft) => void;

  setLa: <K extends keyof LaInfo>(
    key: K,
    value: LaInfo[K]
  ) => void;

  setProgressSpecification: (
    key: "la" | "nlrc" | "ca" | "sc",
    value: string
  ) => void;

  senaFilled: boolean;
  laRequired: boolean;
  laFilled: boolean;
  laVisible: boolean;

  restrictLaDetailsEditing: boolean;
  restrictLaProgressOnly: boolean;
  restrictLaProgressEditing: boolean;
};

export function LaSection({
  value,
  onChange,
  setLa,
  setProgressSpecification,
  senaFilled,
  laRequired,
  laFilled,
  laVisible,
  restrictLaDetailsEditing,
  restrictLaProgressOnly,
  restrictLaProgressEditing,
}: LaSectionProps) {
  return (
    <div
      className={`rounded-xl border ${STAGE_STYLES.la.ring} bg-white p-4 shadow-sm sm:p-5`}
    >
      <SectionHeader
        stage="la"
        title="Labor Arbiter (LA)"
        status={
          !laVisible
            ? "locked"
            : laFilled
              ? "done"
              : "progress"
        }
      />

      {/* LA REQUIRED WARNING */}
      {senaFilled && laRequired && !laFilled && (
        <InfoBanner tone="warning">
          SEnA Remarks is "Not Settled" or "Others" — LA fields
          (Date, Status, Judgment Award, Remarks) are now required
          to create the case. LA Progress is optional.
        </InfoBanner>
      )}

      {/* LA DISABLED */}
      {senaFilled && !laRequired && (
        <InfoBanner tone="info">
          Disabled while SEnA Remarks is "Select Remarks" or
          "Settled", or while Specify Remarks is empty for
          "Not Settled"/"Others".
        </InfoBanner>
      )}

      {/* LA DETAILS LOCKED */}
      {restrictLaProgressOnly && (
        <InfoBanner tone="warning">
          LA details are saved and locked. Update LA Progress only,
          then save to continue the case workflow.
        </InfoBanner>
      )}

      {laVisible && (
        <>

          <div className="grid gap-4 sm:grid-cols-4">
            <fieldset
              disabled={restrictLaDetailsEditing}
              className="contents"
            >
              <Field label="Date">
                <input
                  type="date"
                  className={inputCls}
                  value={value.la.date}
                  onChange={(e) =>
                    setLa("date", e.target.value)
                  }
                />
              </Field>

              <Field label="Status">
                <select
                  className={inputCls}
                  value={value.la.status}
                  onChange={(e) =>
                    setLa("status", e.target.value)
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
            </fieldset>

            <JudgmentAwardField
              label="Judgment Reward"
              value={value.la.judgmentAward}
              onChange={(v) =>
                setLa("judgmentAward", v)
              }
              amountSpecValue={
                value.la.judgmentAwardSpecification
              }
              onAmountSpecChange={(v) =>
                setLa(
                  "judgmentAwardSpecification",
                  v
                )
              }
              computedSpecValue={
                value.la.judgmentAwardComputedSpecification
              }
              onComputedSpecChange={(v) =>
                setLa(
                  "judgmentAwardComputedSpecification",
                  v
                )
              }
            />

            {/* ================================================= */}
            {/* LA REMARKS */}
            {/* ================================================= */}

            <fieldset
              disabled={restrictLaDetailsEditing}
              className="contents"
            >
              <Field label="Remarks">
                <select
                  className={inputCls}
                  value={value.la.remarks}
                  onChange={(e) => {
                    const selected = e.target.value;

                    onChange({
                      ...value,

                      la: {
                        ...value.la,
                        remarks: selected,

                        remarksSpecification:
                          selected === "Other"
                            ? value.la
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

                  {STAGE_REMARKS_OPTIONS.map(
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
            </fieldset>
          </div>

          {/* ================================================ */}
          {/* SPECIFY LA REMARKS */}
          {/* ================================================ */}

          {value.la.remarks === "Other" && (
            <fieldset
              disabled={restrictLaDetailsEditing}
              className="contents"
            >
              <div className="mt-3 grid gap-4 sm:grid-cols-3">
                <Field label="Specify Remarks">
                  <input
                    className={inputCls}
                    placeholder="Enter remarks"
                    value={
                      value.la
                        .remarksSpecification ??
                      ""
                    }
                    onChange={(e) =>
                      setLa(
                        "remarksSpecification",
                        e.target.value
                      )
                    }
                  />
                </Field>
              </div>
            </fieldset>
          )}
        </>
      )}

      {/* ================================================ */}
      {/* LA PROGRESS */}
      {/* ================================================ */}

      {laVisible && (
        <div className="mt-3">
          <Field label="LA Progress">
            <select
              className={inputCls}
              value={value.caseProgress.la}
              disabled={restrictLaProgressEditing}
              onChange={(e) => {
                const selected =
                  e.target.value as StageProgress;

                /*
                 * Check whether NLRC already contains
                 * any information.
                 */
                const nlrcHasData =
                  !!value.nlrc.date ||
                  !!value.nlrc.status ||
                  !!value.nlrc.judgmentAward ||
                  !!value.nlrc
                    .judgmentAwardSpecification ||
                  !!value.nlrc
                    .judgmentAwardComputedSpecification ||
                  !!value.nlrc.remarks ||
                  !!value.nlrc
                    .remarksSpecification ||
                  !!value.caseProgress.nlrc ||
                  !!value.caseProgress
                    .nlrcSpecification;

                /*
                 * If LA moves away from a
                 * "Not Settled"/"Others" state,
                 * clear NLRC.
                 */
                const shouldResetNlrc =
                  nlrcHasData &&
                  selected !== "Not Settled" &&
                  selected !== "Others";

                /*
                 * Clear Total Paid category if
                 * LA is Not Settled/Others.
                 */
                const shouldResetCategory =
                  selected === "Not Settled" ||
                  selected === "Others";

                onChange({
                  ...value,

                  caseProgress: {
                    ...value.caseProgress,

                    la: selected,

                    ...(selected === "Others" ||
                    selected === "Not Settled"
                      ? {}
                      : {
                          laSpecification: "",
                        }),

                    ...(shouldResetNlrc
                      ? {
                          nlrc: "",
                          nlrcSpecification: "",
                        }
                      : {}),
                  },

                  ...(shouldResetNlrc
                    ? {
                        nlrc: {
                          ...value.nlrc,
                          date: "",
                          status: "",
                          judgmentAward: "",
                          judgmentAwardSpecification:
                            "",
                          judgmentAwardComputedSpecification:
                            "",
                          remarks: "",
                          remarksSpecification: "",
                        },
                      }
                    : {}),

                  ...(shouldResetCategory
                    ? {
                        totalPaid: {
                          ...value.totalPaid,
                          category: "",
                        },
                      }
                    : {}),
                });
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
      {/* SPECIFY LA PROGRESS */}
      {/* ================================================ */}

      {laVisible &&
        (value.caseProgress.la === "Others" ||
          value.caseProgress.la === "Not Settled") && (
          <fieldset
            disabled={restrictLaProgressEditing}
            className="contents"
          >
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              <Field label="Specify LA Progress">
                <input
                  className={inputCls}
                  placeholder="Enter progress"
                  value={
                    value.caseProgress
                      .laSpecification ?? ""
                  }
                  onChange={(e) =>
                    setProgressSpecification(
                      "la",
                      e.target.value
                    )
                  }
                />
              </Field>
            </div>
          </fieldset>
        )}
    </div>
  );
}