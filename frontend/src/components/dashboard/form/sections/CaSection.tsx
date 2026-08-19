import type {
  CaseDraft,
  CaInfo,
  StageProgress,
} from "@/types/case";

import {
  PROGRESS_OPTIONS,
  STAGE_REMARKS_OPTIONS,
  STAGE_STATUS_OPTIONS,
} from "@/constants/caseOptions";

import { Field } from "@/components/cases/Field";
import {
  JudgmentAwardField,
  inputCls,
} from "@/components/cases/CurrencyField";
import { InfoBanner } from "@/components/dashboard/form/shared/InfoBanner";
import { SectionHeader, STAGE_STYLES } from "@/components/dashboard/form/shared/SectionHeader";

export function CaSection({
  value,
  onChange,
  setCa,
  setProgressSpecification,
  senaFilled,
  nlrcEnabled,
  nlrcFilled,
  caEnabled,
  caFilled,
  caVisible,
  restrictCaDetailsEditing,
  restrictCaProgressOnly,
  restrictCaProgressEditing,
}: {
  value: CaseDraft;
  onChange: (next: CaseDraft) => void;
  setCa: <K extends keyof CaInfo>(
    key: K,
    v: CaInfo[K],
  ) => void;
  setProgressSpecification: (
    key: "la" | "nlrc" | "ca" | "sc",
    v: string,
  ) => void;
  senaFilled: boolean;
  nlrcEnabled: boolean;
  nlrcFilled: boolean;
  caEnabled: boolean;
  caFilled: boolean;
  caVisible: boolean;
  restrictCaDetailsEditing: boolean;
  restrictCaProgressOnly: boolean;
  restrictCaProgressEditing: boolean;
}) {
  return (
    <div
      className={`rounded-xl border ${STAGE_STYLES.ca.ring} bg-white p-4 shadow-sm sm:p-5`}
    >
      <SectionHeader
        stage="ca"
        title="Court of Appeals (CA)"
        status={
          !caVisible
            ? "locked"
            : caFilled
            ? "done"
            : "progress"
        }
      />

      {/* -----------------------------------------------------------
          INFORMATION BANNERS
         ----------------------------------------------------------- */}

      {senaFilled && !nlrcEnabled && (
        <InfoBanner tone="info">
          Disabled while NLRC Progress is "Select Progress"
          or "Settled".
        </InfoBanner>
      )}

     {senaFilled &&
        nlrcEnabled &&
        !nlrcFilled && (
          <InfoBanner tone="info">
            Complete the required NLRC fields above (Date, Status,
            Judgment Award) to unlock this
            section.
          </InfoBanner>
        )}

      {senaFilled &&
        nlrcEnabled &&
        nlrcFilled &&
        !caEnabled && (
          <InfoBanner tone="info">
            NLRC Progress must be "Not Settled" or "Others"
            to unlock CA. The case is considered resolved if
            settled at NLRC.
          </InfoBanner>
        )}

      {restrictCaProgressOnly && (
        <InfoBanner tone="warning">
          CA details are saved and locked. Update CA Progress
          only, then save to continue the case workflow.
        </InfoBanner>
      )}

      {/* -----------------------------------------------------------
          CA DETAILS
         ----------------------------------------------------------- */}

      {caVisible && (
        <>
          <div className="grid gap-4 sm:grid-cols-4">
            {/* Date + Status */}

            <fieldset
              disabled={restrictCaDetailsEditing}
              className="contents"
            >
              <Field label="Date">
                <input
                  type="date"
                  className={inputCls}
                  value={value.ca.date}
                  onChange={(e) =>
                    setCa(
                      "date",
                      e.target.value,
                    )
                  }
                />
              </Field>

              <Field label="Status">
                <select
                  className={inputCls}
                  value={value.ca.status}
                  onChange={(e) =>
                    setCa(
                      "status",
                      e.target.value,
                    )
                  }
                >
                  <option value="">
                    Select Status
                  </option>

                  {STAGE_STATUS_OPTIONS.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {status}
                      </option>
                    ),
                  )}
                </select>
              </Field>
            </fieldset>

            <JudgmentAwardField
              label="Judgment Award"
              value={
                value.ca.judgmentAward
              }
              onChange={(v) =>
                setCa(
                  "judgmentAward",
                  v,
                )
              }
              amountSpecValue={
                value.ca
                  .judgmentAwardSpecification
              }
              onAmountSpecChange={(v) =>
                setCa(
                  "judgmentAwardSpecification",
                  v,
                )
              }
              computedSpecValue={
                value.ca
                  .judgmentAwardComputedSpecification
              }
              onComputedSpecChange={(v) =>
                setCa(
                  "judgmentAwardComputedSpecification",
                  v,
                )
              }
            />

            {/* Remarks */}

            <fieldset
              disabled={restrictCaProgressEditing}
              className="contents"
            >
              <Field label="Remarks">
                <select
                  className={inputCls}
                  value={value.ca.remarks}
                  onChange={(e) => {
                    const selected =
                      e.target.value;

                    onChange({
                      ...value,

                      ca: {
                        ...value.ca,
                        remarks: selected,
                        remarksSpecification:
                          selected === "Other"
                            ? value.ca
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
                    ),
                  )}
                </select>
              </Field>
            </fieldset>
          </div>

          {/* -------------------------------------------------------
              CA REMARK SPECIFICATION
             ------------------------------------------------------- */}

          {value.ca.remarks === "Other" && (
            <fieldset
              disabled={restrictCaProgressEditing}
              className="contents"
            >
              <div className="mt-3 grid gap-4 sm:grid-cols-3">
                <Field label="Specify Remarks">
                  <input
                    className={inputCls}
                    placeholder="Enter remarks"
                    value={
                      value.ca
                        .remarksSpecification ??
                      ""
                    }
                    onChange={(e) =>
                      setCa(
                        "remarksSpecification",
                        e.target.value,
                      )
                    }
                  />
                </Field>
              </div>
            </fieldset>
          )}
        </>
      )}

      {/* -----------------------------------------------------------
          CA PROGRESS
         ----------------------------------------------------------- */}

      {caVisible && (
        <div className="mt-3">
          <Field label="CA Progress">
            <select
              className={inputCls}
              value={value.caseProgress.ca}
              disabled={
                restrictCaProgressEditing
              }
              onChange={(e) => {
                const selected =
                  e.target.value as StageProgress;

                /*
                 * Check whether SC already contains ANY data.
                 */

                const scHasData =
                  !!value.sc.date ||
                  !!value.sc.status ||
                  !!value.sc.judgmentAward ||
                  !!value.sc
                    .judgmentAwardSpecification ||
                  !!value.sc
                    .judgmentAwardComputedSpecification ||
                  !!value.sc.remarks ||
                  !!value.sc
                    .remarksSpecification ||
                  !!value.caseProgress.sc ||
                  !!value.caseProgress
                    .scSpecification;

                /*
                 * If CA Progress changes away from
                 * Not Settled / Others, reset SC.
                 */

                const shouldResetSc =
                  scHasData &&
                  selected !== "Not Settled" &&
                  selected !== "Others";

                /*
                 * Clear Category when CA Progress becomes
                 * Not Settled or Others.
                 */

                const shouldResetCategory =
                  selected === "Not Settled" ||
                  selected === "Others";

                onChange({
                  ...value,

                  caseProgress: {
                    ...value.caseProgress,

                    ca: selected,

                    ...(selected === "Others" ||
                    selected === "Not Settled"
                      ? {}
                      : {
                          caSpecification: "",
                        }),

                    ...(shouldResetSc
                      ? {
                          sc: "",
                          scSpecification: "",
                        }
                      : {}),
                  },

                  ...(shouldResetSc
                    ? {
                        sc: {
                          ...value.sc,
                          date: "",
                          status: "",
                          judgmentAward: "",
                          judgmentAwardSpecification:
                            "",
                          judgmentAwardComputedSpecification:
                            "",
                          remarks: "",
                          remarksSpecification:
                            "",
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
                (
                  p,
                ): p is StageProgress =>
                  p !== "All",
              ).map((p) => (
                <option
                  key={p}
                  value={p}
                >
                  {p}
                </option>
              ))}
            </select>
          </Field>
        </div>
      )}

      {/* -----------------------------------------------------------
          CA PROGRESS SPECIFICATION
         ----------------------------------------------------------- */}

      {caVisible &&
        (value.caseProgress.ca ===
          "Others" ||
          value.caseProgress.ca ===
            "Not Settled") && (
          <fieldset
            disabled={
              restrictCaProgressEditing
            }
            className="contents"
          >
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              <Field label="Specify CA Progress">
                <input
                  className={inputCls}
                  placeholder="Enter progress"
                  value={
                    value.caseProgress
                      .caSpecification ??
                    ""
                  }
                  onChange={(e) =>
                    setProgressSpecification(
                      "ca",
                      e.target.value,
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