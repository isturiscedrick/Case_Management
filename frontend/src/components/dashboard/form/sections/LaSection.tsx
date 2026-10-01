import type { CaseDraft, LaInfo, StageProgress } from "@/types/case";

import {
  PROGRESS_OPTIONS,
  STAGE_REMARKS_OPTIONS,
  STAGE_STATUS_OPTIONS,
} from "@/constants/caseOptions";
import type { FieldErrors } from "@/lib/caseValidation";

import { Field } from "@/components/cases/Field";
import { inputCls, JudgmentAwardField } from "@/components/cases/CurrencyField";
import { InfoBanner } from "@/components/dashboard/form/shared/InfoBanner";
import { SectionHeader, STAGE_STYLES } from "@/components/dashboard/form/shared/SectionHeader";

type LaSectionProps = {
  value: CaseDraft;
  onChange: (next: CaseDraft) => void;

  setLa: <K extends keyof LaInfo>(key: K, value: LaInfo[K]) => void;

  setProgressSpecification: (key: "la" | "nlrc" | "ca" | "sc", value: string) => void;

  senaFilled: boolean;
  laFilled: boolean;
  laVisible: boolean;

  restrictLaDetailsEditing: boolean;
  restrictLaProgressOnly: boolean;
  restrictLaProgressEditing: boolean;

  errors?: FieldErrors;
};

export function LaSection({
  value,
  onChange,
  setLa,
  setProgressSpecification,
  senaFilled,
  laFilled,
  laVisible,
  restrictLaDetailsEditing,
  restrictLaProgressOnly,
  restrictLaProgressEditing,
  errors = {},
}: LaSectionProps) {
  return (
    <div className={`rounded-xl border ${STAGE_STYLES.la.ring} bg-white p-4 shadow-sm sm:p-5`}>
      <SectionHeader
        stage="la"
        title="Labor Arbiter (LA)"
        status={!laVisible ? "locked" : laFilled ? "done" : "progress"}
      />

      {/* LA DISABLED — only when the section is actually locked */}
      {senaFilled && !laVisible && (
        <InfoBanner tone="info">
          Disabled while SEnA Remarks is &quot;Select Remarks&quot; or &quot;Settled&quot;, or while
          Specify Remarks is empty for &quot;Not Settled&quot;/&quot;Others&quot;.
        </InfoBanner>
      )}

      {/* LA DETAILS LOCKED */}
      {restrictLaProgressOnly && (
        <InfoBanner tone="warning">
          LA details are saved and locked. Update LA Progress only, then save to continue the case
          workflow.
        </InfoBanner>
      )}

      {laVisible && (
        <>
          <div className="grid gap-4">
            <fieldset disabled={restrictLaDetailsEditing} className="contents">
              <Field label="Date" error={errors["la.date"]}>
                <input
                  type="date"
                  className={inputCls}
                  value={value.la.date}
                  onChange={(e) => setLa("date", e.target.value)}
                />
              </Field>

              <Field label="Status" error={errors["la.status"]}>
                <select
                  className={inputCls}
                  value={value.la.status}
                  onChange={(e) => setLa("status", e.target.value)}
                >
                  <option value="">Select Status</option>
                  {STAGE_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </Field>
            </fieldset>

            <JudgmentAwardField
              label="Judgment Award"
              value={value.la.judgmentAward}
              onChange={(v) => setLa("judgmentAward", v)}
              amountSpecValue={value.la.judgmentAwardSpecification}
              onAmountSpecChange={(v) => setLa("judgmentAwardSpecification", v)}
              computedSpecValue={value.la.judgmentAwardComputedSpecification}
              onComputedSpecChange={(v) => setLa("judgmentAwardComputedSpecification", v)}
              amountError={errors["la.judgmentAward"]}
              specError={errors["la.judgmentAwardSpec"]}
            />

            <fieldset disabled={restrictLaProgressEditing} className="contents">
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
                          selected === "Other" ? value.la.remarksSpecification ?? "" : "",
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
            </fieldset>
          </div>

          {value.la.remarks === "Other" && (
            <fieldset disabled={restrictLaProgressEditing} className="contents">
              <div className="mt-4 grid gap-4">
                <Field label="Specify Remarks" error={errors["la.remarksSpec"]}>
                  <textarea
                    rows={3}
                    className={inputCls}
                    placeholder="Enter remarks"
                    value={value.la.remarksSpecification ?? ""}
                    onChange={(e) => setLa("remarksSpecification", e.target.value)}
                  />
                </Field>
              </div>
            </fieldset>
          )}
        </>
      )}

      {/* LA PROGRESS */}
      {laVisible && (
        <div className="mt-4">
          <Field label="LA Progress">
            <select
              className={inputCls}
              value={value.caseProgress.la}
              disabled={restrictLaProgressEditing}
              onChange={(e) => {
                const selected = e.target.value as StageProgress;

                // Does NLRC already contain any information?
                const nlrcHasData =
                  !!value.nlrc.date ||
                  !!value.nlrc.status ||
                  !!value.nlrc.judgmentAward ||
                  !!value.nlrc.judgmentAwardSpecification ||
                  !!value.nlrc.judgmentAwardComputedSpecification ||
                  !!value.nlrc.remarks ||
                  !!value.nlrc.remarksSpecification ||
                  !!value.caseProgress.nlrc ||
                  !!value.caseProgress.nlrcSpecification;

                // Moving away from "Not Settled"/"Others" clears NLRC.
                const shouldResetNlrc =
                  nlrcHasData && selected !== "Not Settled" && selected !== "Others";

                // Clear Total Paid category if LA is Not Settled/Others.
                const shouldResetCategory = selected === "Not Settled" || selected === "Others";

                onChange({
                  ...value,

                  caseProgress: {
                    ...value.caseProgress,

                    la: selected,

                    ...(selected === "Others" || selected === "Not Settled"
                      ? {}
                      : { laSpecification: "" }),

                    ...(shouldResetNlrc ? { nlrc: "", nlrcSpecification: "" } : {}),
                  },

                  ...(shouldResetNlrc
                    ? {
                        nlrc: {
                          ...value.nlrc,
                          date: "",
                          status: "",
                          judgmentAward: "",
                          judgmentAwardSpecification: "",
                          judgmentAwardComputedSpecification: "",
                          remarks: "",
                          remarksSpecification: "",
                        },
                      }
                    : {}),

                  ...(shouldResetCategory
                    ? { totalPaid: { ...value.totalPaid, category: "" } }
                    : {}),
                });
              }}
            >
              <option value="">Select Progress</option>
              {PROGRESS_OPTIONS.filter((p): p is StageProgress => p !== "All").map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>
        </div>
      )}

      {laVisible &&
        (value.caseProgress.la === "Others" || value.caseProgress.la === "Not Settled") && (
          <fieldset disabled={restrictLaProgressEditing} className="contents">
            <div className="mt-4 grid gap-4">
              <Field label="Specify LA Progress" error={errors["la.progressSpec"]}>
                <textarea
                  rows={3}
                  className={inputCls}
                  placeholder="Enter progress"
                  value={value.caseProgress.laSpecification ?? ""}
                  onChange={(e) => setProgressSpecification("la", e.target.value)}
                />
              </Field>
            </div>
          </fieldset>
        )}
    </div>
  );
}