import type { CaseDraft, NlrcInfo, StageProgress } from "@/types/case";

import {
  PROGRESS_OPTIONS,
  APPEAL_STAGE_REMARKS_OPTIONS,
  STAGE_STATUS_OPTIONS,
} from "@/constants/caseOptions";
import type { FieldErrors } from "@/lib/caseValidation";

import { Field } from "@/components/cases/Field";
import { inputCls, JudgmentAwardField } from "@/components/cases/CurrencyField";
import { InfoBanner } from "@/components/dashboard/form/shared/InfoBanner";
import { SectionHeader, STAGE_STYLES } from "@/components/dashboard/form/shared/SectionHeader";

type NlrcSectionProps = {
  value: CaseDraft;
  onChange: (next: CaseDraft) => void;

  setNlrc: <K extends keyof NlrcInfo>(key: K, value: NlrcInfo[K]) => void;

  setProgressSpecification: (key: "la" | "nlrc" | "ca" | "sc", value: string) => void;

  senaFilled: boolean;
  laFilled: boolean;
  nlrcFilled: boolean;
  nlrcVisible: boolean;

  restrictNlrcDetailsEditing: boolean;
  restrictNlrcProgressOnly: boolean;
  restrictNlrcProgressEditing: boolean;

  errors?: FieldErrors;
};

export function NlrcSection({
  value,
  onChange,
  setNlrc,
  setProgressSpecification,
  senaFilled,
  laFilled,
  nlrcFilled,
  nlrcVisible,
  restrictNlrcDetailsEditing,
  restrictNlrcProgressOnly,
  restrictNlrcProgressEditing,
  errors = {},
}: NlrcSectionProps) {
  return (
    <div className={`rounded-xl border ${STAGE_STYLES.nlrc.ring} bg-white p-4 shadow-sm sm:p-5`}>
      <SectionHeader
        stage="nlrc"
        title="National Labor Relations Commission (NLRC)"
        status={!nlrcVisible ? "locked" : nlrcFilled ? "done" : "progress"}
      />

      {/* NLRC DISABLED — only when the section is actually locked */}
      {senaFilled && !nlrcVisible && !laFilled && (
        <InfoBanner tone="info">
          Complete all Labor Arbiter (LA) fields above (Date, Status, Judgment Award) to unlock this
          section.
        </InfoBanner>
      )}

      {senaFilled && !nlrcVisible && laFilled && (
        <InfoBanner tone="info">
          LA Progress must be &quot;Not Settled&quot; or &quot;Others&quot; to unlock NLRC. The case is
          considered resolved if settled at LA.
        </InfoBanner>
      )}

      {/* NLRC DETAILS LOCKED */}
      {restrictNlrcProgressOnly && (
        <InfoBanner tone="warning">
          NLRC details are saved and locked. Update NLRC Progress only, then save to continue the
          case workflow.
        </InfoBanner>
      )}

      {nlrcVisible && (
        <>
          <div className="grid gap-4">
            <fieldset disabled={restrictNlrcDetailsEditing} className="contents">
              <Field label="Date" error={errors["nlrc.date"]}>
                <input
                  type="date"
                  className={inputCls}
                  value={value.nlrc.date}
                  onChange={(e) => setNlrc("date", e.target.value)}
                />
              </Field>

              <Field label="Status" error={errors["nlrc.status"]}>
                <select
                  className={inputCls}
                  value={value.nlrc.status}
                  onChange={(e) => setNlrc("status", e.target.value)}
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
              value={value.nlrc.judgmentAward}
              onChange={(v) => setNlrc("judgmentAward", v)}
              amountSpecValue={value.nlrc.judgmentAwardSpecification}
              onAmountSpecChange={(v) => setNlrc("judgmentAwardSpecification", v)}
              computedSpecValue={value.nlrc.judgmentAwardComputedSpecification}
              onComputedSpecChange={(v) => setNlrc("judgmentAwardComputedSpecification", v)}
              amountError={errors["nlrc.judgmentAward"]}
              specError={errors["nlrc.judgmentAwardSpec"]}
            />

            <fieldset disabled={restrictNlrcProgressEditing} className="contents">
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
                          selected === "Other" ? value.nlrc.remarksSpecification ?? "" : "",
                      },
                    });
                  }}
                >
                  <option value="">Select Remarks</option>
                  {APPEAL_STAGE_REMARKS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Field>
            </fieldset>
          </div>

          {value.nlrc.remarks === "Other" && (
            <fieldset disabled={restrictNlrcProgressEditing} className="contents">
              <div className="mt-4 grid gap-4">
                <Field label="Specify Remarks" error={errors["nlrc.remarksSpec"]}>
                  <textarea
                    rows={3}
                    className={inputCls}
                    placeholder="Enter remarks"
                    value={value.nlrc.remarksSpecification ?? ""}
                    onChange={(e) => setNlrc("remarksSpecification", e.target.value)}
                  />
                </Field>
              </div>
            </fieldset>
          )}
        </>
      )}

      {/* NLRC PROGRESS */}
      {nlrcVisible && (
        <div className="mt-4">
          <Field label="NLRC Progress">
            <select
              className={inputCls}
              value={value.caseProgress.nlrc}
              disabled={restrictNlrcProgressEditing}
              onChange={(e) => {
                const selected = e.target.value as StageProgress;

                // Check whether CA already contains ANY data (including partial
                // data) so changing NLRC Progress can't leave stale CA info behind.
                const caHasData =
                  !!value.ca.date ||
                  !!value.ca.status ||
                  !!value.ca.judgmentAward ||
                  !!value.ca.judgmentAwardSpecification ||
                  !!value.ca.judgmentAwardComputedSpecification ||
                  !!value.ca.remarks ||
                  !!value.ca.remarksSpecification ||
                  !!value.caseProgress.ca ||
                  !!value.caseProgress.caSpecification;

                // Moving away from "Not Settled"/"Others" resets CA.
                const shouldResetCa =
                  caHasData && selected !== "Not Settled" && selected !== "Others";

                // Category is cleared when NLRC Progress becomes Not Settled/Others.
                const shouldResetCategory = selected === "Not Settled" || selected === "Others";

                onChange({
                  ...value,

                  caseProgress: {
                    ...value.caseProgress,

                    nlrc: selected,

                    ...(selected === "Others" || selected === "Not Settled"
                      ? {}
                      : { nlrcSpecification: "" }),

                    ...(shouldResetCa ? { ca: "", caSpecification: "" } : {}),
                  },

                  ...(shouldResetCa
                    ? {
                        ca: {
                          ...value.ca,
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

      {nlrcVisible &&
        (value.caseProgress.nlrc === "Others" || value.caseProgress.nlrc === "Not Settled") && (
          <fieldset disabled={restrictNlrcProgressEditing} className="contents">
            <div className="mt-4 grid gap-4">
              <Field label="Specify NLRC Progress" error={errors["nlrc.progressSpec"]}>
                <textarea
                  rows={3}
                  className={inputCls}
                  placeholder="Enter progress"
                  value={value.caseProgress.nlrcSpecification ?? ""}
                  onChange={(e) => setProgressSpecification("nlrc", e.target.value)}
                />
              </Field>
            </div>
          </fieldset>
        )}
    </div>
  );
}