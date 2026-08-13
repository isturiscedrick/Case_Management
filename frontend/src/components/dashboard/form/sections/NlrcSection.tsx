import type {
  CaseDraft,
  NlrcInfo,
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

export function NlrcSection({
  value,
  onChange,
  setNlrc,
  setProgressSpecification,
  senaFilled,
  laRequired,
  laFilled,
  nlrcEnabled,
  nlrcFilled,
  nlrcVisible,
  restrictNlrcDetailsEditing,
  restrictNlrcProgressOnly,
  restrictNlrcProgressEditing,
}: {
  value: CaseDraft;
  onChange: (next: CaseDraft) => void;
  setNlrc: <K extends keyof NlrcInfo>(
    key: K,
    v: NlrcInfo[K],
  ) => void;
  setProgressSpecification: (
    key: "la" | "nlrc" | "ca" | "sc",
    v: string,
  ) => void;
  senaFilled: boolean;
  laRequired: boolean;
  laFilled: boolean;
  nlrcEnabled: boolean;
  nlrcFilled: boolean;
  nlrcVisible: boolean;
  restrictNlrcDetailsEditing: boolean;
  restrictNlrcProgressOnly: boolean;
  restrictNlrcProgressEditing: boolean;
}) {
  return (
    <div
      className={`rounded-xl border ${STAGE_STYLES.nlrc.ring} bg-white p-4 shadow-sm sm:p-5`}
    >
      <SectionHeader
        stage="nlrc"
        title="National Labor Relations Commission (NLRC)"
        status={
          !nlrcVisible
            ? "locked"
            : nlrcFilled
            ? "done"
            : "progress"
        }
      />

      {/* -----------------------------------------------------------
          INFORMATION BANNERS
         ----------------------------------------------------------- */}

      {senaFilled && !laRequired && (
        <InfoBanner tone="info">
          Disabled while LA Progress is "Select Progress" or
          "Settled".
        </InfoBanner>
      )}

      {senaFilled && laRequired && !laFilled && (
        <InfoBanner tone="info">
          Complete all Labor Arbiter (LA) fields above (Date,
          Status, Judgment Award, Remarks) to unlock this
          section.
        </InfoBanner>
      )}

      {senaFilled &&
        laRequired &&
        laFilled &&
        !nlrcEnabled && (
          <InfoBanner tone="info">
            LA Progress must be "Not Settled" or "Others" to
            unlock NLRC. The case is considered resolved if
            settled at LA.
          </InfoBanner>
        )}

      {restrictNlrcProgressOnly && (
        <InfoBanner tone="warning">
          NLRC details are saved and locked. Update NLRC
          Progress only, then save to continue the case
          workflow.
        </InfoBanner>
      )}

      {/* -----------------------------------------------------------
          NLRC DETAILS
         ----------------------------------------------------------- */}

      {nlrcVisible && (
        <>
          <div className="grid gap-4 sm:grid-cols-4">
            {/* Date + Status */}
            <fieldset
              disabled={restrictNlrcDetailsEditing}
              className="contents"
            >
              <Field label="Date">
                <input
                  type="date"
                  className={inputCls}
                  value={value.nlrc.date}
                  onChange={(e) =>
                    setNlrc("date", e.target.value)
                  }
                />
              </Field>

              <Field label="Status">
                <select
                  className={inputCls}
                  value={value.nlrc.status}
                  onChange={(e) =>
                    setNlrc("status", e.target.value)
                  }
                >
                  <option value="">
                    Select Status
                  </option>

                  {STAGE_STATUS_OPTIONS.map((status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {status}
                    </option>
                  ))}
                </select>
              </Field>
            </fieldset>


            <JudgmentAwardField
              label="ment Award"
              value={value.nlrc.judgmentAward}
              onChange={(v) =>
                setNlrc("judgmentAward", v)
              }
              amountSpecValue={
                value.nlrc.judgmentAwardSpecification
              }
              onAmountSpecChange={(v) =>
                setNlrc(
                  "judgmentAwardSpecification",
                  v,
                )
              }
              computedSpecValue={
                value.nlrc
                  .judgmentAwardComputedSpecification
              }
              onComputedSpecChange={(v) =>
                setNlrc(
                  "judgmentAwardComputedSpecification",
                  v,
                )
              }
            />

            {/* Remarks */}
            <fieldset
              disabled={restrictNlrcDetailsEditing}
              className="contents"
            >
              <Field label="Remarks">
                <select
                  className={inputCls}
                  value={value.nlrc.remarks}
                  onChange={(e) => {
                    const selected = e.target.value;

                    onChange({
                      ...value,

                      nlrc: {
                        ...value.nlrc,
                        remarks: selected,
                        remarksSpecification:
                          selected === "Other"
                            ? value.nlrc
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
              NLRC REMARK SPECIFICATION
             ------------------------------------------------------- */}

          {value.nlrc.remarks === "Other" && (
            <fieldset
              disabled={restrictNlrcDetailsEditing}
              className="contents"
            >
              <div className="mt-3 grid gap-4 sm:grid-cols-3">
                <Field label="Specify Remarks">
                  <input
                    className={inputCls}
                    placeholder="Enter remarks"
                    value={
                      value.nlrc
                        .remarksSpecification ??
                      ""
                    }
                    onChange={(e) =>
                      setNlrc(
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
          NLRC PROGRESS
         ----------------------------------------------------------- */}

      {nlrcVisible && (
        <div className="mt-3">
          <Field label="NLRC Progress">
            <select
              className={inputCls}
              value={value.caseProgress.nlrc}
              disabled={
                restrictNlrcProgressEditing
              }
              onChange={(e) => {
                const selected =
                  e.target.value as StageProgress;

                /*
                 * Check whether CA already contains ANY data.
                 * We intentionally check partial data too so that
                 * changing NLRC Progress cannot leave stale CA
                 * information behind.
                 */

                const caHasData =
                  !!value.ca.date ||
                  !!value.ca.status ||
                  !!value.ca.judgmentAward ||
                  !!value.ca
                    .judgmentAwardSpecification ||
                  !!value.ca
                    .judgmentAwardComputedSpecification ||
                  !!value.ca.remarks ||
                  !!value.ca
                    .remarksSpecification ||
                  !!value.caseProgress.ca ||
                  !!value.caseProgress
                    .caSpecification;

                /*
                 * If the user moves away from
                 * "Not Settled" / "Others", CA must be
                 * reset because the workflow can no longer
                 * proceed to CA.
                 */

                const shouldResetCa =
                  caHasData &&
                  selected !== "Not Settled" &&
                  selected !== "Others";

                /*
                 * Category should be cleared when NLRC
                 * Progress becomes Not Settled or Others.
                 */

                const shouldResetCategory =
                  selected === "Not Settled" ||
                  selected === "Others";

                onChange({
                  ...value,

                  caseProgress: {
                    ...value.caseProgress,

                    nlrc: selected,

                    ...(selected === "Others" ||
                    selected === "Not Settled"
                      ? {}
                      : {
                          nlrcSpecification: "",
                        }),

                    ...(shouldResetCa
                      ? {
                          ca: "",
                          caSpecification: "",
                        }
                      : {}),
                  },

                  ...(shouldResetCa
                    ? {
                        ca: {
                          ...value.ca,
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
          NLRC PROGRESS SPECIFICATION
         ----------------------------------------------------------- */}

      {nlrcVisible &&
        (value.caseProgress.nlrc ===
          "Others" ||
          value.caseProgress.nlrc ===
            "Not Settled") && (
          <fieldset
            disabled={
              restrictNlrcProgressEditing
            }
            className="contents"
          >
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              <Field label="Specify NLRC Progress">
                <input
                  className={inputCls}
                  placeholder="Enter progress"
                  value={
                    value.caseProgress
                      .nlrcSpecification ??
                    ""
                  }
                  onChange={(e) =>
                    setProgressSpecification(
                      "nlrc",
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